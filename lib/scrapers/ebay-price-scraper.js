const cheerio = require('cheerio');

function ebayPriceScrapper(html){

  const p = new Promise((resolve, reject) =>{

    const products = [];
    const $ = cheerio.load(html);
    // Go through the product list and build objects
    var totalItems = $('.rcnt').text();

    console.log('Found: ' + totalItems + ' total items');

    var items = $('.lvresult');

    // Ebay gives a good hint on the total number of results
    if(!isNaN(totalItems)){
      items = items.splice(0,totalItems);
    }

    $(items).each(function(i, elem){

      const product = new Object();

      product.title = $(elem).find('.lvtitle').text();
      product.price = $(elem).find('.lvprice').text().replace(/[^\d.-]/g,'');
      product.img = $(elem).find('img').attr('src');
      product.uniqueId = $(elem).attr('listingid');

      product.freeshipping = false;
      const shippingContents = $(elem).find('.ship').contents().toString();
      if(shippingContents.toLowerCase().indexOf('free')){
        product.freeshipping = true;
      }

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
