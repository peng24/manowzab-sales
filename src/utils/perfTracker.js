/**
 * Performance Tracking Utility for SalesPilot
 * Measures function execution duration, aggregates metrics, and provides summary reporting.
 */

const metrics = new Map();

/**
 * Measure execution time of a synchronous or asynchronous function.
 * @param {string} label - Unique identifier for the function/operation
 * @param {Function} fn - Function to execute
 * @returns {Promise<any>|any} Result of the function
 */
export async function measureExecution(label, fn) {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    recordMetric(label, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    recordMetric(`${label} (FAILED)`, duration);
    throw error;
  }
}

/**
 * Record a duration measurement for a given label
 * @param {string} label 
 * @param {number} durationMs 
 */

function recordMetric(label, durationMs) {
  const existing = metrics.get(label) || {
    count: 0,
    totalTime: 0,
    minTime: Infinity,
    maxTime: -Infinity,
    avgTime: 0,
    lastTime: 0,
  };

  const count = existing.count + 1;
  const totalTime = existing.totalTime + durationMs;
  const minTime = Math.min(existing.minTime, durationMs);
  const maxTime = Math.max(existing.maxTime, durationMs);
  const avgTime = totalTime / count;

  metrics.set(label, {
    count,
    totalTime,
    minTime,
    maxTime,
    avgTime,
    lastTime: durationMs,
  });

  if (import.meta.env.DEV) {
    console.log(`⏱️ [PERF] ${label} took ${durationMs.toFixed(2)}ms`);
  }
}

/**
 * Get formatted performance report
 * @returns {Array<Object>}
 */
export function getPerfReport() {
  const report = [];
  metrics.forEach((data, label) => {
    report.push({
      Function: label,
      "Calls (จำนวนครั้ง)": data.count,
      "Last (ครั้งล่าสุด ms)": Number(data.lastTime.toFixed(2)),
      "Avg (เฉลี่ย ms)": Number(data.avgTime.toFixed(2)),
      "Min (ต่ำสุด ms)": Number(data.minTime.toFixed(2)),
      "Max (สูงสุด ms)": Number(data.maxTime.toFixed(2)),
      "Total (รวม ms)": Number(data.totalTime.toFixed(2)),
    });
  });
  return report.sort((a, b) => b["Avg (เฉลี่ย ms)"] - a["Avg (เฉลี่ย ms)"]);
}

/**
 * Log performance summary table to console
 */
export function logPerfSummary() {
  const report = getPerfReport();
  if (report.length === 0) {
    console.log("📊 [PERF] ยังไม่มีข้อมูลการวัดผลประสิทธิภาพ");
    return;
  }
  console.group("📊 SalesPilot Performance Summary Report");
  console.table(report);
  console.groupEnd();
}

/**
 * Reset all recorded performance metrics
 */
export function resetPerfMetrics() {
  metrics.clear();
  console.log("🧹 [PERF] ล้างข้อมูลสถิติเวลาประมวลผลเรียบร้อยแล้ว");
}

// Expose DevTools global window helper
if (typeof window !== "undefined") {
  window.__salesPilotPerf__ = {
    getPerfReport,
    logPerfSummary,
    resetPerfMetrics,
  };
}
