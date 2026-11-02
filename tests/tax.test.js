import test from "node:test";
import assert from "node:assert/strict";
import { calculateRetailTax, calculateAllowances, progressiveTax, taxRules, isInTaxPeriod, sumTaxExpenses, vatStatus } from "../src/utils/taxUtils.js";
const calculate = (inputs = {}, rest = {}) => calculateRetailTax({ year: 2026, revenue: 1000000, inputs, ...rest });

test("PND94 insurance, bank mortgage and parental health follow separate exemptions", () => {
  const { parts } = calculateAllowances({ year: 2026, form: "pnd94", revenue: 1000000, inputs: { lifeInsurance: 37000, homeLoanInterest: 100000, parentHealthInsurance: 15000 } });
  assert.equal(parts.personal, 30000); assert.equal(parts.insurance, 32000);
  assert.equal(parts.homeLoanInterest, 95000); assert.equal(parts.parentHealthInsurance, 15000);
});
test("child additional exemption is 45k half-year, 60k annual, without double counting", () => {
  for (const [form, expected] of [["pnd94", 60000], ["pnd90", 90000]]) {
    assert.equal(calculateAllowances({ year: 2026, form, revenue: 1000000, inputs: { ordinaryChildren: 1, additionalChildren: 1 } }).parts.children, expected);
  }
});
test("ESG 30% cap and year-specific cap; SSF eligibility ends in 2024", () => {
  assert.equal(calculate({ thaiESG: 300000 }, { revenue: 500000 }).allowances.parts.thaiESG, 150000);
  assert.equal(calculate({ thaiESG: 300000 }, { year: 2023 }).allowances.parts.thaiESG, 100000);
  assert.equal(calculate({ ssf: 200000 }, { year: 2025 }).allowances.parts.retirement, 0);
  assert.equal(calculate({ ssf: 200000 }, { year: 2024 }).allowances.parts.retirement, 200000);
  assert.throws(() => taxRules(2027));
});
test("retirement uses individual and combined caps; pension first fills ordinary life allowance", () => {
  const result = calculate({ rmf: 500000, pensionInsurance: 300000, otherRetirement: 500000 }, { revenue: 500000 });
  assert.equal(result.allowances.parts.insurance, 100000);
  assert.equal(result.allowances.parts.retirement, 500000);
  assert.equal(calculate({ rmf: 500000 }, { revenue: 500000 }).allowances.parts.retirement, 150000);
});
test("donations are deducted sequentially, not pooled into a single 10% cap", () => {
  const result = calculate({ doubleDonations: 17000, generalDonations: 30600 });
  assert.equal(result.doubleDonationDeduction, 34000);
  assert.equal(result.generalDonationDeduction, 30600);
  assert.equal(result.donationsDeduction, 64600);
  assert.equal(result.netTaxableIncome, 275400);
  assert.equal(result.progressiveTax, 6270);
});
test("minimum tax waiver, method 2, credits and filing duty are separate", () => {
  assert.equal(calculate().method2Waived, true);
  const result = calculate({ withholdingTax: 2000, paidPnd94Tax: 3000 }, { revenue: 1200000, method: "actual", actualExpenses: 1200000 });
  assert.equal(result.taxBeforeCredits, 6000); assert.equal(result.finalBalance, 1000);
  assert.equal(calculate({ paidPnd94Tax: 3000 }, { form: "pnd94", revenue: 1200000, method: "actual", actualExpenses: 1200000 }).finalBalance, 6000);
  assert.equal(calculate({}, { revenue: 60001 }).filingRequired, true);
  assert.equal(calculate({}, { revenue: 60000 }).filingRequired, false);
});
test("progressive boundaries and fractions are preserved", () => {
  assert.equal(progressiveTax(150000).tax, 0); assert.equal(progressiveTax(300000).tax, 7500);
  assert.equal(progressiveTax(5000000).tax, 1265000); assert.equal(progressiveTax(6000000).tax, 1615000);
  assert.equal(progressiveTax(150010).tax, .5);
});
test("VAT comparison never uses rounded percentage", () => {
  assert.equal(vatStatus(1791000).exceeded, false);
  assert.equal(vatStatus(1800000).exceeded, false);
  assert.equal(vatStatus(1800000.01).exceeded, true);
});
test("tax expenses require evidence and approval; no estimated overhead or duplicates", () => {
  assert.equal(sumTaxExpenses([{ amount: 100, taxDeductible: true, taxEvidence: "R1" }, { amount: 200 }, { amount: 500, taxDeductible: true, taxEvidence: "" }, { amount: 999, isAuto: true, taxDeductible: true, taxEvidence: "estimated" }]), 100);
});
test("Thai business time selects correct tax year and half-year", () => {
  assert.equal(isInTaxPeriod("2025-12-31T17:00:00Z", 2026), true);
  assert.equal(isInTaxPeriod("2026-06-30T17:00:00Z", 2026, "pnd94"), false);
  assert.equal(isInTaxPeriod("2026-06-30T16:59:59Z", 2026, "pnd94"), true);
  assert.equal(isInTaxPeriod(null, 2026), false);
});
test("negative, infinite and nonnumeric inputs cannot corrupt financial results", () => {
  const result = calculate({ rmf: Infinity, doubleDonations: -1, withholdingTax: "bad", ordinaryChildren: -3 });
  assert.equal(result.finalBalance, calculate().finalBalance);
  assert.ok(Number.isFinite(result.finalBalance));
});
