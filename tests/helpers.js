import fs from "node:fs";
import { sanitizeCustomerId } from "../src/utils/formatUtils.js";
import { normalizeCOD, classifyCOD } from "../src/utils/codUtils.js";

// Execute the production functions; replace only I/O imports with controlled adapters.
export function loadProduction(file, exports, dependencies = {}) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8")
    .replace(/import[\s\S]*?from\s*["'][^"']+["'];/g, "")
    .replace(/export\s+(?=(?:async\s+)?function|const|let)/g, "");
  return new Function(...Object.keys(dependencies), `${source}; return {${exports.join(",")}};`)(...Object.values(dependencies));
}
export function instantiateStore(definition) {
  const store = { ...definition.state() };
  for (const [key, action] of Object.entries(definition.actions)) store[key] = action.bind(store);
  for (const [key, getter] of Object.entries(definition.getters || {})) Object.defineProperty(store, key, { get: () => getter.call(store, store) });
  return store;
}
export function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}
export function memoryFirestore(seed = {}) {
  const records = new Map(Object.entries(seed));
  let commits = 0, failAt = 0;
  const ref = (col, id) => ({ path: `${col}/${id}`, id });
  const snapshot = r => ({ id: r.id, ref: r, exists: () => records.has(r.path), data: () => records.get(r.path) });
  const dependencies = {
    db: {}, sanitizeCustomerId, normalizeCOD, classifyCOD,
    toDate: d => d?.toDate ? d.toDate() : d ? new Date(d) : null,
    toFirestoreTimestamp: d => {
      const date = d?.toDate ? d.toDate() : d ? new Date(d) : null;
      return date && Number.isFinite(date.getTime()) ? { toDate: () => date } : null;
    },
    serverTimestamp: () => new Date(),
    collection: (db, col) => col,
    doc: (db, col, id) => ref(col, id),
    where: (key, op, value) => ({ key, op, value }),
    limit: n => ({ limit: n }),
    query: (col, ...clauses) => ({ col, clauses }),
    getDocs: async ({ col, clauses }) => {
      let rows = [...records].filter(([path]) => path.startsWith(col + "/"));
      for (const c of clauses) {
        if (c.key) rows = rows.filter(([, value]) => c.op === "in" ? c.value.includes(value[c.key]) : value[c.key] === c.value);
        if (c.limit) rows = rows.slice(0, c.limit);
      }
      const docs = rows.map(([path]) => snapshot(ref(col, path.slice(col.length + 1))));
      return { docs, empty: !docs.length };
    },
    runTransaction: async (db, fn) => {
      const writes = [];
      const tx = {
        get: async r => snapshot(r),
        set: (r, data, options) => writes.push({ r, data, merge: options?.merge }),
        update: (r, data) => writes.push({ r, data, merge: true, update: true }),
        delete: r => writes.push({ r, delete: true }),
      };
      const result = await fn(tx);
      commits++;
      if (commits === failAt) throw new Error("simulated network failure");
      for (const w of writes) if (w.update && !records.has(w.r.path)) throw new Error("missing document");
      for (const w of writes) {
        if (w.delete) records.delete(w.r.path);
        else records.set(w.r.path, w.merge ? { ...records.get(w.r.path), ...w.data } : w.data);
      }
      return result;
    },
  };
  return { records, dependencies, failCommit: n => { failAt = n; }, get commits() { return commits; } };
}
