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
  }),

  getters: {
    /**
     * Total expense amount for current loaded expenses
     */
    totalExpenses: (state) => {
      return state.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    },

    /**
     * Count of expense records
     */
    totalCount: (state) => state.expenses.length,

    /**
     * Expense breakdown by category
     * Returns an array of { category, total, percentage, count } sorted descending by total
     */
    expensesByCategory: (state) => {
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
    summaryByDate: (state) => {
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

      return summary;
    },
  },

  actions: {
    /**
     * Fetch all expense categories
     */
    async fetchCategories() {
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
     * Fetch expenses based on filters
     */
    async fetchExpenses() {
      this.loading = true;
      try {
        const items = await getAllExpenses({
          ...this.filters,
          category: this.selectedCategory,
        });
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
