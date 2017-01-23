var n4j = require('./neo4j');

function Price(site, item, price, stdev) {

  this.site = site;
  this.item = item;
  this.session = n4j.session();

  this.createPriceQuery = "merge(a:Site{name:{site}}) merge(b:Item{name:{item}}) merge(a)-[r:Sells{price:{price},stdev:{stdev},created:TIMESTAMP()}]->(b) return r"
  this.existsQuery = "match(a:Site{name:{site}})-[r:Sells]->(b:Item{name:{item}}) return r";
}

Price.prototype.runQuery = function(query, params){
  return this.session.run(query, params)
    .then((result) => {this.session.close(); return result})
    .catch( ( err ) => { console.log( err ); this.session.close();} );;
}

Price.prototype.close = function(){
  console.log('-- Closing Connection');
  n4j.session().close()
  console.log('-- Closing ')
  n4j.close();
}

Price.prototype.exists = function(){

  return this.runQuery(this.existsQuery,{site:this.site,item:this.item})
    .then(function(result){
      return (result.records.length > 0) ? true : false;
    });

}

Price.prototype.create = function(price, stdev){

  if(isNaN(price)){
    price = 0;
  }

  if(isNaN(stdev)){
    stdev = 0;
  }

  return this.runQuery(this.createPriceQuery,{site:this.site,item:this.item,price:price,stdev:stdev});

}

module.exports = Price;

/*
var price = new Price('Costco','Fourth Item');

price.exists().
  then((existance)=>{(existance == true) ? console.log('Im a real record') : console.log('Im a fail record')}).
  then(()=>{price.close()});
*/
