import test from "node:test";
import assert from "node:assert/strict";
import { loadProduction, memoryFirestore, instantiateStore, deferred } from "./helpers.js";
import { normalizeCOD, classifyCOD } from "../src/utils/codUtils.js";
const service = db => loadProduction("src/services/salesService.js", ["createSale", "updateSale", "previewCODSales", "batchImportCODSales", "mergeCustomers"], db.dependencies);
const cod = { orderNo: "TH123", customerName: "ลูกค้า", amount: 500, date: "2026-03-01T00:00:00+07:00" };

test("COD identity ignores payment date; duplicates skip, conflicting amounts block", () => {
  assert.equal(normalizeCOD(cod).id, normalizeCOD({ ...cod, date: "2026-04-01" }).id);
  const old = { ...cod, type: "COD", id: "legacy_date_id" };
  assert.equal(classifyCOD([{ ...cod, date: "2026-04-01" }], [old])[0].importStatus, "duplicate");
  assert.equal(classifyCOD([{ ...cod, amount: 600 }], [old])[0].importStatus, "conflict");
  assert.equal(classifyCOD([cod], [old, { ...old, id: "legacy_duplicate" }])[0].importStatus, "conflict");
  assert.equal(classifyCOD([cod, cod])[1].importStatus, "duplicate");
  const check = isXlsx => filename => String(filename || "").toLowerCase().endsWith(".xlsx");
  assert.ok(check()("20261101_20261101_9274206_CODRemittance.xlsx"));
  assert.ok(check()("REPORT.XLSX"));
  assert.equal(check()("report.xls"), false);
  assert.equal(check()("report.csv"), false);
  assert.equal(classifyCOD([{ ...cod, amount: NaN }])[0].importStatus, "invalid");
});
test("reimport preserves verified item counts and handles legacy IDs without migration", async () => {
  const db = memoryFirestore({ "sales/COD_TH123_20260301": { ...cod, type: "COD", itemCount: 4, isItemCountSet: true } });
  const result = await service(db).batchImportCODSales([{ ...cod, date: "2026-04-01" }]);
  assert.deepEqual(result, { inserted: 0, skipped: 1 });
  assert.equal(db.records.get("sales/COD_TH123_20260301").itemCount, 4);
  assert.equal([...db.records.keys()].filter(k => k.startsWith("sales/")).length, 1);
});
test("COD retry after partial failure only inserts remaining orders", async () => {
  const db = memoryFirestore(); const api = service(db);
  const items = [cod, { ...cod, orderNo: "TH124" }];
  db.failCommit(2);
  await assert.rejects(api.batchImportCODSales(items), /บันทึกใหม่แล้ว 1/);
  assert.deepEqual(await api.batchImportCODSales(items), { inserted: 1, skipped: 1 });
  assert.equal([...db.records.keys()].filter(k => k.startsWith("sales/")).length, 2);
});
test("COD rechecks stable ID at commit and rejects merging customers", async () => {
  const db = memoryFirestore({ "customers/ลูกค้า": { name: "ลูกค้า", isMerging: true } });
  await assert.rejects(service(db).batchImportCODSales([cod]), /รวมบัญชี/);
  assert.equal([...db.records.keys()].filter(k => k.startsWith("sales/")).length, 0);
});
test("transfer sale + customer commit atomically; same request retry is idempotent", async () => {
  const db = memoryFirestore(); const api = service(db);
  const input = { ...cod, dateTime: new Date(cod.date), type: "Transfer", itemCount: 2, requestId: "request-id-12345678" };
  db.failCommit(1); await assert.rejects(api.createSale(input));
  assert.equal(db.records.size, 0);
  await api.createSale(input); await api.createSale(input);
  assert.equal([...db.records.keys()].filter(k => k.startsWith("sales/")).length, 1);
  assert.ok(db.records.has("customers/ลูกค้า"));
  await assert.rejects(api.createSale({ ...input, amount: 700 }), /บันทึกแล้ว/);
});
test("merge failure after 400 moves preserves source, unlocks profiles and resumes", async () => {
  const seed = { "customers/source": { name: "source", note: "keep me" }, "customers/target": { name: "target" } };
  for (let i = 0; i < 401; i++) seed[`sales/${i}`] = { customerName: "source", amount: 100 };
  const db = memoryFirestore(seed); const api = service(db);
  db.failCommit(3); // lock, first page, then fail second page
  await assert.rejects(api.mergeCustomers("source", "target"), /ยังไม่เสร็จ/);
  assert.ok(db.records.has("customers/source"));
  assert.equal(db.records.get("customers/source").isMerging, false);
  assert.equal(db.records.get("customers/target").isMerging, false);
  assert.equal([...db.records.values()].filter(d => d.customerName === "source").length, 1);
  await api.mergeCustomers("source", "target");
  assert.equal(db.records.has("customers/source"), false);
  assert.equal([...db.records.values()].filter(d => d.customerName === "target").length, 401);
  assert.equal(db.records.get("customers/target").note, "keep me");
});
test("merge finalization failure preserves source and recovery does not touch another owner", async () => {
  const db = memoryFirestore({ "customers/source": { name: "source" }, "customers/target": { name: "target" } });
  db.failCommit(2);
  await assert.rejects(service(db).mergeCustomers("source", "target"));
  assert.ok(db.records.has("customers/source"));
  assert.equal(db.records.get("customers/target").isMerging, false);
});
test("latest sales filter wins and stale finally cannot clear the active request", async () => {
  const requests = [];
  const { useSalesStore } = loadProduction("src/stores/salesStore.js", ["useSalesStore"], {
    defineStore: (id, def) => def, toDate: d => new Date(d),
    getAllSales: filter => { const d = deferred(); requests.push({ ...d, filter }); return d.promise; },
    getLatestImportTime: async () => new Date(),
  });
  const store = instantiateStore(useSalesStore);
  const first = store.fetchSales({ mode: "selectYear", year: 2025 });
  const second = store.fetchSales({ mode: "selectYear", year: 2026 });
  requests[0].resolve([{ amount: 2025 }]); await first;
  assert.equal(store.loading, true);
  requests[1].resolve([{ amount: 2026 }]); await second;
  assert.equal(store.sales[0].amount, 2026); assert.equal(store.loadedFilters.year, 2026);
  store.invalidateCache();
  const late = store.fetchSales({ mode: "all" }); store.clearSales();
  requests[2].resolve([{ amount: 999 }]); await late;
  assert.equal(store.sales.length, 0);
});
test("cache hit supersedes an outstanding different filter", async () => {
  const pending = deferred();
  const { useSalesStore } = loadProduction("src/stores/salesStore.js", ["useSalesStore"], {
    defineStore: (id, def) => def, toDate: d => new Date(d), getAllSales: () => pending.promise, getLatestImportTime: async () => new Date(),
  });
  const store = instantiateStore(useSalesStore);
  store.sales = [{ amount: 2026 }]; store.loadedFilters = { mode: "selectYear", month: null, year: 2026, startDate: null, endDate: null, limitCount: null }; store.lastFetchTime = new Date();
  const old = store.fetchSales({ mode: "selectYear", year: 2025 });
  await store.fetchSales({ mode: "selectYear", year: 2026 });
  pending.resolve([{ amount: 2025 }]); await old;
  assert.equal(store.sales[0].amount, 2026);
});
test("expense loading errors propagate and never retain a stale total", async () => {
  const { useExpenseStore } = loadProduction("src/stores/expenseStore.js", ["useExpenseStore"], {
    defineStore: (id, def) => def, localStorage: { getItem: () => null },
    useSalesStore: () => ({ fetchSales: async () => [] }), getAllExpenses: async () => { throw new Error("offline"); },
  });
  const store = instantiateStore(useExpenseStore); store.expenses = [{ amount: 123 }];
  await assert.rejects(store.fetchExpenses(), /offline/);
  assert.equal(store.expenses.length, 0); assert.equal(store.loadError, "offline");
});

