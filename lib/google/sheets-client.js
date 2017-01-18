const SheetsAPI = require('sheets-api');
const CostcoProducts = require('../scrapers/costco-products.js');
const csv = require('fast-csv');
const json2csv = require('json2csv');
const path = require('path');
const request = require('superagent');
const http = require('../helpers/httpGetPromise.js');
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
	from_CSV_to_sheets(csv_file) {
		let costco_objs = [];
		csv.fromPath(`./exports/${csv_file}`, {
				headers: true
			})
			.on("data", costco_obj => {
				costco_objs.push(costco_obj);
			})
			.on("end", () => {
				costco_objs.forEach(costco_obj => {
					// let url = this.ebay.replace('query', encodeURIComponent(costco_obj.Name));
					// console.log(url)
					http({
							name: 'Ebay',
							protocol: 'http',
							host: 'www.ebay.com',
							queryPattern: '/sch/i.html?_from=R40&_trksid=p2050601.m570.l1313.TR0.TRC0.H0.X.TRS2&_nkw=%s&_sacat=0',
							enabled: true
						}, costco_obj.Name)
						.then(html => {
							console.log('got it')
						})
				});
				// this.spreadsheets('batchUpdate', auth, {
				// 		spreadsheetId: this.id,
				// 		resource: {
				// 			requests: this.get_requests(values)
				// 		}
				// 	})
				// 	.then(auth => console.log('Done'))
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
