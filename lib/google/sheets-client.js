const SheetsAPI = require('sheets-api');
const CostcoProducts = require('../scrapers/costco-products.js');
const csv = require('fast-csv');
const google = require('googleapis');

const sheets = new SheetsAPI();
const SPREADSHEET_ID = "19uTpwB-PM9TtUGUCRMfgWdkH0pqEHVq3J6sjzCNoMRM";

function build_rows_from_values(values) {
  let rows = [];
  values.forEach((value_obj, i) => {
    let number = value_obj.Price ? value_obj.Price.replace(',','') : "";
    let price = isNaN(parseFloat(number)) ? 0.00 : parseFloat(number)
    let row = {
      values: [
        {userEnteredValue: {stringValue: value_obj.ParentPartNumber || "Missing"}},
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
      rows: build_rows_from_values(values),
      fields: '*'
    }
  });
  return requests;
}
function get_rows_by_name(product_name) {
  return sheets
    .authorize()
    .then(auth => sheets.values('get', auth, {
      spreadsheetId: SPREADSHEET_ID,
      range: 'Costco Prices!A:C',
    }))
    .then(resp_obj => {
      let row_arr = [];
      resp_obj.response.values.forEach(row => {
        let name = row[1];
        if (name.toLowerCase().includes(product_name.toLowerCase())) {
          row_arr.push(row);
        }
      });
      resp_obj.row = row_arr;
      console.log(resp_obj.row);
      return resp_obj;
    })
}
function from_costco_to_sheets() {
  new CostcoProducts().get_products().then(data => {
    sheets
      .authorize()
      .then(auth => sheets.spreadsheets('batchUpdate', auth, {
        spreadsheetId: SPREADSHEET_ID,
        resource: {requests: get_requests(data)}
      }));
  });
}
function from_CSV_to_sheets(csv_file) {
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
from_costco_to_sheets();
// get_rows_by_name('xbox');
