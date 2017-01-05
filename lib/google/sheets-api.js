const GoogleAuthorize = require('google-authorize');
const googleapis = require('googleapis');
/**
 * A Google Sheets API v4 implementation that abstracts the authorization
 * portion of each request away from the user a bit. Simply call authorize
 * to get a promise that resolves the OAuth2 client which can be used to make
 * requests. Provides generic 'collection' methods that assist with calling
 * methods associated with those collections i.e. 'values' maps to
 * spreadsheets.values. Really just a wrapper around googleapis.
 */
class SheetsAPI extends GoogleAuthorize {
  /**
   * Creating an instance of SheetsAPI prepares to obtain an authorized
   * OAuth2 clent from GoogleAuthorize by setting the 'scope' (access) of
   * this class to 'spreadsheets'
   * (See https://developers.google.com/identity/protocols/googlescopes). To
   * obtain the authorized OAuth2 client, call 'authorize'.
   */
  constructor() {
    super(['spreadsheets']);
    this.sheets = googleapis.sheets('v4');
  }
  /**
   * Returns a Promise returned from GoogleAuthorize.authorize that
   * resolves the OAuth2 client that is used to make authorized requests
   * to the Sheets API.
   * @return {Promise} The promise that resolves the OAuth2 client (auth)
   */
  authorize() {
    return super.authorize()
  }
  /**
   * Collection: spreadsheets.values
   * https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values
   * This function corresponds with the append method of the values collection
   * of the Sheets API.
   * @param  {string} method  The name of the method from the
   *                          spreadsheets.values collection
   * @param  {google.auth.OAuth2} auth  The OAuth2 authorized client
   * @param  {object} payload The object to pass to the request to the API
   * @return {Promise}        The chainable Promise that resolves the response
   *                          from the request to the API and the
   *                          {google.auth.OAuth2} for additional work.
   */
  values(method, auth, payload) {
    if (!payload.auth) payload.auth = auth;
    return new Promise((resolve, reject) => {
      this.sheets.spreadsheets.values[method](payload, (err, resp) => {
          if (err) reject(err);
          resolve(auth, resp);
        }
      );
    });
  }
}
module.exports = SheetsAPI;


// sheets-client.js
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

sheets
  // Get me an authorized OAuth2 client thats ready to make requests.
  .authorize()
  // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append
  // Using the spreadsheets.values collection, use the 'append' method to
  // append data (payload) to a spreadsheet.
  .then(auth => sheets.values('append', auth, payload))
  // Oh I'm not done. Need to append again. Should I do anything using the
  // response from the first request? Naw.. I'm good.
  .then((auth, resp) => sheets.values('append', auth, payload))
  // Derp
  .catch(e => console.error(e))
