const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'passes-mktr',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // File transport for errors only
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Add request ID to logs
logger.addRequestId = (req, res, next) => {
  req.id = require('crypto').randomUUID();
  req.logger = logger.child({ requestId: req.id });
  next();
};

// Log API requests
logger.logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };

    if (res.statusCode >= 400) {
      req.logger.warn('API request completed with error', logData);
    } else {
      req.logger.info('API request completed', logData);
    }
  });

  next();
};

// Log pass operations
logger.logPassOperation = (operation, data) => {
  logger.info('Pass operation', {
    operation,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Log redemption events
logger.logRedemption = (event, data) => {
  logger.info('Redemption event', {
    event,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Log APNs events
logger.logAPNs = (event, data) => {
  logger.info('APNs event', {
    event,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Log security events
logger.logSecurity = (event, data) => {
  logger.warn('Security event', {
    event,
    ...data,
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;
