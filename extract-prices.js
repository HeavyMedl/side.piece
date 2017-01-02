var ebayscraper = require('./lib/scrapers/ebay-price-scraper');
var httpGetPromise = require('./lib/helpers/httpGetPromise');
var util = require('util');

sites = [
  {name:'Ebay',
   host:'http://www.ebay.com',
   queryPattern:'/sch/i.html?_from=R40&_trksid=p2050601.m570.l1313.TR0.TRC0.H0.X.TRS2&_nkw=%s&_sacat=0',
   priceExtracter : ebayscraper
  }
]

function queryForPrices(options, query) {

      var formattedQuery = encodeURIComponent(query);
      console.log('Formatted Query: ' + formattedQuery);

      var extractPrice = (element) => {

        var queryPath = util.format(element.queryPattern, formattedQuery);

        console.log('Querying: ' + element.host + ' Path: ' + queryPath);

        return new Promise((resolve,reject) => {

          var r = resolve;

          httpGetPromise(element.host + queryPath)
          .then((html) => {
              //element.priceExtracter(html);
              console.log('Got Results For: ' + element.host + ' Size: ' + html.length);
          })
          .then(() => {
              r();
          })
          .catch((err) => reject('fail'));

        });

      }

      var siteQueries = sites.map(extractPrice);

      return Promise.all(siteQueries);

}

console.log('Starting Test Run of Extract Prices');
queryForPrices(null, 'Wilson Jones Heavy-Duty Round Ring View Binder, 1 inch, White, 4ct')
  .then(function(){console.log('Finishing Run of Extract Prices')});
