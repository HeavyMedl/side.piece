const winston = require('winston');
const moment = require('moment');
const util = require('util');
const config = require('../../config.json');
const logger = new(winston.Logger)({
  handleExceptions: false,
  transports: [
    new(winston.transports.Console)({
      colorize: true,
      prettyPrint: true,
      timestamp() {
        return moment().format('YYYY-MM-DD HH:mm:ss.SSSS');
      }
    }),
  ],
});
module.exports = (context) => {
  logger.level = config.logger_level[context] || context;
  return logger;
}
/**
 * Create a logger in your module by doing the following
 * const logger = require('path/to/logger.js')('module_name')
 *
 * where module name maps to the definition in ./config.json OR can map
 * directly to the winston logger level strings ('error','warn','info',etc.)
 */
