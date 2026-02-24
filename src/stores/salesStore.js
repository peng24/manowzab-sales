// src/stores/salesStore.js
import { defineStore } from "pinia";
import { getAllSales } from "../services/salesService.js";

export const useSalesStore = defineStore("sales", {
  state: () => ({
    sales: [],
    loading: false,
    filters: {
      mode: "thisMonth",
      startDate: null,
      endDate: null,
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      limitCount: 200,
    },
    lastFetchTime: null,
  }),

  getters: {
    /**
     * Calculate total sales amount
     */
    totalSales: (state) => {
      return state.sales.reduce((sum, sale) => {
        return sum + (Number(sale.amount) || 0);
      }, 0);
    },

    /**
     * Get total number of orders
     */
    totalOrders: (state) => {
      return state.sales.length;
    },

    /**
     * Calculate total Transfer amount
     */
    totalTransfer: (state) => {
      return state.sales.reduce((sum, sale) => {
        const type = sale.type === "COD" ? "COD" : "Transfer";
        return type === "Transfer" ? sum + (Number(sale.amount) || 0) : sum;
      }, 0);
    },

    /**
     * Calculate total COD amount
     */
    totalCOD: (state) => {
      return state.sales.reduce((sum, sale) => {
        const type = sale.type === "COD" ? "COD" : "Transfer";
        return type === "COD" ? sum + (Number(sale.amount) || 0) : sum;
      }, 0);
    },

    /**
     * Get sales grouped by date
     * Returns object with date as key and array of sales as value
     */
    summaryByDate: (state) => {
      const summary = {};

      state.sales.forEach((sale) => {
        // Convert dateTime to Date object
        let dateObj;
        if (sale.dateTime && sale.dateTime.toDate) {
          dateObj = sale.dateTime.toDate();
        } else if (sale.dateTime) {
          dateObj = new Date(sale.dateTime);
        } else if (sale.date) {
          dateObj = new Date(sale.date);
        } else {
          return; // Skip if no valid date
        }

        // Format date as YYYY-MM-DD
        const dateKey = dateObj.toISOString().split("T")[0];

        if (!summary[dateKey]) {
          summary[dateKey] = {
            date: dateObj,
            sales: [],
            totalAmount: 0,
            totalCOD: 0,
            totalTransfer: 0,
            count: 0,
          };
        }

        const amount = Number(sale.amount) || 0;
        const type = sale.type === "COD" ? "COD" : "Transfer";

        summary[dateKey].sales.push(sale);
        summary[dateKey].totalAmount += amount;
        summary[dateKey].count += 1;

        if (type === "COD") {
          summary[dateKey].totalCOD += amount;
        } else {
          summary[dateKey].totalTransfer += amount;
        }
      });

      return summary;
    },

    /**
     * Get recent sales (limited to 10)
     */
    recentSales: (state) => {
      return state.sales.slice(0, 10).map((sale) => {
        let dateObj = null;
        if (sale.dateTime && sale.dateTime.toDate) {
          dateObj = sale.dateTime.toDate();
        } else if (sale.dateTime) {
          dateObj = new Date(sale.dateTime);
        } else if (sale.date) {
          dateObj = new Date(sale.date);
        }

        return {
          ...sale,
          dateTime: dateObj,
        };
      });
    },

    /**
     * Get sales with valid dates for charting
     */
    salesWithDates: (state) => {
      return state.sales
        .filter((sale) => {
          let dateObj;
          if (sale.dateTime && sale.dateTime.toDate) {
            dateObj = sale.dateTime.toDate();
          } else if (sale.dateTime) {
            dateObj = new Date(sale.dateTime);
          } else if (sale.date) {
            dateObj = new Date(sale.date);
          }

          return dateObj instanceof Date && !isNaN(dateObj);
        })
        .map((sale) => {
          let dateObj;
          if (sale.dateTime && sale.dateTime.toDate) {
            dateObj = sale.dateTime.toDate();
          } else if (sale.dateTime) {
            dateObj = new Date(sale.dateTime);
          } else {
            dateObj = new Date(sale.date);
          }

          return {
            ...sale,
            dateTime: dateObj,
          };
        });
    },
  },

  actions: {
    /**
     * Fetch sales from Firestore based on current filters
     */
    async fetchSales(customFilters = null) {
      this.loading = true;

      try {
        // Use custom filters if provided, otherwise use store filters
        const filters = customFilters || this.filters;

        const salesData = await getAllSales(filters);

        this.sales = salesData;
        this.lastFetchTime = new Date();

        return salesData;
      } catch (error) {
        console.error("Error fetching sales in store:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Update filter settings
     */
    updateFilters(newFilters) {
      this.filters = {
        ...this.filters,
        ...newFilters,
      };
    },

    /**
     * Reset filters to default
     */
    resetFilters() {
      this.filters = {
        mode: "thisMonth",
        startDate: null,
        endDate: null,
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        limitCount: 200,
      };
    },

    /**
     * Clear sales data
     */
    clearSales() {
      this.sales = [];
    },
  },
});
