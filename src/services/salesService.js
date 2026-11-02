// src/services/salesService.js
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  startAfter,
  writeBatch,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from "date-fns";
import { toDate, toFirestoreTimestamp } from "../utils/dateUtils.js";
import { normalizeCOD, classifyCOD } from "../utils/codUtils.js";
import { sanitizeCustomerId } from "../utils/formatUtils.js";
import { measureExecution } from "../utils/perfTracker.js";

/**
 * Get sales for a specific customer with optional date filtering and server-side pagination
 * @param {string} customerName - Name of the customer
 * @param {Object} options - Options
 * @param {Date} options.cutoffDate - Fetch sales on or after this date
 * @param {number} options.limitCount - Limit count
 * @param {DocumentSnapshot} options.lastDoc - Last document snapshot for pagination
 * @returns {Promise<{items: Array, lastDoc: DocumentSnapshot|null}>}
 */
export async function getSalesByCustomerName(customerName, options = {}) {
  return measureExecution(`salesService.getSalesByCustomerName(${customerName})`, async () => {
    const { cutoffDate = null, limitCount = 10, lastDoc = null } = options;
    try {
      const salesRef = collection(db, "sales");
      let q = query(
        salesRef,
        where("customerName", "==", customerName),
        orderBy("dateTime", "desc")
      );

      if (cutoffDate) {
        q = query(q, where("dateTime", ">=", cutoffDate));
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      q = query(q, limit(limitCount));

      const snapshot = await getDocs(q);
      const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { items, lastDoc: lastVisible };
    } catch (error) {
      console.error("Error in getSalesByCustomerName service:", error);
      throw error;
    }
  });
}

/**
 * Get all sales with optional filtering
 * @param {Object} filter - Filter options
 * @param {string} filter.mode - 'all', 'custom', 'month', 'year', 'today', 'thisWeek', 'thisMonth', 'thisYear', 'selectMonth'
 * @param {Date} filter.startDate - Start date for custom range
 * @param {Date} filter.endDate - End date for custom range
 * @param {number} filter.month - Month (0-11)
 * @param {number} filter.year - Year
 * @param {number} filter.limitCount - Limit number of records
 * @returns {Promise<Array>} Array of sales documents
 */
export async function getAllSales(filter = {}) {
  const modeLabel = filter.mode || "all";
  return measureExecution(`salesService.getAllSales(mode: '${modeLabel}')`, async () => {
    const {
      mode = "all",
      startDate = null,
      endDate = null,
      month = null,
      year = null,
      limitCount = null,
    } = filter;

    try {
      const salesRef = collection(db, "sales");
      const constraints = [];
      const now = new Date();
      let start = null;
      let end = null;

      switch (mode) {
        case "today":
          start = startOfDay(now);
          end = endOfDay(now);
          break;
        case "thisWeek": {
          const startObj = startDate ? toDate(startDate) : null;
          const endObj = endDate ? toDate(endDate) : null;
          start = startObj ? startOfDay(startObj) : startOfWeek(now, { weekStartsOn: 1 });
          end = endObj ? endOfDay(endObj) : endOfWeek(now, { weekStartsOn: 1 });
          break;
        }
        case "thisMonth":
          start = startOfMonth(now);
          end = endOfMonth(now);
          break;
        case "lastMonth": {
          const prevMonth = subMonths(now, 1);
          start = startOfMonth(prevMonth);
          end = endOfMonth(prevMonth);
          break;
        }
        case "thisYear":
          start = startOfYear(now);
          end = endOfYear(now);
          break;
        case "month":
        case "selectMonth":
          if (month !== null && year !== null) {
            const d = new Date(year, month);
            start = startOfMonth(d);
            end = endOfMonth(d);
          }
          break;
        case "year":
        case "selectYear":
          if (year !== null) {
            start = new Date(`${Number(year)}-01-01T00:00:00+07:00`);
            end = new Date(`${Number(year) + 1}-01-01T00:00:00+07:00`);
            end = new Date(end.getTime() - 1);
          }
          break;
        case "custom":
          if (startDate && endDate) {
            const startObj = toDate(startDate);
            const endObj = toDate(endDate);
            if (startObj && endObj) {
              start = startOfDay(startObj);
              end = endOfDay(endObj);
            }
          }
          break;
      }

      if (start && end) {
        constraints.push(where("dateTime", ">=", start), where("dateTime", "<=", end));
      }

      constraints.push(orderBy("dateTime", "desc"));

      if (limitCount) {
        constraints.push(limit(limitCount));
      }

      const q = query(salesRef, ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching sales:", error);
      throw error;
    }
  });
}

/**
 * Create a new sale
 * @param {Object} saleData - Sale data
 * @param {Date} saleData.dateTime - Date and time of sale
 * @param {string} saleData.customerName - Customer name
 * @param {number} saleData.amount - Sale amount
 * @param {string} saleData.type - Sale type ('COD' or 'Transfer')
 * @param {string} saleData.orderNo - Order number (optional)
 * @returns {Promise<Object>} Created sale document with ID
 */
function validateSale(data) {
  const timestamp = toFirestoreTimestamp(data.dateTime || data.date);
  if (!timestamp || !Number.isFinite(Number(data.amount)) || Number(data.amount) <= 0) throw new Error("วันที่และยอดเงินต้องถูกต้องและมากกว่า 0");
  if (data.itemCount !== undefined && (!Number.isInteger(Number(data.itemCount)) || Number(data.itemCount) < 1)) throw new Error("จำนวนตัวต้องเป็นจำนวนเต็มอย่างน้อย 1");
  return timestamp;
}
function assertCustomerAvailable(snapshot) {
  if (snapshot.exists() && snapshot.data().isMerging) throw new Error("ลูกค้าอยู่ระหว่างรวมบัญชี กรุณารอแล้วลองอีกครั้ง");
}
export async function createSale(saleData) {
  const { requestId, ...data } = saleData;
  if (!requestId || !/^[a-zA-Z0-9-]{10,100}$/.test(requestId)) throw new Error("ไม่พบรหัสคำขอบันทึก กรุณาเปิดฟอร์มใหม่");
  const timestamp = validateSale(data);
  const customerName = sanitizeCustomerId(data.customerName);
  const saleRef = doc(db, "sales", `TRF_${requestId}`);
  return runTransaction(db, async tx => {
    const existing = await tx.get(saleRef);
    if (existing.exists()) {
      const old = existing.data();
      if (Number(old.amount) !== Number(data.amount) || old.orderNo !== data.orderNo || old.customerName !== customerName
        || toDate(old.dateTime)?.getTime() !== timestamp.toDate().getTime() || Number(old.itemCount) !== Number(data.itemCount)) {
        throw new Error("คำขอนี้บันทึกแล้วแต่ข้อมูลในฟอร์มเปลี่ยน กรุณาตรวจประวัติและเปิดฟอร์มใหม่");
      }
      return { ...old, id: saleRef.id };
    }
    const customerRef = customerName ? doc(db, "customers", customerName) : null;
    if (customerRef) assertCustomerAvailable(await tx.get(customerRef));
    const payload = { ...data, customerName, amount: Number(data.amount), dateTime: timestamp, date: timestamp, createdAt: serverTimestamp() };
    tx.set(saleRef, payload);
    if (customerRef) tx.set(customerRef, { name: customerName, lastUpdate: serverTimestamp() }, { merge: true });
    return { ...payload, id: saleRef.id };
  });
}

export async function updateSale(id, data) {
  const saleRef = doc(db, "sales", id);
  return runTransaction(db, async tx => {
    const previous = await tx.get(saleRef);
    if (!previous.exists()) throw new Error("ไม่พบรายการขาย");
    const combined = { ...previous.data(), ...data };
    const timestamp = validateSale(combined);
    const name = sanitizeCustomerId(combined.customerName);
    const names = [...new Set([sanitizeCustomerId(previous.data().customerName), name].filter(Boolean))];
    for (const customer of names) assertCustomerAvailable(await tx.get(doc(db, "customers", customer)));
    tx.update(saleRef, { ...data, customerName: name, dateTime: timestamp, date: timestamp, amount: Number(combined.amount), updatedAt: serverTimestamp() });
    if (name) tx.set(doc(db, "customers", name), { name, lastUpdate: serverTimestamp() }, { merge: true });
  });
}

/**
 * Delete a sale
 * @param {string} id - Document ID
 * @returns {Promise<void>}
 */
export async function deleteSale(id) {
  try {
    const saleDoc = doc(db, "sales", id);
    await deleteDoc(saleDoc);
  } catch (error) {
    console.error("Error deleting sale:", error);
    throw error;
  }
}

/**
 * Create or update customer info
 * @param {Object} customerData - Customer data
 * @param {string} customerData.name - Customer name (sanitized)
 * @param {string} customerData.phoneNumber - Phone number (optional)
 * @param {string} customerData.address - Address (optional)
 * @param {string} customerData.note - Note (optional)
 * @returns {Promise<void>}
 */
export async function upsertCustomer(customerData) {
  try {
    const { name, ...otherData } = customerData;
    if (!name) throw new Error("Customer name is required");

    const cleanCustomerId = sanitizeCustomerId(name);
    const customerRef = doc(db, "customers", cleanCustomerId);
    
    // Read customer first to check if they are merging
    const customerSnap = await getDoc(customerRef);
    if (customerSnap.exists() && customerSnap.data().isMerging) {
      throw new Error(`ไม่สามารถอัปเดตข้อมูลลูกค้า ${name} ได้ในขณะนี้ เนื่องจากกำลังอยู่ระหว่างกระบวนการรวมบัญชีลูกค้า (Merging)`);
    }

    await setDoc(
      customerRef,
      {
        name: cleanCustomerId,
        ...otherData,
        lastUpdate: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error upserting customer:", error);
    throw error;
  }
}

/** Preview both historical date-based COD IDs and new stable IDs before import. */
export async function previewCODSales(items) {
  // Read by order number, including historical date-based document IDs.
  const orders = [...new Set(items.map(i => String(i.orderNo || i.trackingNo || "").trim()).filter(Boolean))];
  const existing = [];
  for (let i = 0; i < orders.length; i += 30) {
    const snapshot = await getDocs(query(collection(db, "sales"), where("orderNo", "in", orders.slice(i, i + 30))));
    existing.push(...snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
  }
  return classifyCOD(items, existing);
}

export async function batchImportCODSales(salesItems, onProgress = null) {
  const preview = await previewCODSales(salesItems);
  if (preview.some(i => i.importStatus === "invalid" || i.importStatus === "conflict")) throw new Error("พบข้อมูลผิดหรือขัดแย้ง กรุณาตรวจตัวอย่างรายการใหม่ก่อนบันทึก");
  let inserted = 0, skipped = 0, completed = 0;
  try {
    for (const item of preview) {
      if (item.importStatus === "duplicate") { skipped++; completed++; onProgress?.(completed, preview.length); continue; }
      const normalized = normalizeCOD(item);
      const saleRef = doc(db, "sales", normalized.id);
      const customerRef = normalized.customerName ? doc(db, "customers", normalized.customerName) : null;
      const added = await runTransaction(db, async tx => {
        const existing = await tx.get(saleRef);
        if (existing.exists()) {
          const check = classifyCOD([item], [{ ...existing.data(), id: existing.id }])[0];
          if (check.importStatus !== "duplicate") throw new Error("รายการ COD เปลี่ยนระหว่างบันทึก กรุณาตรวจประวัติ");
          return false;
        }
        if (customerRef) assertCustomerAvailable(await tx.get(customerRef));
        tx.set(saleRef, {
          type: "COD", orderNo: normalized.orderNo, trackingNo: item.trackingNo || "", carrier: normalized.carrier,
          customerName: normalized.customerName, amount: normalized.amount,
          dateTime: toFirestoreTimestamp(normalized.date), date: toFirestoreTimestamp(normalized.date),
          importedAt: serverTimestamp(), fileName: item.sourceFile || "",
          itemCount: Math.max(1, Math.floor(Number(item.itemCount) || 1)), isItemCountSet: Boolean(item.isItemCountSet),
        });
        if (customerRef) {
          const profile = { name: normalized.customerName, lastUpdate: serverTimestamp() };
          if (item.phoneNumber) profile.phoneNumber = item.phoneNumber;
          if (item.address) profile.address = item.address;
          tx.set(customerRef, profile, { merge: true });
        }
        return true;
      });
      if (added) inserted++; else skipped++;
      completed++; onProgress?.(completed, preview.length);
    }
    return { inserted, skipped };
  } catch (error) {
    throw new Error(`บันทึกใหม่แล้ว ${inserted} รายการ ข้าม ${skipped} รายการ: ${error.message} สามารถลองนำเข้าใหม่ได้ ระบบตรวจซ้ำก่อนบันทึก`);
  }
}

/**
 * Get the latest data import / creation date and time from all sales
 * @returns {Promise<Date|null>}
 */
export async function getLatestImportTime() {
  try {
    const salesRef = collection(db, "sales");

    // 1. Query latest COD sale (which has importedAt)
    const codQuery = query(
      salesRef,
      orderBy("importedAt", "desc"),
      limit(1)
    );

    // 2. Query latest Transfer sale (which has createdAt)
    const transferQuery = query(
      salesRef,
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const [codSnap, transferSnap] = await Promise.all([
      getDocs(codQuery),
      getDocs(transferQuery),
    ]);

    let latestTime = null;

    if (!codSnap.empty) {
      const docData = codSnap.docs[0].data();
      const t = toDate(docData.importedAt);
      if (t) latestTime = t;
    }

    if (!transferSnap.empty) {
      const docData = transferSnap.docs[0].data();
      const t = toDate(docData.createdAt);
      if (t) {
        if (!latestTime || t > latestTime) {
          latestTime = t;
        }
      }
    }

    return latestTime;
  } catch (error) {
    console.error("Error fetching latest import time:", error);
    return null;
  }
}

/**
 * Merge two customer records in Firestore.
 * - Updates all sales documents where customerName == sourceName to targetName.
 * - Deletes the source customer document.
 * - Merges phone number, address, and notes to the target customer if they are missing.
 *
 * @param {string} sourceName - The customer name to merge FROM (will be deleted)
 * @param {string} targetName - The customer name to merge INTO (will be kept)
 * @returns {Promise<{salesCount: number}>} Number of sales updated
 */
export async function mergeCustomers(sourceName, targetName) {
  const sourceId = sanitizeCustomerId(sourceName), targetId = sanitizeCustomerId(targetName);
  if (!sourceId || !targetId || sourceId === targetId) throw new Error("ต้องเลือกลูกค้าต่างกันสองราย");
  sourceName = sourceId; targetName = targetId;
  const sourceRef = doc(db, "customers", sourceId), targetRef = doc(db, "customers", targetId);
  const owner = crypto.randomUUID();
  await runTransaction(db, async tx => {
    const source = await tx.get(sourceRef), target = await tx.get(targetRef);
    if (!source.exists() || !target.exists()) throw new Error("ไม่พบลูกค้าต้นทางหรือปลายทาง");
    const sourceData = source.data(), targetData = target.data();
    if ([sourceData, targetData].some(d => d.isMerging && Number(d.mergeLeaseUntil) > Date.now())) throw new Error("ลูกค้ากำลังรวมบัญชีอยู่ กรุณารอหรือทำต่อเมื่อการทำงานเดิมสิ้นสุด");
    if (sourceData.mergeTarget && sourceData.mergeTarget !== targetId) throw new Error("ต้องทำการรวมบัญชีที่ค้างไปยังลูกค้าปลายทางเดิมให้เสร็จก่อน");
    // An expired target may have belonged to a different migration; do not steal it.
    if (targetData.mergeTarget && (targetData.mergeTarget !== targetId || targetData.mergeSource !== sourceId)) throw new Error("ปลายทางมีการรวมบัญชีที่ค้าง โปรดทำรายการเดิมต่อก่อน");
    const lock = { isMerging: true, mergeOwner: owner, mergeSource: sourceId, mergeTarget: targetId, mergeLeaseUntil: Date.now() + 15 * 60000 };
    tx.update(sourceRef, lock); tx.update(targetRef, lock);
  });
  let salesCount = 0;
  try {
    // Both profiles remain locked until every sale is moved. A retry queries only the remainder.
    while (true) {
      const snapshot = await getDocs(query(collection(db, "sales"), where("customerName", "==", sourceName), limit(400)));
      if (snapshot.empty || snapshot.docs.length === 0) break;
      await runTransaction(db, async tx => {
        const source = await tx.get(sourceRef), target = await tx.get(targetRef);
        if (source.data()?.mergeOwner !== owner || target.data()?.mergeOwner !== owner) throw new Error("สิทธิการรวมบัญชีเปลี่ยน กรุณาลองใหม่");
        // Read sale versions as well: do not overwrite a concurrent customer correction.
        const rows = await Promise.all(snapshot.docs.map(row => tx.get(doc(db, "sales", row.id))));
        for (const row of rows) if (row.exists() && row.data().customerName === sourceName) tx.update(row.ref, { customerName: targetName, updatedAt: serverTimestamp() });
        const lease = { mergeLeaseUntil: Date.now() + 15 * 60000 };
        tx.update(sourceRef, lease); tx.update(targetRef, lease);
      });
      salesCount += snapshot.docs.length;
    }
    await runTransaction(db, async tx => {
      const source = await tx.get(sourceRef), target = await tx.get(targetRef);
      if (source.data()?.mergeOwner !== owner || target.data()?.mergeOwner !== owner) throw new Error("สิทธิการรวมบัญชีเปลี่ยน กรุณาลองใหม่");
      const sourceData = source.data(), targetData = target.data();
      const targetPatch = {};
      for (const key of ["phoneNumber", "address"]) if (!targetData[key] && sourceData[key]) targetPatch[key] = sourceData[key];
      const notes = [...new Set([targetData.note, sourceData.note].filter(Boolean))];
      if (notes.length) targetPatch.note = notes.join(" | ");
      tx.update(targetRef, { ...targetPatch, isMerging: false, mergeOwner: null, mergeSource: null, mergeTarget: null, mergeLeaseUntil: 0, lastUpdate: serverTimestamp() });
      tx.delete(sourceRef);
    });
    return { salesCount };
  } catch (error) {
    await runTransaction(db, async tx => {
      const snapshots = await Promise.all([tx.get(sourceRef), tx.get(targetRef)]);
      for (const snap of snapshots) if (snap.exists() && snap.data().mergeOwner === owner) tx.update(snap.ref, { isMerging: false, mergeOwner: null, mergeLeaseUntil: 0 });
    }).catch(() => {});
    throw new Error(`รวมบัญชียังไม่เสร็จ ย้ายแล้ว ${salesCount} รายการ โปรดลองรวมไปปลายทางเดิมอีกครั้ง: ${error.message}`);
  }
}

/**
 * Batch update item count for multiple sales
 * @param {Array<{id: string, itemCount: number}>} updates - List of sale updates
 * @param {Function} onProgress - Progress callback (processed, total)
 * @returns {Promise<number>} Number of updated records
 */
export async function batchUpdateSaleItemCounts(updates, onProgress = null) {
  if (!updates || updates.length === 0) return 0;
  const BATCH_SIZE = 400;
  let processed = 0;

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const chunk = updates.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const item of chunk) {
      const saleRef = doc(db, "sales", item.id);
      batch.update(saleRef, {
        itemCount: Math.max(1, Math.floor(Number(item.itemCount) || 1)),
        isItemCountSet: true,
        updatedAt: new Date(),
      });
    }

    await batch.commit();
    processed += chunk.length;
    if (onProgress) {
      onProgress(processed, updates.length);
    }
  }

  return processed;
}


