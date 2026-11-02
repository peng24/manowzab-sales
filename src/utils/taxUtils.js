// Personal online retail (purchased goods resold), section 40(8).
// Sources and scope: docs/tax-rules.md. Never infer rules for unreviewed years.
export const TAX_YEARS = [2023, 2024, 2025, 2026];
export const TAX_BRACKETS = [
  [150000, 0], [300000, .05], [500000, .10], [750000, .15],
  [1000000, .20], [2000000, .25], [5000000, .30], [Infinity, .35],
];
export const nonNegative = (value) => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
export const money = (value) => Math.round((nonNegative(value) + Number.EPSILON) * 100) / 100;
const count = (value, max) => Math.min(max, Math.floor(nonNegative(value)));

export function taxRules(year) {
  if (!TAX_YEARS.includes(Number(year))) throw new Error("ยังไม่มีกฎที่ตรวจสอบสำหรับปีภาษีนี้");
  return {
    thaiESGCap: Number(year) === 2023 ? 100000 : 300000,
    ssfCap: Number(year) <= 2024 ? 200000 : 0,
    socialSecurityAnnualCaps: { "33": Number(year) >= 2026 ? 10500 : 9000, "39": 5184, "40": 3600 },
    annualProvisional: Number(year) === 2026,
  };
}

export const emptyTaxInputs = () => ({
  maritalStatus: "single", spouseAllowance: false, ordinaryChildren: 0, additionalChildren: 0,
  parents: 0, socialSecurityType: "39", socialSecurity: 0, lifeInsurance: 0,
  healthInsurance: 0, parentHealthInsurance: 0, rmf: 0, ssf: 0,
  pensionInsurance: 0, otherRetirement: 0, thaiESG: 0, homeLoanInterest: 0,
  homeLoanLender: "bank", doubleDonations: 0, generalDonations: 0,
  withholdingTax: 0, paidPnd94Tax: 0,
});

// Only the statutory 10,000-baht portion is halved; the additional exemption is not.
export function halfYearInsurance(amount, marriedSeparate = false) {
  const paid = nonNegative(amount);
  return (marriedSeparate ? Math.min(paid, 5000) : Math.min(paid, 10000) / 2)
    + Math.min(Math.max(0, paid - 10000), 90000);
}

export function calculateAllowances({ year, form, revenue, inputs = {} }) {
  const rules = taxRules(year);
  const a = { ...emptyTaxInputs(), ...inputs };
  const half = form === "pnd94";
  const factor = half ? .5 : 1;
  const income = nonNegative(revenue);
  const pension = nonNegative(a.pensionInsurance);
  const life = nonNegative(a.lifeInsurance);
  // Pension premiums first fill unused ordinary life-insurance eligibility.
  const pensionAsLife = Math.min(pension, Math.max(0, 100000 - life));
  const normalLife = life + pensionAsLife;
  const lifeDeduction = half ? halfYearInsurance(normalLife, a.maritalStatus === "marriedSeparate") : Math.min(normalLife, 100000);
  const health = Math.min(nonNegative(a.healthInsurance), 25000);
  const insurance = Math.min(100000, lifeDeduction + health);
  const pensionExtra = Math.min(Math.max(0, pension - pensionAsLife), income * .15, 200000);
  const rmf = Math.min(nonNegative(a.rmf), income * .30, 500000);
  const ssf = Math.min(nonNegative(a.ssf), income * .30, rules.ssfCap);
  const retirement = Math.min(500000, pensionExtra + rmf + ssf + nonNegative(a.otherRetirement));
  const ssCap = rules.socialSecurityAnnualCaps[a.socialSecurityType];
  if (ssCap === undefined) throw new Error("ประเภทประกันสังคมไม่ถูกต้อง");
  const parts = {
    personal: 60000 * factor,
    spouse: a.maritalStatus === "marriedNoIncome" && a.spouseAllowance ? 60000 * factor : 0,
    children: count(a.ordinaryChildren, 20) * 30000 * factor
      + count(a.additionalChildren, 20) * (half ? 45000 : 60000),
    parents: count(a.parents, a.maritalStatus === "marriedNoIncome" ? 4 : 2) * 30000 * factor,
    socialSecurity: Math.min(nonNegative(a.socialSecurity), ssCap * factor),
    insurance,
    parentHealthInsurance: Math.min(nonNegative(a.parentHealthInsurance), 15000),
    retirement,
    thaiESG: Math.min(nonNegative(a.thaiESG), income * .30, rules.thaiESGCap),
    homeLoanInterest: half && a.homeLoanLender === "bank"
      ? halfYearInsurance(a.homeLoanInterest) : Math.min(nonNegative(a.homeLoanInterest), 100000),
  };
  return { parts, total: money(Object.values(parts).reduce((sum, n) => sum + n, 0)) };
}

