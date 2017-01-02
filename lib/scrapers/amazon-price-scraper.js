const cheerio = require('cheerio');
var levenshtein = require('fast-levenshtein');

const STRING_COMPARE_THRESHOLD = 30;

function amazonPriceScrapper(html, query, site){

  const p = new Promise((resolve, reject) =>{

    const products = [];
    const $ = cheerio.load(html);
    // Go through the product list and build objects

    var items = $('.s-item-container');

    $(items).each(function(i,elem){

      var title = $(elem).find('.s-access-title').text();

      var l_distance = levenshtein.get(title, query);

      if(l_distance < STRING_COMPARE_THRESHOLD){

        const product = new Object();

        product.title = title;
        product.price = $(elem).find('.sx-price-whole').text().replace(/[^\d.-]/g,'');

        // Use the new / used price
        if(product.price == ''){
          product.price = $(elem).find('.a-color-base').first().text().replace(/[^\d.-]/g,'');
        }
        product.img = $(elem).find('.s-access-image').attr('src');
        product.uniqueId = $(elem).data('asin');

        product.freeshipping = true;

        products.push(product);

      }



    })

    resolve(products);

  });

  return p.catch(function(error){
    console.log('Amazon Scrapper Error', error);
  });

}

module.exports = amazonPriceScrapper;
