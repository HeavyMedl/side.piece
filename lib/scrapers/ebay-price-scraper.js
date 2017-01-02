const cheerio = require('cheerio');

function ebayPriceScrapper(html){

  const p = new Promise((resolve, reject) =>{

    const products = [];
    const $ = cheerio.load(html);
    // Go through the product list and build objects
    var totalItems = $('.rcnt').html();

    console.log('Found: ' + totalItems + ' total items');

    var items = $('.lvresult');

    items = items.splice(0,totalItems);

    items.each(function(){

      const product = new Object();

      products.push(product);

    })

    console.log('Created: ' + products.length + 'total items');

    resolve(products);

  });

  return p.catch(function(error){
    console.log('Ebay Scrapper Error', error);
  });

}

module.exports = ebayPriceScrapper;
