const request = require('superagent');
const cheerio = require('cheerio');
const whilst = require('async.whilst');
class CostcoProducts {
  constructor() {
    this.url = "http://www.costco.com/CatalogSearch";
    this.products = [];
    this.page = 0;
    this.max = 121;
  }
  /**
   * This function builds an array of product objects by making asynchronous
   * requests (executing synchrnously using whilst). Because it returns a
   * promise, you can use the .then() methodology to do additional work. See
   * below for example.
   * @returns {Object} The promise to use for additional work
   */
  get_products() {
    return new Promise((resolve, reject) => {
      whilst(
        () => {
          return this.page < this.max
        }, cb => {
          this.page++;
          console.log(`${this.page} of ${this.max} | pageSize: 96`);
          request.get(this.url)
            .query({
              keyword: "*",
              pageSize: 96,
              currentPage: this.page
            })
            .end((err, resp) => {
              if (err) console.error(err);
              try {
                // Create the DOM for cheerio aka jquery
                let $ = cheerio.load(resp.res.text);
                // Go through the product list and build objects
                $('.product-list .product')
                  .each((i, elem) => {
                    let product = {};
                    let anchor_href = $(elem)
                      .find('a.thumbnail')
                      .attr('href')
                    if (anchor_href) {
                      product.ParentPartNumber = anchor_href.match(/\.product\.([^\.]*)/)[1];
                    }
                    product.Name = $(elem)
                      .find('.description')
                      .text();
                    product.Price = $(elem)
                      .find('.price')
                      .text()
                      .replace('$', '');
                    this.products.push(product);
                  });
              } catch (e) {
                console.error(e);
              }
              cb();
            });
        }, err => {
          if (err) reject(err);
          console.log('Done fetching products.');
          resolve(this.products);
        });
    });
  }
}
module.exports = CostcoProducts;
// Example usage
// let cp = new CostcoProducts();
// cp.get_products()
//   .then(data => {
//     console.log(data);
//   })
