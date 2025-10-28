const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure log directory exists
const logDir = path.dirname(process.env.LOG_FILE || './logs/app.log');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.simple(),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'hopenest-api' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: process.env.LOG_FILE || './logs/app.log',
      level: 'error'
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: process.env.LOG_FILE || './logs/app.log'
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log')
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log')
    })
  ]
});

// If we're not in production then log to the console with format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Morgan stream for HTTP request logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;