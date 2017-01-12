var ebayscraper = require('../scrapers/ebay-price-scraper');
var amazonscraper = require('../scrapers/amazon-price-scraper');
var httpGetPromise = require('./httpGetPromise');
const stats = require("stats-lite")

sites = [
  {name:'Ebay',
   protocol : 'http',
   host:'www.ebay.com',
   queryPattern:'/sch/i.html?_from=R40&_trksid=p2050601.m570.l1313.TR0.TRC0.H0.X.TRS2&_nkw=%s&_sacat=0',
   priceExtracter : ebayscraper,
   enabled : true
 },
 {name:'Amazon',
  protocol : 'https',
  host:'www.amazon.com',
  queryPattern:'/s/ref=nb_sb_noss?url=search-alias%3Daps&field-keywords=%s',
  priceExtracter : amazonscraper,
  enabled : true,
  headers : {
    'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Encoding':'utf-8',
    'Accept-Language':'en-US,en;q=0.8,en-GB;q=0.6,fr;q=0.4',
    'Host':'www.amazon.com',
    'Upgrade-Insecure-Requests':'1',
    'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'
  }
}
]


function runStats(productJson){

  const priceArray = [];

  productJson.forEach(function (product){
    priceArray.push(product.price);
  });

  productStats = {};
  productStats.mean  = stats.mean(priceArray);
  productStats.stdev = stats.stdev(priceArray);

  return productStats;

}

function queryForPrices(query) {

      var extractPrice = (site) => {

        return new Promise((resolve,reject) => {

          if(!site.enabled){
            console.log('Site is not enabled: ' + site.name);
            resolve();
            return;
          }

          httpGetPromise(site, query)
          .then((html) => {
              console.log('Got Results For: ' + site.host + ' Size: ' + html.length);
              return site.priceExtracter(html, query, site);
          })
          .then((productJson) => {
              var results = {};
              results.name = site.name;
              results.stats = runStats(productJson);
              results.products = productJson;
              resolve(results);
          })
          .catch((err) => {
              console.log('Error Querying: ' + site.name, err);
          });

        });

      }

      var siteQueries = sites.map(extractPrice);

      return Promise.all(siteQueries);

}

module.exports = queryForPrices;
