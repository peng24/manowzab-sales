export async function getAllExpenses(filter) {
  await new Promise(resolve => setTimeout(resolve, window.taxFixture.delay));
  if (window.taxFixture.failExpenses) throw new Error("จำลองโหลดรายจ่ายไม่สำเร็จ");
  return [
    { amount: 600000, dateTime: `${filter.year}-03-01T00:00:00+07:00`, taxDeductible: true, taxEvidence: "receipt-1" },
    { amount: 500000, dateTime: `${filter.year}-08-01T00:00:00+07:00` },
  ];
}