test("annual sales and expenses use identical Thai calendar boundaries", async () => {
  for (const [file, name] of [["salesService", "getAllSales"], ["expenseService", "getAllExpenses"]]) {
    const clauses = [];
    const api = loadProduction(`src/services/${file}.js`, [name], {
      db: {}, measureExecution: (label, fn) => fn(), collection: () => ({}),
      where: (key, op, value) => { clauses.push({ key, op, value }); return {}; },
      orderBy: () => ({}), query: () => ({}), getDocs: async () => ({ docs: [] }),
      Timestamp: { fromDate: d => d },
    });
    await api[name]({ mode: "selectYear", year: 2026 });
    assert.equal(clauses[0].value.toISOString(), "2025-12-31T17:00:00.000Z");
    assert.equal(clauses[1].value.toISOString(), "2026-12-31T16:59:59.999Z");
  }
});

test("active customer merge locks prevent creation and cannot be stolen", async () => {
  const db = memoryFirestore({
    "customers/source": { name: "source", isMerging: true, mergeOwner: "other", mergeTarget: "target", mergeLeaseUntil: Date.now() + 60000 },
    "customers/target": { name: "target" },
  });
  const api = service(db);
  await assert.rejects(api.mergeCustomers("source", "target"), /กำลังรวม/);
  assert.equal(db.records.get("customers/source").mergeOwner, "other");
  await assert.rejects(api.createSale({ ...cod, customerName: "source", itemCount: 1, requestId: "request-id-12345678" }), /รวมบัญชี/);
  assert.equal([...db.records.keys()].filter(k => k.startsWith("sales/")).length, 0);
});
