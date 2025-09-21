const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const http = require('http');
const path = require('path');
const fs = require('fs');
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
const templateRoutes = require('./routes/templates');
const collaborationRoutes = require('./routes/collaboration');
const analyticsRoutes = require('./routes/analytics');
const stampUpdateRoutes = require('./routes/stampUpdates');

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
      childSrc: ["'self'", 'blob:', 'http://localhost:3000', 'https://localhost:3000'],
      frameSrc: ["'self'", 'blob:', 'http://localhost:3000', 'https://localhost:3000'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000', // Dashboard (frontend)
    'http://localhost:3001', // API server
    'http://localhost:5173', // Legacy dashboard port
    'http://localhost:5174', // Editor
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    process.env.CORS_ORIGIN
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting (disabled in development)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use(limiter);
} else {
  logger.info('Rate limiting disabled in development');
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      try {
        logger.info(message.trim());
      } catch (error) {
        console.log(message.trim()); // Fallback to console if logger fails
      }
    }
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
app.use('/api/templates', templateRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/stamp-updates', stampUpdateRoutes);

// Static files for pass assets
app.use('/assets', express.static('storage/assets'));

// Serve images from storage directory with absolute path and no fallthrough
app.use('/storage', express.static(path.resolve(process.cwd(), 'storage'), { fallthrough: false }));

// Serve favicon and other static files
app.use(express.static('public'));

// Serve dashboard build files
app.use(express.static('apps/dashboard/dist'));

// Serve editor build files at /editor route
app.use('/editor', express.static('apps/editor/build'));

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

// Serve editor index.html for editor routes
app.get('/editor*', (req, res) => {
  res.sendFile(path.join(__dirname, '../apps/editor/build/index.html'));
});

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../apps/dashboard/dist/index.html'));
});

// Utility function to copy default assets if missing
function copyDefaultIfMissing(sourcePath, targetPath) {
  const fullSourcePath = path.resolve(process.cwd(), sourcePath);
  const fullTargetPath = path.resolve(process.cwd(), targetPath);
  
  if (!fs.existsSync(fullTargetPath) && fs.existsSync(fullSourcePath)) {
    try {
      const targetDir = path.dirname(fullTargetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.copyFileSync(fullSourcePath, fullTargetPath);
      logger.info(`Copied default asset: ${sourcePath} -> ${targetPath}`);
    } catch (error) {
      logger.error(`Failed to copy default asset ${sourcePath} -> ${targetPath}:`, error.message);
    }
  }
}

// Ensure required directories exist
function ensureDirectories() {
  const requiredDirs = [
    'storage',
    'storage/images',
    'storage/images/processed',
    'storage/tmp',
    'storage/passes',
    'storage/templates'
  ];
  
  requiredDirs.forEach(dir => {
    const fullPath = path.resolve(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  });
}

// Start server
async function startServer() {
  try {
    // Ensure required directories exist
    ensureDirectories();
    
    // Copy default assets if missing
    copyDefaultIfMissing('pass-assets/strip-placeholder.png', 'storage/images/processed/default-strip-background.png');
    copyDefaultIfMissing('pass-assets/strip-placeholder.png', 'storage/images/processed/default-strip-background@2x.png');
    copyDefaultIfMissing('pass-assets/strip-placeholder.png', 'storage/images/processed/default-strip-background@3x.png');
    copyDefaultIfMissing('pass-assets/icon.png', 'storage/images/processed/icon.png');
    copyDefaultIfMissing('pass-assets/icon@2x.png', 'storage/images/processed/icon@2x.png');
    copyDefaultIfMissing('pass-assets/icon@3x.png', 'storage/images/processed/icon@3x.png');
    
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
