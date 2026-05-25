/**
 * Format currency in Thai Baht format (th-TH).
 * Output: "1,234" or "1,234.56" depending on the value.
 * @param {number} val - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (val) => {
  return new Intl.NumberFormat("th-TH").format(val || 0);
};

/**
 * Sanitize customer name to be safe as a Firestore document ID.
 * Trims whitespace and replaces slashes '/' with dashes '-' to prevent path parsing errors.
 * @param {string} name - Raw customer name
 * @returns {string} Sanitized customer name/ID
 */
export const sanitizeCustomerId = (name) => {
  if (!name) return "";
  return name.trim().replace(/\//g, "-");
};
