// src/services/expenseService.js
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
  writeBatch,
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
import { measureExecution } from "../utils/perfTracker.js";

export const DEFAULT_EXPENSE_CATEGORIES = [
  "ค่าโฆษณา",
  "ค่าขนส่ง/บรรจุภัณฑ์",
  "ต้นทุนสินค้า",
  "ค่าเช่า/สาธารณูปโภค",
  "ค่าเงินเดือน/ค่าจ้าง",
  "อื่นๆ",
];

/**
 * Fetch all categories from Firestore.
 * Automatically seeds default categories ONLY IF collection is completely empty on initial load.
 */
export async function getExpenseCategories() {
  return measureExecution("expenseService.getExpenseCategories", async () => {
    try {
      const catRef = collection(db, "expenseCategories");
      let snapshot = await getDocs(query(catRef, orderBy("name", "asc")));

      // Auto-seed default categories ONLY IF collection is completely empty
      if (snapshot.empty) {
        console.log("Seeding default expense categories to Firestore...");
        const batch = writeBatch(db);
        DEFAULT_EXPENSE_CATEGORIES.forEach((catName, idx) => {
          const newDocRef = doc(catRef);
          batch.set(newDocRef, {
            name: catName,
            order: idx,
            createdAt: serverTimestamp(),
          });
        });
        await batch.commit();

        // Fetch snapshot again after seeding
        snapshot = await getDocs(query(catRef, orderBy("name", "asc")));
      }

      const items = snapshot.docs.map((d) => ({
        id: d.id,
        name: d.data().name,
        order: d.data().order ?? 0,
      }));

      // Sort by order ascending
      return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    } catch (error) {
      console.error("Error fetching expense categories:", error);
      // Fallback using safe IDs without slashes
      return DEFAULT_EXPENSE_CATEGORIES.map((cat, idx) => ({
        id: `default-${idx}`,
        name: cat,
        order: idx,
      }));
    }
  });
}

/**
 * Add an expense category to Firestore with order
 */
export async function addExpenseCategory(name, nextOrder = 0) {
  const trimmed = name?.trim();
  if (!trimmed) throw new Error("กรุณาระบุชื่อหมวดหมู่");

  try {
    const catRef = collection(db, "expenseCategories");
    const docRef = await addDoc(catRef, {
      name: trimmed,
      order: nextOrder,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, name: trimmed, order: nextOrder };
  } catch (error) {
    console.error("Error adding expense category:", error);
    throw error;
  }
}

/**
 * Update order for list of categories
 */
export async function updateCategoriesOrder(categories) {
  try {
    const batch = writeBatch(db);
    categories.forEach((cat, index) => {
      if (cat.id && !cat.id.startsWith("default-")) {
        const docRef = doc(db, "expenseCategories", cat.id);
        batch.update(docRef, { order: index });
      }
    });
    await batch.commit();
  } catch (error) {
    console.error("Error updating category order:", error);
    throw error;
  }
}

/**
 * Update/rename an expense category
 * Safely handles virtual/legacy IDs containing slashes or 'default-'
 */
export async function updateExpenseCategory(id, newName, oldName = null) {
  const trimmed = newName?.trim();
  if (!trimmed) throw new Error("กรุณาระบุชื่อหมวดหมู่ใหม่");

  try {
    const catRef = collection(db, "expenseCategories");
    const isVirtualId = id.startsWith("default-") || id.includes("/");

    if (isVirtualId) {
      // Find matching document by oldName if ID is virtual/legacy
      const searchName = oldName || newName;
      const q = query(catRef, where("name", "==", searchName));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const existingDoc = snap.docs[0];
        await updateDoc(existingDoc.ref, { name: trimmed, updatedAt: serverTimestamp() });
        id = existingDoc.id;
      } else {
        const newDocRef = await addDoc(catRef, { name: trimmed, createdAt: serverTimestamp() });
        id = newDocRef.id;
      }
    } else {
      const docRef = doc(db, "expenseCategories", id);
      await updateDoc(docRef, { name: trimmed, updatedAt: serverTimestamp() });
    }

    // Update existing expenses using oldName to newName
    if (oldName && oldName !== trimmed) {
      const expRef = collection(db, "expenses");
      const expSnapshot = await getDocs(query(expRef, where("category", "==", oldName)));
      if (!expSnapshot.empty) {
        const batch = writeBatch(db);
        expSnapshot.docs.forEach((expenseDoc) => {
          batch.update(expenseDoc.ref, { category: trimmed });
        });
        await batch.commit();
      }
    }

    return { id, name: trimmed };
  } catch (error) {
    console.error("Error updating expense category:", error);
    throw error;
  }
}

