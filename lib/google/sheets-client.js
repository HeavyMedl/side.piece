const SheetsAPI = require('sheets-api');
const CostcoProducts = require('../scrapers/costco-products.js');
const csv = require('fast-csv');
const json2csv = require('json2csv');
const path = require('path');
const each = require('async-each-series');
const request = require('superagent');
// Colors for console output
const chalk = require('chalk');
class SheetsClient extends SheetsAPI {
	constructor(id) {
		super();
		this.id = id;
		this.ebay = 'http://www.ebay.com/sch/i.html?_from=R40&_trksid=p2050601.m570.l1313.TR0.TRC0.H0.X.TRS2&_nkw=query&_sacat=0';
	}
	build_rows_from_values(values) {
		let rows = [];
		values.forEach((value_obj, i) => {
			let number = value_obj.Price ? value_obj.Price.replace(',', '') : "";
			let price = isNaN(parseFloat(number)) ? 0.00 : parseFloat(number)
			let row = {
				values: [{
					userEnteredValue: {
						stringValue: value_obj.ParentPartNumber || "Missing"
					}
				}, {
					userEnteredValue: {
						stringValue: value_obj.Name
					}
				}, {
					userEnteredValue: {
						numberValue: price
					}
				}]
			};
			rows.push(row);
		});
		return rows;
	}
	get_requests(values) {
		let requests = [];
		// Clear all values from the sheet.
		requests.push({
			updateCells: {
				range: {
					sheetId: 0,
					startRowIndex: 1
				},
				fields: "userEnteredValue"
			}
		});
		// Append rows from the values of the csv
		requests.push({
			appendCells: {
				sheetId: 0,
				rows: this.build_rows_from_values(values),
				fields: '*'
			}
		});
		return requests;
	}
	get_rows_by_name(product_name) {
		return this.authorize()
			.then(auth => this.values('get', auth, {
				spreadsheetId: this.id,
				range: 'Costco Prices!A:C',
			}))
			.then(resp_obj => {
				let row_arr = [];
				resp_obj.response.values.forEach(row => {
					let name = row[1];
					if (name.toLowerCase()
						.includes(product_name.toLowerCase())) {
						row_arr.push(row);
					}
				});
				resp_obj.row = row_arr;
				console.log(resp_obj.row);
				return resp_obj;
			})
	}
	from_costco_to_sheets() {
		new CostcoProducts()
			.get_products()
			.then(data => {
				this.authorize()
					.then(auth => this.spreadsheets('batchUpdate', auth, {
						spreadsheetId: this.id,
						resource: {
							requests: this.get_requests(data)
						}
					}));
			});
	}
	status(number) {
		return number >= 200 && number < 400 ? chalk.green(number) : chalk.red(number)
	}
	get_objs_from_CSV(csv_file) {
		return new Promise((resolve, reject) => {
			let costco_objs = [];
			csv.fromPath(`./exports/${csv_file}`, {
					headers: true
				})
				.on("data", costco_obj => {
					costco_objs.push(costco_obj);
				})
				.on("end", () => {
					resolve(costco_objs);
				});
		});
	}
	make_request(obj) {
		return new Promise((resolve, reject) => {
			request.get(obj.url)
				.end(function(err, resp) {
					if (err) console.error(chalk.bold.red(err.message))
					if (resp && resp.status) {
						console.log(chalk.black.bgWhite(obj.costco_obj.Name));
						console.log(chalk.gray('| REQ |') + ` to EBAY`);
						console.log(chalk.cyan('| RES |') + ` STATUS ${this.status(resp.status)}\n`);
						if (resp.status >= 400) {
							console.log(resp.res.text)
						}
					} else {
						console.log(chalk.black.bgWhite(obj.Name));
						console.log(resp + '\n');
					}
					resolve(resp);
				}.bind(this));
		})
	}
	scrape_retailers(costco_objs) {
		return new Promise((resolve, reject) => {
			each(costco_objs, function(costco_obj, next) {
				let url = this.ebay.replace('query', encodeURIComponent(costco_obj.Name));
				this.make_request({
						url: url,
						costco_obj: costco_obj
					})
					.then(resp => {});
			}.bind(this));
		});
		// let count = 0;
		// each(costco_objs, function(obj, next) {
		// 	let url = this.ebay.replace('query', encodeURIComponent(obj.Name));
		// 	request.get(url)
		// 		.end(function(err, resp) {
		// 			count++;
		// 			// if (count == 1) {
		// 			// 	console.log(resp.res.socket._host)
		// 			// 	console.log(resp.req.path)
		// 			// }
		// 			if (err) console.error(chalk.bold.red(err.message))
		// 			if (resp && resp.status) {
		// 				console.log(`${count}. ` + chalk.black.bgWhite(obj.Name));
		// 				console.log(chalk.gray('| REQ |') + ` to EBAY`);
		// 				console.log(chalk.cyan('| RES |') + ` STATUS ${this.status(resp.status)}\n`);
		// 				if (resp.status >= 400) {
		// 					console.log(resp.res.text)
		// 				}
		// 			} else {
		// 				console.log(`${count}. ` + chalk.black.bgWhite(obj.Name));
		// 				console.log(resp + '\n');
		// 			}
		// 			// next();
		// 		}.bind(this));
		// 	if (count % 10 == 0) {
		// 		setTimeout(function() {
		// 			next();
		// 		}, 5000);
		// 	} else {
		// 		next();
		// 	}
		// }.bind(this), function(err) {
		// 	console.log(chalk.bold(`Finished processing ${count} Costco Products.`));
		// });
		// this.spreadsheets('batchUpdate', auth, {
		// 		spreadsheetId: this.id,
		// 		resource: {
		// 			requests: this.get_requests(values)
		// 		}
		// 	})
		// 	.then(auth => console.log('Done'))
	}
	test(csv) {
		this.get_objs_from_CSV(csv)
			.then(objs => this.scrape_retailers(objs))
			.then(data => {
				console.log('kurt: ' + data)
			});
	}
	from_costco_to_CSV() {
		let export_path = path.resolve('exports/costco-products.csv');
		new CostcoProducts()
			.get_products()
			.then(data => {
				let csv = json2csv({
					data: data
				});
				require('fs')
					.writeFile(export_path, csv, err => {
						if (err) throw err;
						console.log(`File costco-products.csv saved to ${export_path}`);
					});
			});
	}
}
module.exports = SheetsClient;
