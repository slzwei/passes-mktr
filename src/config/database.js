const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool;
let useDatabase = false;

const connectDatabase = async () => {
  try {
    // Check if we should use database
    if (process.env.DATABASE_URL &&
        process.env.DATABASE_URL !== 'postgresql://username:password@localhost:5432/passes_mktr') {

      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: parseInt(process.env.DB_POOL_SIZE) || 10,
        idleTimeoutMillis: parseInt(process.env.DB_TIMEOUT) * 1000 || 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test the connection
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      useDatabase = true;
      logger.info('✅ Database connection established');
      return pool;
    } else {
      useDatabase = false;
      logger.warn('⚠️ Database connection skipped - using file-based storage for development');
      return null;
    }
  } catch (error) {
    useDatabase = false;
    logger.error('❌ Database connection failed, falling back to file-based storage:', error.message);
    return null;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return pool;
};

const isDatabaseConnected = () => {
  return useDatabase && pool !== null;
};

const query = async (text, params) => {
  if (!isDatabaseConnected()) {
    throw new Error('Database not connected. Use file-based operations instead.');
  }

  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    logger.debug('Database query executed', {
      query: text.substring(0, 100) + '...',
      duration: `${duration}ms`,
      rows: result.rowCount
    });

    return result;
  } catch (error) {
    logger.error('Database query failed:', {
      query: text,
      params,
      error: error.message
    });
    throw error;
  }
};

const getClient = async () => {
  return await pool.connect();
};

const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    logger.info('Database connection closed');
  }
};

module.exports = {
  connectDatabase,
  getPool,
  isDatabaseConnected,
  query,
  getClient,
  closeDatabase
};
