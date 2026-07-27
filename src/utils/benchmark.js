/**
 * Benchmark Script for SalesPilot
 * Utility to run an automated benchmark suite against core data operations
 */

import { measureExecution, logPerfSummary, getPerfReport } from "./perfTracker.js";
import { getAllSales } from "../services/salesService.js";
import { getAllExpenses, getExpenseCategories } from "../services/expenseService.js";

/**
 * Run comprehensive performance benchmark suite
 * @returns {Promise<Object>} Benchmark results
 */
export async function runBenchmarkSuite() {
  console.log("🚀 Starting SalesPilot Performance Benchmark Suite...");

  // 1. Benchmark sales queries
  await measureExecution("Benchmark: getAllSales(mode: 'thisMonth')", () =>
    getAllSales({ mode: "thisMonth" })
  );

  await measureExecution("Benchmark: getAllSales(mode: 'thisYear')", () =>
    getAllSales({ mode: "thisYear" })
  );

  // 2. Benchmark expense queries
  await measureExecution("Benchmark: getAllExpenses(mode: 'thisMonth')", () =>
    getAllExpenses({ mode: "thisMonth" })
  );

  await measureExecution("Benchmark: getExpenseCategories()", () =>
    getExpenseCategories(true)
  );

  console.log("✅ SalesPilot Benchmark Suite Complete!");
  logPerfSummary();
  return getPerfReport();
}

// Expose on window for browser console testing
if (typeof window !== "undefined") {
  window.__runSalesPilotBenchmark__ = runBenchmarkSuite;
}
