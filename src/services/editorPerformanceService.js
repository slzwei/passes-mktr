/**
 * Editor Performance Service
 * Handles performance optimizations for WYSIWYG editor
 */

const logger = require('../utils/logger');

class EditorPerformanceService {
  constructor() {
    this.debounceTimers = new Map();
    this.throttleTimers = new Map();
    this.imageCache = new Map();
    this.previewCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }

  /**
   * Debounce function calls
   */
  debounce(key, func, delay = 300) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    const timer = setTimeout(() => {
      func();
      this.debounceTimers.delete(key);
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Throttle function calls
   */
  throttle(key, func, delay = 100) {
    if (this.throttleTimers.has(key)) {
      return;
    }

    func();

    const timer = setTimeout(() => {
      this.throttleTimers.delete(key);
    }, delay);

    this.throttleTimers.set(key, timer);
  }

  /**
   * Optimize image for web display
   */
  async optimizeImage(imageBuffer, options = {}) {
    const {
      maxWidth = 400,
      maxHeight = 300,
      quality = 80,
      format = 'webp'
    } = options;

    const cacheKey = `${imageBuffer.toString('base64').substring(0, 50)}_${maxWidth}_${maxHeight}_${quality}`;
    
    // Check cache first
    if (this.imageCache.has(cacheKey)) {
      const cached = this.imageCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.buffer;
      }
    }

    try {
      const sharp = require('sharp');
      
      const optimized = await sharp(imageBuffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality })
        .toBuffer();

      // Cache the result
      this.imageCache.set(cacheKey, {
        buffer: optimized,
        timestamp: Date.now()
      });

      return optimized;

    } catch (error) {
      logger.error('Image optimization failed:', error);
      return imageBuffer; // Return original on error
    }
  }

  /**
   * Cache preview data
   */
  cachePreview(key, previewData) {
    this.previewCache.set(key, {
      data: previewData,
      timestamp: Date.now()
    });
  }

  /**
   * Get cached preview
   */
  getCachedPreview(key) {
    const cached = this.previewCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * Lazy load images
   */
  createLazyImageLoader(container, options = {}) {
    const {
      rootMargin = '50px',
      threshold = 0.1
    } = options;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        }
      });
    }, {
      rootMargin,
      threshold
    });

    // Observe all lazy images in container
    const lazyImages = container.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => observer.observe(img));

    return observer;
  }

  /**
   * Batch DOM updates
   */
  batchDOMUpdates(updates) {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        updates.forEach(update => update());
        resolve();
      });
    });
  }

  /**
   * Optimize field rendering
   */
  optimizeFieldRendering(fields, renderFunction) {
    // Group fields by type for efficient rendering
    const groupedFields = fields.reduce((groups, field) => {
      const type = field.fieldType || 'default';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(field);
      return groups;
    }, {});

    // Render each group
    Object.entries(groupedFields).forEach(([type, groupFields]) => {
      this.batchDOMUpdates(() => {
        groupFields.forEach(field => renderFunction(field));
      });
    });
  }

  /**
   * Memoize expensive calculations
   */
  memoize(func, keyGenerator) {
    const cache = new Map();
    
    return (...args) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = func(...args);
      cache.set(key, result);
      
      // Limit cache size
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      return result;
    };
  }

  /**
   * Optimize color picker performance
   */
  optimizeColorPicker(container) {
    // Debounce color changes
    const colorInputs = container.querySelectorAll('input[type="color"]');
    
    colorInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        this.debounce(`color_${e.target.name}`, () => {
          // Trigger color change event
          const event = new CustomEvent('colorChanged', {
            detail: {
              name: e.target.name,
              value: e.target.value
            }
          });
          container.dispatchEvent(event);
        }, 150);
      });
    });
  }

  /**
   * Optimize drag and drop performance
   */
  optimizeDragAndDrop(container) {
    let dragElement = null;
    let dragStartTime = 0;

    container.addEventListener('dragstart', (e) => {
      dragElement = e.target;
      dragStartTime = Date.now();
      
      // Add visual feedback
      e.target.classList.add('dragging');
    });

    container.addEventListener('dragend', (e) => {
      if (dragElement) {
        dragElement.classList.remove('dragging');
        dragElement = null;
      }
    });

    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      
      // Throttle drag over events
      this.throttle('dragover', () => {
        const dropTarget = e.target.closest('.drop-target');
        if (dropTarget) {
          dropTarget.classList.add('drag-over');
        }
      }, 16); // ~60fps
    });

    container.addEventListener('dragleave', (e) => {
      const dropTarget = e.target.closest('.drop-target');
      if (dropTarget) {
        dropTarget.classList.remove('drag-over');
      }
    });
  }

  /**
   * Preload critical resources
   */
  async preloadResources(resources) {
    const preloadPromises = resources.map(async (resource) => {
      try {
        if (resource.type === 'image') {
          const img = new Image();
          img.src = resource.url;
          return new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
        } else if (resource.type === 'script') {
          return import(resource.url);
        }
      } catch (error) {
        logger.warn(`Failed to preload resource: ${resource.url}`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Monitor performance metrics
   */
  monitorPerformance() {
    const metrics = {
      memoryUsage: 0,
      renderTime: 0,
      cacheHitRate: 0,
      debounceCount: 0,
      throttleCount: 0
    };

    // Memory usage
    if (performance.memory) {
      metrics.memoryUsage = performance.memory.usedJSHeapSize;
    }

    // Cache hit rate
    const totalCacheRequests = this.imageCache.size + this.previewCache.size;
    metrics.cacheHitRate = totalCacheRequests > 0 ? 
      (this.imageCache.size / totalCacheRequests) * 100 : 0;

    return metrics;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    // Clear all timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.throttleTimers.forEach(timer => clearTimeout(timer));
    
    this.debounceTimers.clear();
    this.throttleTimers.clear();
    
    // Clear caches
    this.imageCache.clear();
    this.previewCache.clear();
    
    logger.info('Performance service cleaned up');
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      debounceTimers: this.debounceTimers.size,
      throttleTimers: this.throttleTimers.size,
      imageCache: this.imageCache.size,
      previewCache: this.previewCache.size,
      memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 0
    };
  }
}

module.exports = EditorPerformanceService;
