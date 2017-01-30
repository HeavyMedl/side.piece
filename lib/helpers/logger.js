const winston = require('winston');
const moment = require('moment');
const util = require('util');
const config = require('../../config.json');

function get_logger(context) {
  return new(winston.Logger)({
    handleExceptions: false,
    transports: [
      new(winston.transports.Console)({
        colorize: true,
        prettyPrint: true,
        label: context,
        timestamp() {
          return moment().format('YYYY-MM-DD HH:mm:ss.SSSS');
        }
      }),
    ],
  });
}
module.exports = (context, level) => {
  let logger = get_logger(context);
  logger.level = config.logger_level[level] || level;
  return logger;
}
/**
 * Create a logger in your module by doing the following
 * const logger = require('path/to/logger.js')('module_name')
 *
 * where module name maps to the definition in ./config.json OR can map
 * directly to the winston logger level strings ('error','warn','info',etc.)
 */
