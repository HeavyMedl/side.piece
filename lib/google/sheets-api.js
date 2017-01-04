const GoogleAuthorize = require('google-authorize');
const google = require('googleapis');

class SheetsApi {
  constructor(spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
    this.googleAuth = new GoogleAuthorize(['spreadsheets']);
    this.sheets = google.sheets('v4');
  }
  authorize() {
    return this.googleAuth.authorize()
  }
  append(auth) {
    return new Promise((resolve, reject) => {
      this.sheets.spreadsheets.values.append({
        auth: auth,
        spreadsheetId: this.spreadsheetId,
        range: "Costco Prices!A1:D1",
        valueInputOption: 'USER_ENTERED',
        resource : {
          majorDimension: "ROWS",
          values: [
            ["Door", "$15", "2", "3/15/2017"],
            ["Engine", "$100", "1", "3/20/2016"]
          ]
        }
      }, (err, response) => {
        if (err) reject(err);
        resolve(auth);
      });
    })
  }
}
// sheets-client.js
let sheets = new SheetsApi('19uTpwB-PM9TtUGUCRMfgWdkH0pqEHVq3J6sjzCNoMRM');
sheets
  .authorize()
  .then(sheets.append.bind(sheets))
  .then(sheets.append.bind(sheets))
  .then(sheets.append.bind(sheets))
