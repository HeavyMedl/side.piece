
var http = require('http-debug').http;
var escapehtml = require('html-escape');
var ebayscraper = require('./lib/scrapers/ebay-price-scraper');
var util = require('util');

http.debug = 2;

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

    sites.forEach(function(element){

      var queryPath = util.format(element.queryPattern, formattedQuery);

      console.log('Querying: ' + element.host + ' Path: ' + queryPath);

      var request = http.get(element.host + queryPath, function (res) {
      var data = '';
        res.on('data', function (chunk) {
          data += chunk;
        });
        res.on('end', function () {
          console.log(data);
        });
      });

    });

}

console.log('Starting Test Run of Extract Prices');
queryForPrices(null, 'Wilson Jones Heavy-Duty Round Ring View Binder, 1 inch, White, 4ct');
console.log('Finishing Run of Extract Prices');
