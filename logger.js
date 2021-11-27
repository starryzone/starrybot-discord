

const db = require("./db");

let logger = {
	info: (...args) => console.info(...args),
	log: (...args) => console.log(...args),
	err: (...args) => console.error(...args),
	error: (...args) => console.error(...args),
}

if (db.myConfig.WINSTON) {
	const winston = require('winston');
	const {LoggingWinston} = require('@google-cloud/logging-winston');
	const loggingWinston = new LoggingWinston();
	const wlog = winston.createLogger({
		level: 'info',
		transports: [new winston.transports.Console(), loggingWinston],
	});
	logger.info = (...args) => wlog.info(...args)
	logger.log = (...args) => wlog.info(...args)
	logger.err = (...args) => wlog.log('error',...args)
	logger.error = (...args) => wlog.log('error',...args)
}

module.exports = logger
