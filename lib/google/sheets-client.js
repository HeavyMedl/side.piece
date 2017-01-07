const SheetsAPI = require('sheets-api');
const csv = require('fast-csv');

const sheets = new SheetsAPI();
const SPREADSHEET_ID = "19uTpwB-PM9TtUGUCRMfgWdkH0pqEHVq3J6sjzCNoMRM";

function get_rows(values) {
  let rows = [];
  values.forEach(valueArr => {
    let row = {
      values: [
        {userEnteredValue: {stringValue: valueArr[0]}},
        {userEnteredValue: {stringValue: valueArr[1]}}
      ]
    };
    rows.push(row);
  });
  return rows;
}
function fromCSV(csv_file) {
  sheets
    .authorize()
    .then(auth => {
      let requests = [], values = [];
      csv
        .fromPath(`./exports/${csv_file}`)
        .on("data", value => {
          values.push(value);
        })
        .on("end", () => {
          // Clear all values from the sheet.
          requests.push({
            updateCells: {
              range: { sheetId: 0 },
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
          sheets.spreadsheets('batchUpdate', auth, {
            spreadsheetId: SPREADSHEET_ID,
            resource: {requests: requests}
          })
          .then(auth => console.log('Done'))
        })
    })
    .catch(e => console.error(e))
}
fromCSV('costco-products.csv');
