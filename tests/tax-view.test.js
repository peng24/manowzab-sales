import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import * as vue from "vue";
import * as tax from "../src/utils/taxUtils.js";
import { addDays } from "date-fns";
import { deferred } from "./helpers.js";
function mountLogic() {
  const requests = [], cleanups = [];
  const createRequest = (kind, filter) => { const d = deferred(); requests.push({ kind, year: filter.year, ...d }); return d.promise; };
  const source = fs.readFileSync(new URL("../src/views/TaxView.vue", import.meta.url), "utf8").split("<script setup>")[1].split("</script>")[0].replace(/import[\s\S]*?from\s*["'][^"']+["'];/g, "");
  const deps = { ref: vue.ref, reactive: vue.reactive, computed: vue.computed, watch: vue.watch, ...tax, addDays, Swal: {}, formatCurrency: String, toDate: d => new Date(d),
    onUnmounted: fn => cleanups.push(fn), getAllSales: f => createRequest("sales", f), getAllExpenses: f => createRequest("expenses", f) };
  const instance = new Function(...Object.keys(deps), source + ";return {selectedYear,selectedForm,inputs,formRevenue,formActualExpenses,loadError,loading,loadData,activeCalculation};")(...Object.values(deps));
  return { ...instance, requests, unmount: () => cleanups.forEach(fn => fn()) };
}
test("tax view requires both datasets, isolates annual/half-year inputs and ignores late years", async () => {
  const page = mountLogic();
  const originalYear = page.selectedYear.value;
  page.selectedYear.value = originalYear === 2026 ? 2025 : 2026;
  await vue.nextTick();
  const year = page.selectedYear.value;
  page.requests[2].resolve([{ amount: 1000000, dateTime: `${year}-03-01T00:00:00+07:00` }]);
  page.requests[3].resolve([{ amount: 700000, dateTime: `${year}-03-01T00:00:00+07:00`, taxDeductible: true, taxEvidence: "R-1" }]);
  await new Promise(resolve => setImmediate(resolve));
  page.inputs.value.lifeInsurance = 100000;
  assert.equal(page.formRevenue.value, 1000000); assert.equal(page.formActualExpenses.value, 700000);
  page.selectedForm.value = "pnd94"; assert.equal(page.inputs.value.lifeInsurance, 0);
  page.selectedForm.value = "pnd90"; assert.equal(page.inputs.value.lifeInsurance, 100000);
  page.requests[0].resolve([{ amount: 9999999, dateTime: `${originalYear}-03-01` }]); page.requests[1].resolve([]);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(page.formRevenue.value, 1000000);
  const refresh = page.loadData();
  page.requests[4].resolve([]); page.requests[5].reject(new Error("offline expense")); await refresh;
  assert.equal(page.loadError.value, "offline expense"); assert.equal(page.loading.value, false);
  page.unmount();
});
