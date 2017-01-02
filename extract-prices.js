var ebayscraper = require('./lib/scrapers/ebay-price-scraper');
var amazonscraper = require('./lib/scrapers/amazon-price-scraper');
var httpGetPromise = require('./lib/helpers/httpGetPromise');

sites = [
  {name:'Ebay',
   protocol : 'http',
   host:'www.ebay.com',
   queryPattern:'/sch/i.html?_from=R40&_trksid=p2050601.m570.l1313.TR0.TRC0.H0.X.TRS2&_nkw=%s&_sacat=0',
   priceExtracter : ebayscraper,
   enabled : false
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

function queryForPrices(options, query) {

      var extractPrice = (element) => {

        return new Promise((resolve,reject) => {

          if(!element.enabled){
            console.log('Site is not enabled: ' + element.name);
            resolve();
            return;
          }

          httpGetPromise(element, query)
          .then((html) => {
              console.log('Got Results For: ' + element.host + ' Size: ' + html.length);
              return element.priceExtracter(html, query, element);
          })
          .then((productJson) => {
              console.log('Found the following information: ' + JSON.stringify(productJson));
              resolve();
          })
          .catch((err) => reject('fail'));

        });

      }

      var siteQueries = sites.map(extractPrice);

      return Promise.all(siteQueries);

}

console.log('Starting Test Run of Extract Prices');
queryForPrices(null, 'Dyson Pure Hot+Cool Purifier Heater')
  .then(function(){console.log('Finishing Run of Extract Prices')});
