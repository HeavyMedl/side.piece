var http = require('http-debug').http;
var fs = require('fs');
var crypto = require('crypto');

http.debug = 0;
filecache = new Object();
filecache.enabled = true;
filecache.directory = './urlcache/';

getContent = function(url) {
  // return new pending promise
  return new Promise((resolve, reject) => {

    var hash;

    if(filecache.enabled){

      hash = crypto.createHash('md5').update(url).digest('hex');

      if(fs.existsSync(filecache.directory + hash)){
        console.log('Cache Hit');
        resolve(fs.readFileSync(filecache.directory + hash, 'utf-8'));
        return;
      }else{
        console.log('Cache Miss');
      }
    }

    // select http or https module, depending on reqested url
    const lib = url.startsWith('https') ? require('https') : require('http');
    const request = lib.get(url, (response) => {
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
    })
};

module.exports = getContent;
