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
   * Builds an array of "product" objects representing Costco's entire
   * online catalog. Once finished, calls callback(this.products) where
   * this.products looks like this: [{name: 'xbox one', price: '249.99'},...,{}]
   * @param {function} callback The function to call at the end
   *                            after the product list has been built
   */
  get_products(callback) {
    whilst(
      () => { return this.page < this.max },
      cb => {
        this.page++;
        console.log(`${this.page} of ${this.max} | pageSize: 96`);
        request.get(this.url)
          .query({
            keyword : "*",
            pageSize : 96,
            currentPage : this.page
          })
          .end((err, resp) => {
            if (err) console.error(err);
            try {
              // Create the DOM for cheerio aka jquery
              let $ = cheerio.load(resp.res.text);
              // Go through the product list and build objects
              $('.product-list .product .caption').each((i, elem) => {
                let product = {};
                product.name = $(elem).find('.description').text();
                product.price = $(elem).find('.price').text().replace('$','');
                this.products.push(product);
              });
            } catch (e) {
              console.error(e);
            }
            cb();
          });
      },
      err => {
        if (err) console.error(err);
        if (callback) callback(this.products);
        console.log('Done.');
      }
    );
  }
}
module.exports = CostcoProducts;

// Example usage
// var cp = new CostcoProducts();
// cp.get_products(data => console.log(data));
