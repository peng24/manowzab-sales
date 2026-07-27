// src/services/salesService.js
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  startAfter,
} from "firebase/firestore";
import {
  format,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from "date-fns";
import { toDate, toFirestoreTimestamp } from "../utils/dateUtils.js";
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
        case "thisWeek":
          if (startDate && endDate) {
            start = startDate;
            end = endDate;
          }
          break;
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
          if (year !== null) {
            const d = new Date(year, 0);
            start = startOfYear(d);
            end = endOfYear(d);
          }
          break;
        case "custom":
          if (startDate && endDate) {
            start = startOfDay(new Date(startDate));
            end = endOfDay(new Date(endDate));
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
export async function createSale(saleData) {
  try {
    const timestamp = toFirestoreTimestamp(saleData.dateTime || saleData.date);

    if (saleData.customerName) {
      const cleanCustomerId = sanitizeCustomerId(saleData.customerName);
      const customerRef = doc(db, "customers", cleanCustomerId);
      const cSnap = await getDoc(customerRef);
      if (cSnap.exists() && cSnap.data().isMerging) {
        throw new Error(`ไม่สามารถเพิ่มรายการขายได้ เนื่องจากลูกค้า "${saleData.customerName}" อยู่ระหว่างกระบวนการรวมบัญชีลูกค้า (Merging)`);
      }
    }

    const salesRef = collection(db, "sales");
    const docRef = await addDoc(salesRef, {
      ...saleData,
      dateTime: timestamp,
      date: timestamp,
      createdAt: new Date(),
    });

    return {
      id: docRef.id,
      ...saleData,
      dateTime: timestamp ? (timestamp.toDate ? timestamp.toDate() : timestamp) : null,
      date: timestamp ? (timestamp.toDate ? timestamp.toDate() : timestamp) : null,
    };
  } catch (error) {
    console.error("Error creating sale:", error);
    throw error;
  }
}

/**
 * Update an existing sale
 * @param {string} id - Document ID
 * @param {Object} data - Updated data
 * @returns {Promise<void>}
 */
export async function updateSale(id, data) {
  try {
    const updatePayload = { ...data };
    
    if (data.dateTime || data.date) {
      const ts = toFirestoreTimestamp(data.dateTime || data.date);
      updatePayload.dateTime = ts;
      updatePayload.date = ts;
    }

    if (data.customerName) {
      const cleanCustomerId = sanitizeCustomerId(data.customerName);
      const customerRef = doc(db, "customers", cleanCustomerId);
      const cSnap = await getDoc(customerRef);
      if (cSnap.exists() && cSnap.data().isMerging) {
        throw new Error(`ไม่สามารถแก้ไขรายการขายได้ เนื่องจากลูกค้า "${data.customerName}" อยู่ระหว่างกระบวนการรวมบัญชีลูกค้า (Merging)`);
      }
    }

    const saleDoc = doc(db, "sales", id);
    await updateDoc(saleDoc, {
      ...updatePayload,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating sale:", error);
    throw error;
  }
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

    const { serverTimestamp } = await import("firebase/firestore");
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

/**
 * Import a batch of COD sales and upsert customer profiles.
 * Safe chunking: 200 items (max 400 operations) per batch.
 * @param {Array} salesItems - Array of raw sale objects to import
 * @param {Function} onProgress - Progress callback (index, total)
 * @returns {Promise<void>}
 */
export async function batchImportCODSales(salesItems, onProgress = null) {
  try {
    const { writeBatch, serverTimestamp } = await import("firebase/firestore");
    const BATCH_SIZE = 200; // Safe chunk size (200 sales + 200 customer updates = 400 ops max)

    const allOperations = [];
    const customerUpdates = new Map();

    // 1. Prepare operations
    for (const item of salesItems) {
      const dateObj = new Date(item.date);
      const dateSuffix = format(dateObj, "yyyyMMdd");

      // Sales operation (sanitize orderNo to prevent slashes breaking doc path)
      const cleanOrderNo = String(item.orderNo || "").replace(/\//g, "-");
      const salesDocId = `COD_${cleanOrderNo}_${dateSuffix}`;
      const salesData = {
        type: "COD",
        orderNo: item.orderNo,
        customerName: item.customerName,
        amount: Number(item.amount),
        date: item.date,
        dateTime: dateObj,
        importedAt: serverTimestamp(),
        fileName: item.sourceFile,
      };

      allOperations.push({
        type: "sales",
        id: salesDocId,
        data: salesData,
      });

      // Customer operation
      if (item.customerName && item.customerName.trim().length > 0) {
        const customerId = sanitizeCustomerId(item.customerName);
        const customerData = {
          name: customerId,
          lastUpdate: serverTimestamp(),
        };

        if (item.phoneNumber) customerData.phoneNumber = item.phoneNumber;
        if (item.address) customerData.address = item.address;

        customerUpdates.set(customerId, customerData);
      }
    }

    // Add unique customer updates
    customerUpdates.forEach((data, id) => {
      allOperations.push({
        type: "customer",
        id: id,
        data: data,
      });
    });

    // 2. Process in chunks
    const chunks = [];
    for (let i = 0; i < allOperations.length; i += BATCH_SIZE) {
      chunks.push(allOperations.slice(i, i + BATCH_SIZE));
    }

    let processedCount = 0;
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const batch = writeBatch(db);

      for (const op of chunk) {
        if (op.type === "sales") {
          const docRef = doc(db, "sales", op.id);
          batch.set(docRef, op.data, { merge: true });
        } else if (op.type === "customer") {
          const docRef = doc(db, "customers", op.id);
          batch.set(docRef, op.data, { merge: true });
        }
      }

      await batch.commit();
      processedCount += chunk.length;

      if (onProgress) {
        // Report approximate items count (half of total operations processed)
        const completedItems = Math.min(
          processedCount / 2,
          salesItems.length
        );
        onProgress(Math.floor(completedItems), salesItems.length);
      }
    }
  } catch (error) {
    console.error("Error in batchImportCODSales service:", error);
    throw error;
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
  const { writeBatch, doc, getDoc, getDocs, collection, query, where } = await import("firebase/firestore");
  
  if (!sourceName || !targetName) {
    throw new Error("ทั้งชื่อลูกค้าต้นทางและปลายทางมีความจำเป็น");
  }
  if (sourceName === targetName) {
    throw new Error("ชื่อลูกค้าต้นทางและปลายทางไม่สามารถเป็นชื่อเดียวกันได้");
  }

  const cleanSourceId = sanitizeCustomerId(sourceName);
  const cleanTargetId = sanitizeCustomerId(targetName);

  const sourceRef = doc(db, "customers", cleanSourceId);
  const targetRef = doc(db, "customers", cleanTargetId);

  // 1. Lock both customers by setting isMerging: true using a batch
  const lockBatch = writeBatch(db);
  lockBatch.update(sourceRef, { isMerging: true });
  lockBatch.update(targetRef, { isMerging: true });
  await lockBatch.commit();

  try {
    const [sourceSnap, targetSnap] = await Promise.all([
      getDoc(sourceRef),
      getDoc(targetRef),
    ]);

    if (!sourceSnap.exists()) {
      throw new Error(`ไม่พบข้อมูลลูกค้าต้นทาง: ${sourceName}`);
    }
    if (!targetSnap.exists()) {
      throw new Error(`ไม่พบข้อมูลลูกค้าปลายทาง: ${targetName}`);
    }

    const sourceData = sourceSnap.data();
    const targetData = targetSnap.data();

    // Fetch all sales for source customer
    const salesRef = collection(db, "sales");
    const salesQuery = query(salesRef, where("customerName", "==", sourceName));
    const salesSnap = await getDocs(salesQuery);
    const salesDocs = salesSnap.docs;

    // Prepare target customer merged data
    const updatedTargetData = {
      isMerging: false, // Unlock target
      lastUpdate: new Date(),
    };
    if (!targetData.phoneNumber && sourceData.phoneNumber) {
      updatedTargetData.phoneNumber = sourceData.phoneNumber;
    }
    if (!targetData.address && sourceData.address) {
      updatedTargetData.address = sourceData.address;
    }
    
    // Notes merging logic
    const tNote = (targetData.note || "").trim();
    const sNote = (sourceData.note || "").trim();
    if (sNote) {
      if (!tNote) {
        updatedTargetData.note = sNote;
      } else if (tNote !== sNote && !tNote.includes(sNote)) {
        updatedTargetData.note = `${tNote} | ${sNote}`;
      }
    }

    const BATCH_SIZE = 400; // Safe size to fit inside 500 limit
    let batch = writeBatch(db);
    batch.update(targetRef, updatedTargetData);
    batch.delete(sourceRef);

    let operationsInBatch = 2; // target update + source delete

    for (let i = 0; i < salesDocs.length; i++) {
      if (operationsInBatch >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        operationsInBatch = 0;
      }
      const saleDocRef = doc(db, "sales", salesDocs[i].id);
      batch.update(saleDocRef, {
        customerName: targetName,
        updatedAt: new Date(),
      });
      operationsInBatch++;
    }

    if (operationsInBatch > 0) {
      await batch.commit();
    }

    return { salesCount: salesDocs.length };
  } catch (error) {
    console.error("Error merging customers in service:", error);
    // Guarantee unlock both customer documents on error
    const unlockBatch = writeBatch(db);
    unlockBatch.update(sourceRef, { isMerging: false }).catch(() => {});
    unlockBatch.update(targetRef, { isMerging: false }).catch(() => {});
    await unlockBatch.commit().catch(() => {});
    throw error;
  }
}


