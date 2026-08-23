// src/stores/expenseStore.js
import { defineStore } from "pinia";
import {
  getAllExpenses,
  addExpense as addExpenseService,
  updateExpense as updateExpenseService,
  deleteExpense as deleteExpenseService,
  getExpenseCategories,
  addExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  updateCategoriesOrder,
} from "../services/expenseService.js";
import { useSalesStore } from "./salesStore.js";
import { toDate } from "../utils/dateUtils.js";

export const useExpenseStore = defineStore("expense", {
  state: () => ({
    expenses: [],
    categories: [],
    loading: false,
    selectedCategory: "all",
    filters: {
      mode: "thisMonth",
      startDate: null,
      endDate: null,
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
    },
    autoOverheadRate:
      localStorage.getItem("salespilot_auto_overhead_rate") !== null
        ? Number(localStorage.getItem("salespilot_auto_overhead_rate"))
        : 2.0,
    autoOverheadEnabled:
      localStorage.getItem("salespilot_auto_overhead_enabled") !== "false",
    autoOverheadCategory: "ต้นทุนแฝง (ซัก-รีด)",
  }),

  getters: {
    /**
     * Count of sales for overhead calculation
     */
    totalOverheadCount: (state) => {
      if (!state.autoOverheadEnabled) return 0;
      const salesStore = useSalesStore();
      return salesStore.sales ? salesStore.sales.length : 0;
    },

    /**
     * Total calculated overhead cost for current period
     */
    totalOverheadCost(state) {
      if (!state.autoOverheadEnabled || state.autoOverheadRate <= 0) return 0;
      return this.totalOverheadCount * state.autoOverheadRate;
    },

    /**
     * Total recorded expenses (excluding auto overhead)
     */
    totalRecordedExpenses: (state) => {
      return state.expenses.reduce(
        (sum, item) => sum + (Number(item.amount) || 0),
        0
      );
    },

    /**
     * Total expense amount (including auto overhead if applicable)
     */
    totalExpenses(state) {
      const recorded = state.expenses.reduce(
        (sum, item) => sum + (Number(item.amount) || 0),
        0
      );
      if (
        state.selectedCategory !== "all" &&
        state.selectedCategory !== state.autoOverheadCategory
      ) {
        return recorded;
      }
      return recorded + this.totalOverheadCost;
    },

    /**
     * Count of expense records (including auto overhead item if enabled)
     */
    totalCount(state) {
      const baseCount = state.expenses.length;
      if (state.autoOverheadEnabled && this.totalOverheadCost > 0) {
        if (
          state.selectedCategory === "all" ||
          state.selectedCategory === state.autoOverheadCategory
        ) {
          return baseCount + 1;
        }
      }
      return baseCount;
    },

    /**
     * Virtual Auto Overhead Item
     */
    autoOverheadItem(state) {
      if (!state.autoOverheadEnabled || this.totalOverheadCost <= 0) return null;
      return {
        id: "auto-overhead-virtual",
        isAuto: true,
        title: `ต้นทุนแฝงซัก-รีด (${this.totalOverheadCount} ตัว × ฿${state.autoOverheadRate.toFixed(2)})`,
        category: state.autoOverheadCategory,
        amount: this.totalOverheadCost,
        dateTime: new Date(),
        paymentMethod: "Auto",
        note: "คำนวณอัตโนมัติจากยอดขาย (ค่าน้ำ, ค่าไฟซัก, ค่าไฟรีด, น้ำยาซัก/ปรับผ้านุ่ม)",
        count: this.totalOverheadCount,
        rate: state.autoOverheadRate,
      };
    },

    /**
     * Expense breakdown by category
     * Returns an array of { category, total, percentage, count } sorted descending by total
     */
    expensesByCategory(state) {
      const summary = {};
      let grandTotal = 0;

      state.expenses.forEach((exp) => {
        const cat = exp.category || "อื่นๆ";
        const amt = Number(exp.amount) || 0;
        grandTotal += amt;

        if (!summary[cat]) {
          summary[cat] = { category: cat, total: 0, count: 0 };
        }
        summary[cat].total += amt;
        summary[cat].count += 1;
      });

      if (state.autoOverheadEnabled && this.totalOverheadCost > 0) {
        const cat = state.autoOverheadCategory;
        grandTotal += this.totalOverheadCost;
        if (!summary[cat]) {
          summary[cat] = { category: cat, total: 0, count: 0, isAuto: true };
        }
        summary[cat].total += this.totalOverheadCost;
        summary[cat].count += 1;
      }

      return Object.values(summary)
        .map((item) => ({
          ...item,
          percentage: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);
    },

    /**
     * Group expenses by date (YYYY-MM-DD)
     */
    summaryByDate(state) {
      const summary = {};

      state.expenses.forEach((exp) => {
        const dateObj = toDate(exp.dateTime);
        if (!dateObj || isNaN(dateObj.getTime())) return;

        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const dateKey = `${year}-${month}-${day}`;

        if (!summary[dateKey]) {
          summary[dateKey] = {
            date: dateObj,
            expenses: [],
            totalAmount: 0,
            count: 0,
          };
        }

        const amount = Number(exp.amount) || 0;
        summary[dateKey].expenses.push(exp);
        summary[dateKey].totalAmount += amount;
        summary[dateKey].count += 1;
      });

      // Add daily overhead if enabled and category allows it
      if (
        state.autoOverheadEnabled &&
        state.autoOverheadRate > 0 &&
        (state.selectedCategory === "all" ||
          state.selectedCategory === state.autoOverheadCategory)
      ) {
        const salesStore = useSalesStore();
        const salesSummary = salesStore.summaryByDate || {};

        Object.keys(salesSummary).forEach((dateKey) => {
          const daySales = salesSummary[dateKey];
          const dayCount = daySales.count || 0;
          if (dayCount > 0) {
            const dayOverheadAmount = dayCount * state.autoOverheadRate;
            if (!summary[dateKey]) {
              summary[dateKey] = {
                date: daySales.date,
                expenses: [],
                totalAmount: 0,
                count: 0,
              };
            }

            summary[dateKey].expenses.push({
              id: `auto-overhead-${dateKey}`,
              isAuto: true,
              title: `ต้นทุนแฝงซัก-รีด (${dayCount} ตัว × ฿${state.autoOverheadRate.toFixed(2)})`,
              category: state.autoOverheadCategory,
              amount: dayOverheadAmount,
              dateTime: daySales.date,
              paymentMethod: "Auto",
              note: "คำนวณอัตโนมัติจากยอดขาย (ค่าน้ำ, ค่าไฟซัก, ค่าไฟรีด, น้ำยาซัก/ปรับผ้านุ่ม)",
            });
            summary[dateKey].totalAmount += dayOverheadAmount;
            summary[dateKey].count += 1;
          }
        });
      }

      return summary;
    },
  },

  actions: {
    /**
     * Update overhead configuration
     */
    updateOverheadSettings({ rate, enabled }) {
      if (rate !== undefined && !isNaN(rate) && Number(rate) >= 0) {
        this.autoOverheadRate = Number(rate);
        localStorage.setItem("salespilot_auto_overhead_rate", String(rate));
      }
      if (enabled !== undefined) {
        this.autoOverheadEnabled = Boolean(enabled);
        localStorage.setItem(
          "salespilot_auto_overhead_enabled",
          String(enabled)
        );
      }
    },

    /**
     * Fetch all expense categories
     * @param {boolean} forceRefresh - Force query from Firestore
     */
    async fetchCategories(forceRefresh = false) {
      if (this.categories.length > 0 && !forceRefresh) {
        return this.categories;
      }
      try {
        const cats = await getExpenseCategories();
        this.categories = cats;
        return cats;
      } catch (error) {
        console.error("Error in fetchCategories:", error);
      }
    },

    /**
     * Add a custom expense category
     */
    async createCategory(name) {
      try {
        const nextOrder = this.categories.length;
        const newCat = await addExpenseCategory(name, nextOrder);
        this.categories.push(newCat);
        return newCat;
      } catch (error) {
        console.error("Error in createCategory:", error);
        throw error;
      }
    },

    /**
     * Reorder categories
     */
    async reorderCategories(orderedList) {
      this.categories = orderedList;
      try {
        await updateCategoriesOrder(orderedList);
      } catch (error) {
        console.error("Error in reorderCategories:", error);
      }
    },

    /**
     * Edit/rename expense category
     */
    async editCategory(id, newName, oldName = null) {
      try {
        const updated = await updateExpenseCategory(id, newName, oldName);
        const idx = this.categories.findIndex((cat) => cat.id === id);
        if (idx !== -1) {
          this.categories[idx] = updated;
        }
        await this.fetchExpenses();
        return updated;
      } catch (error) {
        console.error("Error in editCategory:", error);
        throw error;
      }
    },

    /**
     * Remove expense category
     */
    async removeCategory(id, categoryName = null) {
      try {
        await deleteExpenseCategory(id, categoryName);
        await this.fetchCategories();
      } catch (error) {
        console.error("Error in removeCategory:", error);
        throw error;
      }
    },

    /**
     * Fetch expenses based on filters and sync salesStore
     */
    async fetchExpenses() {
      this.loading = true;
      try {
        const salesStore = useSalesStore();
        const [items] = await Promise.all([
          getAllExpenses({
            ...this.filters,
            category: this.selectedCategory,
          }),
          salesStore.fetchSales({ ...this.filters }),
        ]);
        this.expenses = items;
      } catch (error) {
        console.error("Error fetching expenses in store:", error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Set filters and reload expenses
     */
    async setFilter(newFilters) {
      this.filters = { ...this.filters, ...newFilters };
      await this.fetchExpenses();
    },

    /**
     * Set selected category filter
     */
    async setCategoryFilter(category) {
      this.selectedCategory = category;
      await this.fetchExpenses();
    },

    /**
     * Add new expense record
     */
    async createExpense(expenseData) {
      this.loading = true;
      try {
        const newExp = await addExpenseService(expenseData);
        await this.fetchExpenses();
        return newExp;
      } catch (error) {
        console.error("Error creating expense:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Edit expense record
     */
    async editExpense(id, updateData) {
      this.loading = true;
      try {
        const updated = await updateExpenseService(id, updateData);
        await this.fetchExpenses();
        return updated;
      } catch (error) {
        console.error("Error editing expense:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Delete expense record
     */
    async removeExpense(id) {
      this.loading = true;
      try {
        await deleteExpenseService(id);
        this.expenses = this.expenses.filter((exp) => exp.id !== id);
      } catch (error) {
        console.error("Error deleting expense:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});

