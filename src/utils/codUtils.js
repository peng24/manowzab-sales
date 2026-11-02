import { sanitizeCustomerId } from "./formatUtils.js";

export function normalizeCOD(item) {
  const orderNo = String(item.orderNo || item.trackingNo || "").trim().normalize("NFC");
  const carrier = String(item.carrier || "Flash").trim().toLowerCase();
  const dateTime = item.dateTime || item.date;
  const date = dateTime?.toDate ? dateTime.toDate() : new Date(dateTime);
  const amount = Number(item.amount);
  if (!orderNo || !carrier || !dateTime || !Number.isFinite(date.getTime()) || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("ต้องมีเลขออเดอร์ วันที่รับเงิน และยอด COD มากกว่า 0 ที่ถูกต้อง");
  }
  const id = `COD2_${encodeURIComponent(JSON.stringify([carrier, orderNo]))}`;
  if (new TextEncoder().encode(id).length > 1400) throw new Error("เลขออเดอร์ยาวเกินไป");
  return { ...item, id, orderNo, carrier, date, amount, customerName: sanitizeCustomerId(item.customerName) };
}

// A changed payment date never creates a second order. Conflicts require manual review.
export function sameCOD(a, b) {
  return Number(a.amount) === Number(b.amount)
    && sanitizeCustomerId(a.customerName) === sanitizeCustomerId(b.customerName);
}

export function classifyCOD(items, existing = []) {
  const seen = new Map();
  return items.map(raw => {
    let item;
    try { item = normalizeCOD(raw); }
    catch (error) { return { ...raw, importStatus: "invalid", importMessage: error.message }; }
    const matches = existing.filter(e => e.type === "COD" && String(e.orderNo || e.trackingNo || "").trim().normalize("NFC") === item.orderNo
      && String(e.carrier || "Flash").trim().toLowerCase() === item.carrier);
    const prior = seen.get(item.id);
    let importStatus = "new", importMessage = "พร้อมนำเข้า";
    if (matches.length > 1 || (matches.length === 1 && !sameCOD(matches[0], item)) || (prior && !sameCOD(prior, item))) {
      importStatus = "conflict"; importMessage = "ข้อมูลต่างจากรายการเดิมหรือพบรายการเดิมหลายรายการ โปรดตรวจประวัติ";
    } else if (matches.length || prior) {
      importStatus = "duplicate"; importMessage = "มีเลขออเดอร์นี้แล้ว จะข้ามโดยไม่เขียนทับ";
    }
    seen.set(item.id, item);
    return { ...item, importStatus, importMessage, existingIds: matches.map(e => e.id) };
  });
}
