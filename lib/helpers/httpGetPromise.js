var http = require('http-debug').http;
var fs = require('fs');
var crypto = require('crypto');
var util = require('util');

http.debug = 0;
filecache = new Object();
filecache.enabled = false;
filecache.directory = './urlcache/';

getContent = function(site, query) {
  // return new pending promise
  const p = new Promise((resolve, reject) => {

    var hash;

    var formattedQuery = encodeURIComponent(query);

    var queryPath = util.format(site.queryPattern, formattedQuery);

    console.log('Querying: ' + site.host + ' Path: ' + queryPath);

    if(filecache.enabled){

      hash = crypto.createHash('md5').update(site.host + queryPath).digest('hex');

      if(fs.existsSync(filecache.directory + hash)){
        console.log('Cache Hit');
        resolve(fs.readFileSync(filecache.directory + hash, 'utf-8'));
        return;
      }else{
        console.log('Cache Miss');
      }
    }

    if(!site.headers){
      site.headers = {};
    }

    var options = {
        hostname: site.host,
        port : site.protocol.startsWith('https') ? 443 : 80,
        path : queryPath,
        method : 'GET',
        headers : site.headers
    };

    // select http or https module, depending on reqested url
    const lib = site.protocol.startsWith('https') ? require('https') : require('http');
    const request = lib.request(options, (response) => {
      // handle http errors
      if (response.statusCode < 200 || response.statusCode > 299) {
         reject(new Error('Failed to load page, status code: ' + response.statusCode));
       }
      // temporary data holder
      const body = [];
      // on every content chunk, push it to the data array
      response.on('data', (chunk) => body.push(chunk));
      // we are done, resolve promise with those joined chunks
      response.on('end', () => {
        if(filecache.enabled){

          // This is ok to keep async
          fs.writeFile(filecache.directory + hash,body.join(''), function(err) {
                if(err) {
                    return console.log(err);
                }

                console.log("Cached File for later use!");
            });
        }
        resolve(body.join(''));
      });
    });
    // handle connection errors of the request
    request.on('error', (err) => reject(err))
    request.end();
    })

    return p.catch(function(error){
      console.log('Ebay Scrapper Error', error);
    });
};

module.exports = getContent;
