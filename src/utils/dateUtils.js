import { format } from "date-fns";
import { th } from "date-fns/locale";

/**
 * Convert any date-like value to a JS Date.
 * Handles: Firebase Timestamp (.toDate()), Date objects, date strings.
 */
const toDate = (dateField) => {
  if (!dateField) return null;
  if (dateField.toDate) return dateField.toDate(); // Firebase Timestamp
  const d = new Date(dateField);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Format date/time in Thai style for table rows.
 * Output: "24 ก.พ. 69 12:34 น."
 */
export const formatThaiDateTime = (dateField) => {
  const date = toDate(dateField);
  if (!date) return "-";

  const dayMonth = format(date, "d MMM", { locale: th });
  const yearBE = date.getFullYear() + 543;
  const yearShort = String(yearBE).slice(-2);
  const time = format(date, "HH:mm");
  return `${dayMonth} ${yearShort} ${time} น.`;
};

/**
 * Format date in Thai style for headers/sections (long form, no time).
 * Output: "24 กุมภาพันธ์ 2569"
 */
export const formatThaiDate = (dateField) => {
  const date = toDate(dateField);
  if (!date) return "-";

  const dayMonth = format(date, "d MMMM", { locale: th });
  const yearBE = date.getFullYear() + 543;
  return `${dayMonth} ${yearBE}`;
};

/**
 * Format date/time for COD import preview.
 * Shows time only if hours/minutes are non-zero.
 * Output: "24 ก.พ. 69" or "24 ก.พ. 69 12:34 น."
 */
export const formatThaiDateOptionalTime = (dateField) => {
  const date = toDate(dateField);
  if (!date) return "-";

  const dayMonth = format(date, "d MMM", { locale: th });
  const yearBE = date.getFullYear() + 543;
  const yearShort = String(yearBE).slice(-2);

  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
  if (hasTime) {
    const time = format(date, "HH:mm");
    return `${dayMonth} ${yearShort} ${time} น.`;
  }
  return `${dayMonth} ${yearShort}`;
};
