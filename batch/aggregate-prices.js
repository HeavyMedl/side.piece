const csv = require('fast-csv');
const json2csv = require('json2csv');
const extract_prices = require('../lib/helpers/extract-prices')
const MAX_EXECUTIONS = 30;
var counter = 0;
// Function to Map from Data to CSV format
function mapResults(value) {
	return new Promise(function(resolve, reject) {
			console.log("Gathering Prices for : " + value.Name);
			extract_prices(value.Name)
				.then(function(extractPriceData) {
					let siteResult = {};
					siteResult.Name = value.Name;
					siteResult.CostcoPrice = value.Price;
					console.log("LENGTH TEST ====== " + extractPriceData);
					for (var i = 0; i < extractPriceData.length; i++) {
						siteResult[extractPriceData[i].name + 'Price'] = extractPriceData[i].stats.mean;
						siteResult[extractPriceData[i].name + 'StDev'] = extractPriceData[i].stats.stdev;
						console.log(extractPriceData[i].name + ' Price: ' + extractPriceData[i].stats.mean + ' StDev: ' + extractPriceData[i].stats.stdev);
					}
					resolve(siteResult);
				});
		})
		.catch(function(error) {
			console.log('Error mapping Price Extract Result' + error);
		});
}

// use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
var valueArray = [];

var Price = require('../data/price.js');
// Process the Costco Products File
csv.fromPath(`./exports/costco-products.csv`, {
		headers: true
	})
	.on("data", value => {
		valueArray.push(value);
	})
	.on("end", () => {
		var index = 0;

		function next() {
			if (index <= valueArray.length) {

				var value = valueArray[index++];

				var price = new Price('Costco', value.Name);
				price.exists().then(

					function(exists){

						if(!exists){
								mapResults(value).
								  then(function(data) {
										var costcoPrice = new Price('Costco',value.Name);
										costcoPrice.create(data.CostcoPrice,0);
										return data;
									}).
									then((data)=>{
										var ebayPrice = new Price('Ebay',value.Name);
										ebayPrice.create(data.EbayPrice,data.EbayStDev);
										return data;
									}).
									then((data)=>{
										var amazonPrice = new Price('Amazon',value.Name);
										amazonPrice.create(data.AmazonPrice,data.AmazonStDev);
										return data;
									}).
									then(()=>{
										next();
									})
									console.log(data);
						}else{
								console.log('Already Extracted Prices for : ' + value.Name)
								next();
						}

					}
				)

			}
		}
		// start first iteration
		next();
	})