/**
 * Delete an expense category from Firestore.
 * Safely handles virtual/legacy IDs containing slashes or 'default-'
 */
export async function deleteExpenseCategory(id, categoryName = null) {
  try {
    const isVirtualId = id.startsWith("default-") || id.includes("/");

    if (isVirtualId) {
      if (categoryName) {
        const catRef = collection(db, "expenseCategories");
        const q = query(catRef, where("name", "==", categoryName));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
      }
      return id;
    }

    const docRef = doc(db, "expenseCategories", id);
    await deleteDoc(docRef);
    return id;
  } catch (error) {
    console.error("Error deleting expense category:", error);
    throw error;
  }
}

/**
 * Add a new expense record
 */
export async function addExpense(expenseData) {
  try {
    const { dateTime, title, amount, category, paymentMethod = "Transfer", note = "" } = expenseData;

    if (!amount || amount <= 0) {
      throw new Error("Invalid expense amount");
    }
    if (!category) {
      throw new Error("Category is required");
    }

    const docData = {
      dateTime: toFirestoreTimestamp(dateTime || new Date()),
      title: title ? title.trim() : category,
      amount: Number(amount),
      category: category.trim(),
      paymentMethod,
      note: note.trim(),
      createdAt: serverTimestamp(),
    };

    const expRef = collection(db, "expenses");
    const docRef = await addDoc(expRef, docData);
    return { id: docRef.id, ...docData };
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
}

/**
 * Get all expenses with optional filtering
 */
export async function getAllExpenses(filter = {}) {
  const modeLabel = filter.mode || "all";
  return measureExecution(`expenseService.getAllExpenses(mode: '${modeLabel}')`, async () => {
    const {
      mode = "all",
      startDate = null,
      endDate = null,
      month = null,
      year = null,
      category = null,
    } = filter;

    try {
      const expRef = collection(db, "expenses");
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
          start = startOfWeek(now, { weekStartsOn: 1 });
          end = endOfWeek(now, { weekStartsOn: 1 });
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
        case "selectMonth":
          if (month !== null && year !== null) {
            const targetDate = new Date(year, month, 1);
            start = startOfMonth(targetDate);
            end = endOfMonth(targetDate);
          }
          break;
        case "custom":
          if (startDate && endDate) {
            const startObj = toDate(startDate);
            const endObj = toDate(endDate);
            if (startObj && endObj && !isNaN(startObj.getTime()) && !isNaN(endObj.getTime())) {
              start = startOfDay(startObj);
              end = endOfDay(endObj);
            }
          }
          break;
      }

      if (start && end) {
        constraints.push(
          where("dateTime", ">=", Timestamp.fromDate(start)),
          where("dateTime", "<=", Timestamp.fromDate(end))
        );
      }

      constraints.push(orderBy("dateTime", "desc"));

      const q = query(expRef, ...constraints);
      const snapshot = await getDocs(q);

      let items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (category && category !== "all") {
        items = items.filter((item) => item.category === category);
      }

      return items;
    } catch (error) {
      console.error("Error fetching expenses:", error);
      throw error;
    }
  });
}

/**
 * Update an existing expense record
 */
export async function updateExpense(id, updateData) {
  try {
    const docRef = doc(db, "expenses", id);
    const dataToUpdate = { ...updateData };

    if (dataToUpdate.dateTime) {
      dataToUpdate.dateTime = toFirestoreTimestamp(dataToUpdate.dateTime);
    }
    if (dataToUpdate.amount !== undefined) {
      dataToUpdate.amount = Number(dataToUpdate.amount);
    }
    dataToUpdate.updatedAt = serverTimestamp();

    await updateDoc(docRef, dataToUpdate);
    return { id, ...dataToUpdate };
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
}

/**
 * Delete an expense record
 */
export async function deleteExpense(id) {
  try {
    const docRef = doc(db, "expenses", id);
    await deleteDoc(docRef);
    return id;
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
}
