const GoogleAuthorize = require('./google-authorize.js');
const google = require('googleapis');

class SheetsApi {
  constructor(spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
  }
  /**
   * Print the names and majors of students in a sample spreadsheet:
   * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
   */
  listMajors() {
    new GoogleAuthorize().authorize().then(auth => {
      let sheets = google.sheets('v4');
      sheets.spreadsheets.values.get({
        auth: auth,
        spreadsheetId: this.spreadsheetId,
        range: 'Costco Prices!A1:A2',
      }, (err, response) => {
        if (err) {
          console.log('The API returned an error: ' + err);
          return;
        }
        var rows = response.values;
        if (rows.length == 0) {
          console.log('No data found.');
        } else {
          console.log('Name, Major:');
          for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            // Print columns A and E, which correspond to indices 0 and 4.
            console.log('%s, %s', row[0], row[4]);
          }
        }
      });
    });
  }
}
// Example usage
// let sheets = new SheetsApi('19uTpwB-PM9TtUGUCRMfgWdkH0pqEHVq3J6sjzCNoMRM');
// sheets.listMajors();