export function progressiveTax(netIncome) {
  const net = nonNegative(netIncome);
  let previous = 0, total = 0, highestRate = 0;
  for (const [ceiling, rate] of TAX_BRACKETS) {
    const taxable = Math.max(0, Math.min(net, ceiling) - previous);
    total += taxable * rate;
    if (taxable > 0) highestRate = rate * 100;
    previous = ceiling;
  }
  return { tax: money(total), highestRate };
}

export function calculateRetailTax({ year, form = "pnd90", revenue = 0, actualExpenses = 0, method = "flat", inputs = {} }) {
  if (!["pnd90", "pnd94"].includes(form) || !["flat", "actual"].includes(method)) throw new Error("รูปแบบคำนวณภาษีไม่ถูกต้อง");
  const income = money(revenue);
  const allowances = calculateAllowances({ year, form, revenue: income, inputs });
  const deductedExpenseAmount = money(method === "flat" ? income * .6 : actualExpenses);
  const incomeAfterExpense = money(Math.max(0, income - deductedExpenseAmount));
  const afterAllowances = money(Math.max(0, incomeAfterExpense - allowances.total));
  const doubleDonationDeduction = money(Math.min(nonNegative(inputs.doubleDonations) * 2, afterAllowances * .10));
  const generalDonationDeduction = money(Math.min(nonNegative(inputs.generalDonations), (afterAllowances - doubleDonationDeduction) * .10));
  const donationsDeduction = money(doubleDonationDeduction + generalDonationDeduction);
  const netTaxableIncome = money(Math.max(0, afterAllowances - donationsDeduction));
  const progressive = progressiveTax(netTaxableIncome);
  const rawMethod2Tax = money(income * .005);
  const method2Waived = rawMethod2Tax <= 5000;
  const minimumTax = method2Waived ? 0 : rawMethod2Tax;
  const taxBeforeCredits = Math.max(progressive.tax, minimumTax);
  const credits = money(nonNegative(inputs.withholdingTax) + (form === "pnd90" ? nonNegative(inputs.paidPnd94Tax) : 0));
  const finalBalance = Math.round((taxBeforeCredits - credits) * 100) / 100;
  return {
    allowances, deductedExpenseAmount, incomeAfterExpense, donationsDeduction,
    doubleDonationDeduction, generalDonationDeduction, netTaxableIncome,
    progressiveTax: progressive.tax, highestBracketPercent: progressive.highestRate,
    rawMethod2Tax, method2Waived, usedFlat05PercentRule: minimumTax > progressive.tax,
    taxBeforeCredits, finalBalance,
    // Filing duty is independent of whether the calculation produces tax payable.
    filingRequired: income > (inputs.maritalStatus && inputs.maritalStatus !== "single" ? 120000 : 60000),
  };
}

export function isInTaxPeriod(dateValue, year, form = "pnd90") {
  const d = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
  if (!dateValue || !Number.isFinite(d.getTime())) return false;
  // Always use Thai business time, including when the browser runs outside Thailand.
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "numeric" }).formatToParts(d);
  const y = Number(parts.find(p => p.type === "year").value);
  const m = Number(parts.find(p => p.type === "month").value);
  return y === Number(year) && (form !== "pnd94" || m <= 6);
}

export function sumTaxExpenses(expenses) {
  return money(expenses.filter(e => !e.isAuto && e.taxDeductible === true && String(e.taxEvidence || "").trim())
    .reduce((sum, e) => sum + nonNegative(e.amount), 0));
}

export function vatStatus(revenue) {
  const total = nonNegative(revenue);
  return { exceeded: total > 1800000, near: total >= 1440000, percent: Math.min(999, Math.floor(total / 1800000 * 100)), remaining: Math.max(0, 1800000 - total) };
}
