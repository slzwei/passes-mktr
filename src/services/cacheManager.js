const redis = require('redis');
const logger = require('../utils/logger');

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.redisClient = null;
    this.initialized = false;
    this.maxMemorySize = 1000; // Max items in memory cache
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Temporarily disable Redis for development
      if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
        this.redisClient = redis.createClient({
          url: process.env.REDIS_URL
        });

        this.redisClient.on('error', (err) => {
          logger.warn('Redis cache error (falling back to memory only):', err.message);
          this.redisClient = null;
        });

        this.redisClient.on('connect', () => {
          logger.info('✅ Redis cache connected');
        });

        await this.redisClient.connect();
      } else {
        logger.info('Redis disabled for development - using memory cache only');
        this.redisClient = null;
      }
    } catch (error) {
      logger.warn('Redis connection failed, using memory cache only:', error.message);
      this.redisClient = null;
    }

    this.initialized = true;
    logger.info('✅ Multi-level cache manager initialized');
  }

  async get(key, fallbackFn = null) {
    const startTime = Date.now();
    
    try {
      // Level 1: Memory cache (fastest - sub-millisecond)
      if (this.memoryCache.has(key)) {
        const duration = Date.now() - startTime;
        logger.debug('Cache hit (memory)', { key, duration: `${duration}ms` });
        return this.memoryCache.get(key);
      }
      
      // Level 2: Redis cache (fast - few milliseconds)
      if (this.redisClient) {
        try {
          const redisData = await this.redisClient.get(key);
          if (redisData) {
            const parsed = JSON.parse(redisData);
            // Promote to memory cache
            this.setMemory(key, parsed);
            const duration = Date.now() - startTime;
            logger.debug('Cache hit (Redis)', { key, duration: `${duration}ms` });
            return parsed;
          }
        } catch (redisError) {
          logger.debug('Redis get failed:', redisError.message);
        }
      }
      
      // Level 3: Fallback function (database, API, etc.)
      if (fallbackFn) {
        const data = await fallbackFn();
        if (data !== null && data !== undefined) {
          // Cache the result for future requests
          await this.set(key, data);
          const duration = Date.now() - startTime;
          logger.debug('Cache miss - data loaded from fallback', { key, duration: `${duration}ms` });
          return data;
        }
      }
      
      const duration = Date.now() - startTime;
      logger.debug('Cache miss - no data found', { key, duration: `${duration}ms` });
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      // Always set in memory for immediate access
      this.setMemory(key, value);

      // Set in Redis with TTL for persistence (only in production)
      if (this.redisClient && process.env.NODE_ENV === 'production') {
        try {
          const serialized = JSON.stringify(value);
          await this.redisClient.setEx(key, ttl, serialized);
          logger.debug('Cache set (memory + Redis)', { key, ttl });
        } catch (redisError) {
          logger.debug('Redis set failed:', redisError.message);
        }
      } else {
        logger.debug('Cache set (memory only)', { key });
      }
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  setMemory(key, value) {
    // Implement LRU eviction if memory cache is full
    if (this.memoryCache.size >= this.maxMemorySize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    
    this.memoryCache.set(key, value);
  }

  async invalidate(pattern) {
    try {
      // Clear memory cache
      const keysToDelete = [];
      for (const [key] of this.memoryCache) {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => this.memoryCache.delete(key));

      // Clear Redis cache (only in production)
      if (this.redisClient && process.env.NODE_ENV === 'production') {
        try {
          const keys = await this.redisClient.keys(`*${pattern}*`);
          if (keys.length > 0) {
            await this.redisClient.del(keys);
          }
        } catch (redisError) {
          logger.debug('Redis invalidate failed:', redisError.message);
        }
      }

      logger.debug('Cache invalidated', { pattern, memoryKeysDeleted: keysToDelete.length });
    } catch (error) {
      logger.error('Cache invalidate error:', error);
    }
  }

  async clear() {
    this.memoryCache.clear();

    if (this.redisClient && process.env.NODE_ENV === 'production') {
      try {
        await this.redisClient.flushAll();
      } catch (redisError) {
        logger.debug('Redis clear failed:', redisError.message);
      }
    }

    logger.info('Cache cleared');
  }

  getStats() {
    return {
      memorySize: this.memoryCache.size,
      maxMemorySize: this.maxMemorySize,
      redisConnected: !!this.redisClient,
      initialized: this.initialized
    };
  }

  async close() {
    if (this.redisClient && process.env.NODE_ENV === 'production') {
      try {
        await this.redisClient.quit();
        logger.info('Redis cache connection closed');
      } catch (error) {
        logger.warn('Error closing Redis connection:', error.message);
      }
    }

    this.memoryCache.clear();
    this.initialized = false;
  }
}

// Export singleton instance
module.exports = new CacheManager();
