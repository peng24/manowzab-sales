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
} from "firebase/firestore";
import {
  format,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { toDate } from "../utils/dateUtils.js";

/**
 * Get all sales with optional filtering
 * @param {Object} filter - Filter options
 * @param {string} filter.mode - 'all', 'custom', 'month', 'year', 'today', 'thisWeek', 'thisMonth', 'thisYear', 'selectMonth'
 * @param {Date} filter.startDate - Start date for custom range
 * @param {Date} filter.endDate - End date for custom range
 * @param {number} filter.month - Month (0-11)
 * @param {number} filter.year - Year
 * @param {number} filter.limitCount - Limit number of records (default: 200)
 * @returns {Promise<Array>} Array of sales documents
 */
export async function getAllSales(filter = {}) {
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
    let q;

    if (mode === "all") {
      // All Time
      if (limitCount) {
        q = query(salesRef, orderBy("dateTime", "desc"), limit(limitCount));
      } else {
        q = query(salesRef, orderBy("dateTime", "desc"));
      }
    } else if (mode === "custom" && startDate && endDate) {
      // Custom Range
      const start = startOfDay(new Date(startDate));
      const end = endOfDay(new Date(endDate));

      q = query(
        salesRef,
        where("dateTime", ">=", start),
        where("dateTime", "<=", end),
        orderBy("dateTime", "desc"),
      );
    } else if (mode === "month" && month !== null && year !== null) {
      // Specific Month
      const start = startOfMonth(new Date(year, month));
      const end = endOfMonth(new Date(year, month));

      q = query(
        salesRef,
        where("dateTime", ">=", start),
        where("dateTime", "<=", end),
        orderBy("dateTime", "desc"),
      );
    } else if (mode === "year" && year !== null) {
      // Specific Year
      const start = startOfYear(new Date(year, 0));
      const end = endOfYear(new Date(year, 0));

      q = query(
        salesRef,
        where("dateTime", ">=", start),
        where("dateTime", "<=", end),
        orderBy("dateTime", "desc"),
      );
    } else if (mode === "today") {
      // Today
      const start = startOfDay(new Date());
      const end = endOfDay(new Date());

      q = query(
        salesRef,
        where("dateTime", ">=", start),
        where("dateTime", "<=", end),
        orderBy("dateTime", "desc"),
      );
    } else if (mode === "thisWeek" && startDate && endDate) {
      // This Week (requires start and end dates from caller)
      q = query(
        salesRef,
        where("dateTime", ">=", startDate),
        where("dateTime", "<=", endDate),
        orderBy("dateTime", "desc"),
      );
    } else if (mode === "thisMonth") {
      // This Month
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());

      q = query(
        salesRef,
        where("dateTime", ">=", start),
        where("dateTime", "<=", end),
        orderBy("dateTime", "desc"),
      );
    } else if (mode === "thisYear") {
      // This Year
      const start = startOfYear(new Date());
      const end = endOfYear(new Date());

      q = query(
        salesRef,
        where("dateTime", ">=", start),
        where("dateTime", "<=", end),
        orderBy("dateTime", "desc"),
      );
    } else if (mode === "selectMonth" && month !== null && year !== null) {
      // Select specific month (same as 'month' mode)
      const start = startOfMonth(new Date(year, month));
      const end = endOfMonth(new Date(year, month));

      q = query(
        salesRef,
        where("dateTime", ">=", start),
        where("dateTime", "<=", end),
        orderBy("dateTime", "desc"),
      );
    } else {
      // Fallback to all
      if (limitCount) {
        q = query(salesRef, orderBy("dateTime", "desc"), limit(limitCount));
      } else {
        q = query(salesRef, orderBy("dateTime", "desc"));
      }
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching sales:", error);
    throw error;
  }
}

/**
 * Get sales by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Array of sales documents
 */
export async function getSalesByDateRange(startDate, endDate) {
  return getAllSales({
    mode: "custom",
    startDate,
    endDate,
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
    const salesRef = collection(db, "sales");
    const docRef = await addDoc(salesRef, {
      ...saleData,
      createdAt: new Date(),
    });

    return {
      id: docRef.id,
      ...saleData,
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
    const saleDoc = doc(db, "sales", id);
    await updateDoc(saleDoc, {
      ...data,
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

    const { serverTimestamp } = await import("firebase/firestore");
    const customerRef = doc(db, "customers", name);
    await setDoc(
      customerRef,
      {
        name,
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

      // Sales operation
      const salesDocId = `COD_${item.orderNo}_${dateSuffix}`;
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
        const customerId = item.customerName; // Assume already sanitized by caller
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
  try {
    const { writeBatch, doc, getDoc, getDocs, collection, query, where } = await import("firebase/firestore");
    
    if (!sourceName || !targetName) {
      throw new Error("ทั้งชื่อลูกค้าต้นทางและปลายทางมีความจำเป็น");
    }
    if (sourceName === targetName) {
      throw new Error("ชื่อลูกค้าต้นทางและปลายทางไม่สามารถเป็นชื่อเดียวกันได้");
    }

    const sourceRef = doc(db, "customers", sourceName);
    const targetRef = doc(db, "customers", targetName);

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
    const updatedTargetData = {};
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
    updatedTargetData.lastUpdate = new Date();

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
    throw error;
  }
}


