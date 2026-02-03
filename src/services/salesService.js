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
} from "firebase/firestore";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

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
    limitCount = 200,
  } = filter;

  try {
    const salesRef = collection(db, "sales");
    let q;

    if (mode === "all") {
      // All Time - with limit to prevent overload
      q = query(salesRef, orderBy("dateTime", "desc"), limit(limitCount));
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
      // Fallback to all with limit
      q = query(salesRef, orderBy("dateTime", "desc"), limit(limitCount));
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
