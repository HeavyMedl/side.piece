const SheetsAPI = require('sheets-api');
const CostcoProducts = require('../scrapers/costco-products.js');
const csv = require('fast-csv');

const sheets = new SheetsAPI();
const SPREADSHEET_ID = "19uTpwB-PM9TtUGUCRMfgWdkH0pqEHVq3J6sjzCNoMRM";

function get_rows(values) {
  let rows = [];
  values.forEach((value_obj, i) => {
    let number = value_obj.Price ? value_obj.Price.replace(',','') : "";
    let price = isNaN(parseFloat(number)) ? 0.00 : parseFloat(number)
    let row = {
      values: [
        {userEnteredValue: {stringValue: value_obj.Name}},
        {userEnteredValue: {numberValue: price}}
      ]
    };
    rows.push(row);
  });
  return rows;
}
function get_requests(values) {
  let requests = [];
  // Clear all values from the sheet.
  requests.push({
    updateCells: {
      range: { sheetId: 0, startRowIndex: 1 },
      fields: "userEnteredValue"
    }
  });
  // Append rows from the values of the csv
  requests.push({
    appendCells: {
      sheetId: 0,
      rows: get_rows(values),
      fields: '*'
    }
  });
  return requests;
}
function fromCostcoToSheets() {
  new CostcoProducts().get_products().then(data => {
    sheets
      .authorize()
      .then(auth => sheets.spreadsheets('batchUpdate', auth, {
        spreadsheetId: SPREADSHEET_ID,
        resource: {requests: get_requests(data)}
      }));
  });
}
function fromCSVToSheets(csv_file) {
  sheets
    .authorize()
    .then(auth => {
      let values = [];
      csv
        .fromPath(`./exports/${csv_file}`, {headers: true})
        .on("data", value => {
          values.push(value);
        })
        .on("end", () => {
          sheets.spreadsheets('batchUpdate', auth, {
            spreadsheetId: SPREADSHEET_ID,
            resource: {requests: get_requests(values)}
          })
          .then(auth => console.log('Done'))
        })
    })
    .catch(e => console.error(e))
}
fromCostcoToSheets();
