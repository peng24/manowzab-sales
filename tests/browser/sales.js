export async function getAllSales(filter) {
  await new Promise(resolve => setTimeout(resolve, window.taxFixture.delay));
  return [
    { id: "transfer", type: "Transfer", amount: 1000000, dateTime: `${filter.year}-03-01T00:00:00+07:00` },
    { id: "cod", type: "COD", amount: 800001, dateTime: `${filter.year}-08-01T00:00:00+07:00` },
  ];
}
