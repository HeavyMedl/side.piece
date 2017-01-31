const SheetsAPI = require('sheets-api');
const CostcoProducts = require('../scrapers/costco-products.js');
const csv = require('fast-csv');
const json2csv = require('json2csv');
const path = require('path');
const each = require('async-each-series');
const request = require('superagent');
const retailers = require('../../retailers.json');
const ebayscraper = require('../scrapers/ebay-price-scraper');
const amazonscraper = require('../scrapers/amazon-price-scraper');
const logger = require('../helpers/logger.js')(module, 'sheets_client');
class SheetsClient extends SheetsAPI {
  constructor(id) {
    super();
    this.id = id;
  }
  build_rows_from_values(values) {
    let rows = [];
    values.forEach((value_obj, i) => {
      let number = value_obj.Price ? value_obj.Price.replace(',', '') : "";
      let price = isNaN(parseFloat(number)) ? 0.00 : parseFloat(number)
      let row = {
        values: [{
          userEnteredValue: {
            stringValue: value_obj.ParentPartNumber || "Missing"
          }
        }, {
          userEnteredValue: {
            stringValue: value_obj.Name
          }
        }, {
          userEnteredValue: {
            numberValue: price
          }
        }]
      };
      rows.push(row);
    });
    return rows;
  }
  get_requests(values) {
    let requests = [];
    // Clear all values from the sheet.
    requests.push({
      updateCells: {
        range: {
          sheetId: 0,
          startRowIndex: 1
        },
        fields: "userEnteredValue"
      }
    });
    // Append rows from the values of the csv
    requests.push({
      appendCells: {
        sheetId: 0,
        rows: this.build_rows_from_values(values),
        fields: '*'
      }
    });
    return requests;
  }
  get_rows_by_name(product_name) {
    return this.authorize().then(auth => this.values('get', auth, {
      spreadsheetId: this.id,
      range: 'Costco Prices!A:C',
    })).then(resp_obj => {
      let row_arr = [];
      resp_obj.response.values.forEach(row => {
        let name = row[1];
        if (name.toLowerCase().includes(product_name.toLowerCase())) {
          row_arr.push(row);
        }
      });
      resp_obj.row = row_arr;
      logger.info(resp_obj.row);
      return resp_obj;
    })
  }
  from_costco_to_sheets() {
    new CostcoProducts().get_products().then(data => {
      this.authorize().then(auth => this.spreadsheets('batchUpdate', auth, {
        spreadsheetId: this.id,
        resource: {
          requests: this.get_requests(data)
        }
      }));
    });
  }
  get_objs_from_CSV(csv_file) {
    return new Promise((resolve, reject) => {
      let costco_objs = [];
      csv.fromPath(`./exports/${csv_file}`, {
        headers: true
      }).on("data", costco_obj => {
        costco_objs.push(costco_obj);
      }).on("end", () => {
        resolve(costco_objs);
      });
    });
  }
  get_scraper(retailer_name) {
    let scraper = () => []; // This doesn't look like anything to me.
    switch (retailer_name) {
      case 'EBAY':
        scraper = ebayscraper;
        break;
      case 'AMAZON':
        scraper = amazonscraper;
        break;
      default:
        logger.error(`get_scraper: No scraper found for ${retailer_name}.`);
    }
    return scraper;
  }
  make_request(obj) {
    return new Promise((resolve, reject) => {
      request.get(obj.url).set(obj.retailer.headers).end(function(err, resp) {
        if (err) logger.error(`make_request: ${err.message}`);
        if (resp && resp.status) {
          logger.info(`make_request: PRODUCT: ${obj.product}`);
          logger.info(`make_request: REQ to ${obj.retailer.name}`);
          logger.info(`make_request: RES STATUS ${resp.status}`);
          if (resp.res.text.toLowerCase().includes('robot')) {
            logger.warn(`make_request: Robot detected`);
          }
          if (resp.status >= 400) {
            logger.error(`make_request: ${resp.res.text}`);
            resolve([]);
          } else {
            let scraper = this.get_scraper(obj.retailer.name);
            let scraped_data = scraper(resp.res.text, obj.product);
            resolve(scraped_data);
          }
        } else {
          logger.error(`make_request: ${obj.product}`, resp);
          resolve([]);
        }
      }.bind(this));
    });
  }
  get_data_from_retailers(keyword) {
    let requests = [];
    Object.keys(retailers).forEach(retailer_key => {
      let retailer = retailers[retailer_key];
      requests.push(this.make_request({
        url: this.get_url(retailer_key, keyword),
        product: keyword,
        retailer: retailer
      }))
    });
    return Promise.all(requests);
  }
  get_url(retailer, keywords) {
    let r = retailers[retailer];
    let url = `${r.protocol}${r.host}${r.path.replace('_keywords_', encodeURIComponent(keywords))}`;
    return url;
  }
  scrape_retailers(costco_objs) {
    return new Promise((resolve, reject) => {
      let count = 0;
      each(costco_objs, function(costco_obj, next) {
        count++;
        this.get_data_from_retailers(costco_obj.Name).then(data => {
          logger.verbose(`scrape_retailers: Extracted data from retailers`, data);
        })
        if (count % 10 == 0) {
          setTimeout(function() {
            next();
          }, 1000)
        } else {
          next();
        }
      }.bind(this));
    });
  }
  test(csv) {
    this.get_objs_from_CSV(csv).then(objs => this.scrape_retailers(objs)).then(data => {});
  }
  from_costco_to_CSV() {
    let export_path = path.resolve('exports/costco-products.csv');
    new CostcoProducts().get_products().then(data => {
      let csv = json2csv({
        data: data
      });
      require('fs').writeFile(export_path, csv, err => {
        if (err) {
          logger.error(`from_costco_to_CSV: Error writing file`, err);
          throw err
        }
        logger.info(`from_costco_to_CSV: File costco-products.csv saved to ${export_path}`);
      });
    });
  }
}
module.exports = SheetsClient;
