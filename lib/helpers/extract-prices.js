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

priceQuery = {};

function runStats(productJson){

  const priceArray = [];

  productJson.forEach(function (product){
    priceArray.push(product.price);
  });

  productStats = {};
  productStats.mean =  stats.mean(priceArray);
  productStats.stdev = stats.stdev(priceArray);

  return productStats;

}

function queryForPrices(options, query) {

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
              results = {};
              results.stats = runStats(productJson);
              results.products = productJson;
              priceQuery[site.name] = results;
              resolve();
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

function syntaxHighlight(json) {
    if (typeof json != 'string') {
         json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

console.log('Starting Test Run of Extract Products');
queryForPrices(null, 'Fellowes Energizer Footrest')
  .then(function(){
      console.log('Finished Querying for Products');
      console.log(JSON.stringify(priceQuery,null,2));
    })
  .catch(function(error){
     console.log('Error Querying for Products', error)
  });
