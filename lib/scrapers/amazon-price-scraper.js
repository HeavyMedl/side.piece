const cheerio = require('cheerio');

function amazonPriceScrapper(html, query, site){

  const p = new Promise((resolve, reject) =>{

    const products = [];
    const $ = cheerio.load(html);
    // Go through the product list and build objects

    resolve(products);

  });

  return p.catch(function(error){
    console.log('Amazon Scrapper Error', error);
  });

}

module.exports = amazonPriceScrapper;
