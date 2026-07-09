import { defineStore } from "pinia";
import { db } from "../firebase";
import { collection, query, orderBy, limit, startAfter, getDocs, where } from "firebase/firestore";

export const useCustomerStore = defineStore("customer", {
  state: () => ({
    customers: [],
    loading: false,
    lastDoc: null,
    hasMore: true,
    searchResults: [],
    searchLoading: false,
  }),

  actions: {
    /**
     * Fetch customers with server-side pagination
     * @param {boolean} reset - Reset pagination and fetch from scratch
     */
    async fetchCustomers(reset = false) {
      if (this.loading) return;
      if (reset) {
        this.customers = [];
        this.lastDoc = null;
        this.hasMore = true;
      }

      if (!this.hasMore && !reset) return;

      this.loading = true;
      try {
        const customersRef = collection(db, "customers");
        let q = query(customersRef, orderBy("name"), limit(50));

        if (this.lastDoc && !reset) {
          q = query(q, startAfter(this.lastDoc));
        }

        const snapshot = await getDocs(q);
        
        const newCustomers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (reset) {
          this.customers = newCustomers;
        } else {
          this.customers.push(...newCustomers);
        }

        this.lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
        this.hasMore = snapshot.docs.length === 50;
      } catch (error) {
        console.error("Error fetching customers in store:", error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Search customers by name using Prefix Search (server-side)
     * @param {string} searchText - Text prefix to search for
     */
    async searchCustomers(searchText) {
      const queryVal = searchText.trim();
      if (!queryVal) {
        this.searchResults = [];
        return;
      }

      this.searchLoading = true;
      try {
        const customersRef = collection(db, "customers");
        // Prefix Search using \uf8ff
        const q = query(
          customersRef,
          orderBy("name"),
          where("name", ">=", queryVal),
          where("name", "<=", queryVal + "\uf8ff"),
          limit(10)
        );
        const snapshot = await getDocs(q);
        this.searchResults = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (error) {
        console.error("Error searching customers:", error);
      } finally {
        this.searchLoading = false;
      }
    },

    /**
     * Clear the search results array
     */
    clearSearchResults() {
      this.searchResults = [];
    },

    /**
     * Unsubscribe and clear customer listeners / store state
     */
    unsubscribeCustomers() {
      this.clearStore();
    },

    /**
     * Reset store state to initial
     */
    clearStore() {
      this.customers = [];
      this.lastDoc = null;
      this.hasMore = true;
      this.searchResults = [];
    }
  }
});
