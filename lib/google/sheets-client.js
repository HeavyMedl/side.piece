const SheetsAPI = require('sheets-api');
const sheets = new SheetsAPI();

let payload = {
  spreadsheetId: "19uTpwB-PM9TtUGUCRMfgWdkH0pqEHVq3J6sjzCNoMRM",
  range: "Costco Prices!A1:D1",
  valueInputOption: 'USER_ENTERED',
  resource : {
    majorDimension: "ROWS",
    values: [
      ["Door", "$15", "2", "3/15/2017"],
      ["Engine", "$100", "1", "3/20/2016"]
    ]
  }
}
let batchClear = {
  spreadsheetId: "19uTpwB-PM9TtUGUCRMfgWdkH0pqEHVq3J6sjzCNoMRM",
  ranges : [
    "A:D"
  ]
}

sheets
  // Get me an authorized OAuth2 client thats ready to make requests.
  .authorize()
  // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append
  // Using the spreadsheets.values collection, use the 'append' method to
  // append data (payload) to a spreadsheet.
  .then(auth => sheets.values('batchClear', auth, batchClear))
  // Oh I'm not done. Need to append again. Should I do anything using the
  // response from the first request? Naw.. I'm good.
  .then((auth, resp) => sheets.values('append', auth, payload))
  // Derp
  .catch(e => console.error(e))
