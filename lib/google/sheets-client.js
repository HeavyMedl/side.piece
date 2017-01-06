const SheetsAPI = require('sheets-api');
const csv = require('fast-csv');

const sheets = new SheetsAPI();
const SPREADSHEET_ID = "19uTpwB-PM9TtUGUCRMfgWdkH0pqEHVq3J6sjzCNoMRM";

function get_batchClear() {
  return {
    spreadsheetId: SPREADSHEET_ID,
    ranges : ["A:B"]
  }
}
function get_values(values) {
  return {
    spreadsheetId: SPREADSHEET_ID,
    range: "Costco Prices!A1:B1",
    valueInputOption: 'USER_ENTERED',
    resource : {
      majorDimension: "ROWS",
      values: values
    }
  }
}
function costco_products_to_sheets() {
  let values = [];
  sheets
    .authorize()
    .then(auth => sheets.values('batchClear', auth, get_batchClear()))
    .then(auth => {
      csv
        .fromPath("./exports/costco-products.csv")
        .on("data", value => {
          values.push(value);
        })
        .on("end", () => {
          sheets.authorize()
            .then(auth => sheets.values('append', auth, get_values(values)))
            .then((auth, resp) => {
              console.log("done")
            })
            .catch(e => console.error(e))
        });
    })
    .catch(e => console.error(e))
}
costco_products_to_sheets();
