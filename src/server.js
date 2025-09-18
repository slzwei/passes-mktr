const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const http = require('http');
const path = require('path');
require('dotenv').config();

const logger = require('./utils/logger');
const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const WebSocketService = require('./services/websocketService');

// Import routes
const tenantRoutes = require('./routes/tenants');
const campaignRoutes = require('./routes/campaigns');
const passRoutes = require('./routes/passes');
const partnerRoutes = require('./routes/partners');
const redemptionRoutes = require('./routes/redemptions');
const editorRoutes = require('./routes/editor');
const barcodeRoutes = require('./routes/barcodes');
const validationRoutes = require('./routes/validation');
const exportRoutes = require('./routes/export');
const templateRoutes = require('./routes/templates');
const collaborationRoutes = require('./routes/collaboration');
const analyticsRoutes = require('./routes/analytics');
const stampUpdateRoutes = require('./routes/stampUpdates');
const previewMatchingPassRoutes = require('./routes/previewMatchingPass');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:", "https:"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    process.env.CORS_ORIGIN
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/tenants', tenantRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/passes', passRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/redemptions', redemptionRoutes);
app.use('/api/editor', editorRoutes);
app.use('/api/barcodes', barcodeRoutes);
app.use('/api/validation', validationRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/stamp-updates', stampUpdateRoutes);
app.use('/api', previewMatchingPassRoutes);

// Static files for pass assets
app.use('/assets', express.static('storage/assets'));

// Serve images from storage directory
app.use('/storage', express.static('storage'));

// Serve favicon and other static files
app.use(express.static('public'));

// Serve frontend build files
app.use(express.static('src/frontend/build'));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    requestId: req.id,
    url: req.url,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    requestId: req.id
  });
});

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/frontend/build/index.html'));
});

// Start server
async function startServer() {
  try {
    // Connect to database (optional for development)
    if (process.env.DATABASE_URL && process.env.DATABASE_URL !== 'postgresql://username:password@localhost:5432/passes_mktr') {
      await connectDatabase();
      logger.info('Database connected successfully');
    } else {
      logger.warn('Database connection skipped - using mock data for development');
    }

    // Connect to Redis (optional) - DISABLED FOR DEVELOPMENT
    // if (process.env.REDIS_URL && process.env.REDIS_URL.trim() !== '') {
    //   try {
    //     await connectRedis();
    //     logger.info('Redis connected successfully');
    //   } catch (error) {
    //     logger.warn('Redis connection failed - continuing without Redis:', error.message);
    //   }
    // } else {
    //   logger.warn('Redis connection skipped - no REDIS_URL provided');
    // }
    logger.warn('Redis connection disabled for development');

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize WebSocket service
    const wsService = new WebSocketService(server);
    logger.info('WebSocket service initialized');

    // Start HTTP server
    server.listen(PORT, HOST, () => {
      logger.info(`MKTR Passes API server running on ${HOST}:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Health check: http://${HOST}:${PORT}/health`);
      logger.info(`WebSocket enabled for real-time preview updates`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
