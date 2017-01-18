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
// Clear the File
var fs = require('fs');
var logStream = fs.createWriteStream('./exports/aggregate-products.csv', {
	'flags': 'w'
});
// use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
var valueArray = [];
// Process the Costco Products File
csv.fromPath(`./exports/costco-products.csv`, {
		headers: true
	})
	.on("data", value => {
		valueArray.push(value);
	})
	.on("end", () => {
		var index = 0;
		const MAX_ACTIVE_THREADS = 5;
		var active_threads = 0;

		function next() {
			if (index <= valueArray.length) {
				mapResults(valueArray[index++])
					.then(function(data) {
						var columns = (index == 1 ? true : false);
						var csvDataString = json2csv({
							data: data,
							hasCSVColumnTitle: columns
						});
						console.log(csvDataString);
						logStream.write(csvDataString);
						logStream.write('\n');
						active_threads--;
						next();
					});
				console.log('==== PROMISE NUMBER ===== : ' + active_threads);
				if (active_threads < MAX_ACTIVE_THREADS) {
					active_threads++;
					next();
				}
			} else {
				logStream.end();
				resolve(results);
			}
		}
		// start first iteration
		next();
	})
