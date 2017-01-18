const SheetsClient = require('./sheets-client.js');
const client = new SheetsClient("19uTpwB-PM9TtUGUCRMfgWdkH0pqEHVq3J6sjzCNoMRM");
client.from_CSV_to_sheets('costco-products.csv');
