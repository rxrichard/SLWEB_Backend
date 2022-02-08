const { createLogger, format, transports } = require('winston');
const moment = require('moment');
const package = require('../package.json')
const { combine, timestamp, printf, errors } = format;

const customFormat = printf(({ level, message, timestamp, stack }) => {
  return JSON.stringify({
    timestamp: timestamp,
    datetime: moment(timestamp).format('DD/MM/YYYY HH:mm:ss'),
    level: level,
    data: message,
    stack: stack ? stack : null
  })
});

const logger = createLogger({
  format: combine(
    timestamp(),
    errors({ stack: true }),
    customFormat
  ),
  transports: [
    new transports.File({ filename: `dump/critical/error_v${package.version}.log`, level: 'error' }),
  ],
});

module.exports = logger