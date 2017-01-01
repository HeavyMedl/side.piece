const json2csv = require('json2csv');
const CostcoProducts = require('../scrapers/costco-products.js');
/**
 * Creates a csv file out of the product list generataed by costco-products.js
 */
new CostcoProducts().get_products()
  .then(data => {
    let csv = json2csv({ data: data, fields: ['Name','Price'] });
    require('fs').writeFile('../../exports/costco-products.csv', csv, err => {
      if (err) throw err;
      console.log('File costco-products.csv saved to ./exports/');
    });
  });
