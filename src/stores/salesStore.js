// src/stores/salesStore.js
import { defineStore } from "pinia";
import {
  getAllSales,
  createSale as createSaleService,
  updateSale as updateSaleService,
  deleteSale as deleteSaleService,
  batchImportCODSales,
  upsertCustomer,
  getLatestImportTime,
  mergeCustomers as mergeCustomersService,
} from "../services/salesService.js";
import { toDate } from "../utils/dateUtils.js";

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
    lastImportedTime: null,
    loadedFilters: null,
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
        const dateObj = toDate(sale.dateTime || sale.date);
        if (!dateObj || isNaN(dateObj.getTime())) return; // Skip invalid dates

        // Format date as YYYY-MM-DD (Local Time)
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const dateKey = `${year}-${month}-${day}`;

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
        const dateObj = toDate(sale.dateTime || sale.date);
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
          const dateObj = toDate(sale.dateTime || sale.date);
          return dateObj instanceof Date && !isNaN(dateObj);
        })
        .map((sale) => {
          const dateObj = toDate(sale.dateTime || sale.date);
          return {
            ...sale,
            dateTime: dateObj,
          };
        });
    },
  },

  actions: {
    /**
     * Fetch sales from Firestore based on current filters.
     * Uses cache if filters match and data was fetched within 5 minutes.
     */
    async fetchSales(customFilters = null) {
      const filters = customFilters || this.filters;
      const isSameFilter = this.loadedFilters && JSON.stringify(filters) === JSON.stringify(this.loadedFilters);
      const cacheTimeout = 5 * 60 * 1000; // 5 minutes in ms
      const isCacheValid = 
        this.sales.length > 0 && 
        this.lastFetchTime && 
        (new Date() - this.lastFetchTime < cacheTimeout);

      if (isSameFilter && isCacheValid) {
        return this.sales;
      }

      this.loading = true;

      try {
        const salesData = await getAllSales(filters);

        this.sales = salesData;
        this.lastFetchTime = new Date();
        this.loadedFilters = JSON.parse(JSON.stringify(filters));

        // Fetch latest import time (both Transfer and COD)
        const latestTime = await getLatestImportTime();
        this.lastImportedTime = latestTime;

        return salesData;
      } catch (error) {
        console.error("Error fetching sales in store:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Invalidate sales cache
     */
    invalidateCache() {
      this.lastFetchTime = null;
      this.loadedFilters = null;
    },

    /**
     * Create a new sale and upsert customer profile if name is provided
     */
    async createSale(saleData) {
      this.loading = true;
      try {
        const created = await createSaleService(saleData);

        // Upsert customer if name is provided
        if (saleData.customerName) {
          await upsertCustomer({
            name: saleData.customerName,
          });
        }

        this.invalidateCache();
        return created;
      } catch (error) {
        console.error("Error creating sale in store:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Update an existing sale
     */
    async updateSale(id, updateData) {
      this.loading = true;
      try {
        await updateSaleService(id, updateData);

        // Upsert customer if name is being updated
        if (updateData.customerName) {
          await upsertCustomer({
            name: updateData.customerName,
          });
        }

        this.invalidateCache();
      } catch (error) {
        console.error("Error updating sale in store:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Delete a sale
     */
    async deleteSale(id) {
      this.loading = true;
      try {
        await deleteSaleService(id);
        this.invalidateCache();
      } catch (error) {
        console.error("Error deleting sale in store:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Import a batch of COD sales
     */
    async importCODSales(salesItems, onProgress = null) {
      this.loading = true;
      try {
        await batchImportCODSales(salesItems, onProgress);
        this.invalidateCache();
      } catch (error) {
        console.error("Error importing COD sales in store:", error);
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
      this.invalidateCache();
    },

    /**
     * Merge two customers and invalidate cache
     */
    async mergeCustomers(sourceName, targetName) {
      this.loading = true;
      try {
        const result = await mergeCustomersService(sourceName, targetName);
        this.invalidateCache();
        return result;
      } catch (error) {
        console.error("Error merging customers in store:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
