/**
 * Editor Validation Service
 * Provides real-time validation and Apple PassKit compliance checking
 */

const logger = require('../utils/logger');

class EditorValidationService {
  constructor() {
    this.validationCache = new Map();
    this.cacheTimeout = 5000; // 5 seconds
  }

  /**
   * Validate pass configuration with real-time feedback
   */
  async validateConfiguration(config, options = {}) {
    const {
      realTime = true,
      includeWarnings = true,
      includeSuggestions = true
    } = options;

    try {
      // Check cache first for real-time validation
      if (realTime) {
        const cacheKey = this.getCacheKey(config);
        const cached = this.validationCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.result;
        }
      }

      const result = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: [],
        fieldValidations: {},
        appleCompliance: {}
      };

      // Validate field structure
      await this.validateFieldStructure(config, result);
      
      // Validate colors
      await this.validateColors(config, result);
      
      // Validate Apple PassKit compliance
      await this.validateApplePassKit(config, result);
      
      // Validate business logic
      await this.validateBusinessLogic(config, result);
      
      // Generate suggestions
      if (includeSuggestions) {
        await this.generateSuggestions(config, result);
      }

      // Cache result for real-time validation
      if (realTime) {
        const cacheKey = this.getCacheKey(config);
        this.validationCache.set(cacheKey, {
          result,
          timestamp: Date.now()
        });
      }

      return result;

    } catch (error) {
      logger.error('Validation failed:', error);
      return {
        isValid: false,
        errors: ['Validation system error: ' + error.message],
        warnings: [],
        suggestions: [],
        fieldValidations: {},
        appleCompliance: {}
      };
    }
  }

  /**
   * Validate field structure
   */
  async validateFieldStructure(config, result) {
    if (!config.fields) {
      result.errors.push('Fields configuration is required');
      return;
    }

    const fieldLimits = {
      header: { max: 2, min: 0 },
      primary: { max: 2, min: 0 },
      secondary: { max: 4, min: 0 },
      auxiliary: { max: 4, min: 0 },
      back: { max: -1, min: 0 } // unlimited
    };

    Object.entries(config.fields).forEach(([fieldType, fields]) => {
      const limits = fieldLimits[fieldType];
      if (!limits) {
        result.errors.push(`Unknown field type: ${fieldType}`);
        return;
      }

      // Check field count
      if (limits.max > 0 && fields.length > limits.max) {
        result.errors.push(`${fieldType} fields exceed Apple limit of ${limits.max}`);
        result.fieldValidations[fieldType] = {
          isValid: false,
          error: `Maximum ${limits.max} fields allowed`
        };
      } else {
        result.fieldValidations[fieldType] = {
          isValid: true,
          count: fields.length,
          limit: limits.max
        };
      }

      // Validate individual fields
      fields.forEach((field, index) => {
        const fieldValidation = this.validateField(field, fieldType, index);
        if (!fieldValidation.isValid) {
          result.errors.push(...fieldValidation.errors);
        }
        if (fieldValidation.warnings.length > 0) {
          result.warnings.push(...fieldValidation.warnings);
        }
      });
    });
  }

  /**
   * Validate individual field
   */
  validateField(field, fieldType, index) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Required fields
    if (!field.key) {
      validation.errors.push(`${fieldType}[${index}]: key is required`);
      validation.isValid = false;
    }

    if (!field.label) {
      validation.errors.push(`${fieldType}[${index}]: label is required`);
      validation.isValid = false;
    }

    if (!field.value) {
      validation.warnings.push(`${fieldType}[${index}]: value is empty`);
    }

    // Validate key format
    if (field.key && !field.key.match(/^[a-zA-Z][a-zA-Z0-9_]*$/)) {
      validation.errors.push(`${fieldType}[${index}]: key must be alphanumeric and start with a letter`);
      validation.isValid = false;
    }

    // Validate text alignment
    if (field.textAlignment && !['PKTextAlignmentLeft', 'PKTextAlignmentCenter', 'PKTextAlignmentRight', 'PKTextAlignmentNatural'].includes(field.textAlignment)) {
      validation.errors.push(`${fieldType}[${index}]: invalid text alignment`);
      validation.isValid = false;
    }

    // Check for duplicate keys within same field type
    // This would need to be checked at the field type level

    return validation;
  }

  /**
   * Validate colors
   */
  async validateColors(config, result) {
    if (!config.colors) {
      result.warnings.push('No color configuration provided');
      return;
    }

    const colorRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
    const requiredColors = ['foreground', 'background', 'label'];

    requiredColors.forEach(colorType => {
      const color = config.colors[colorType];
      if (!color) {
        result.warnings.push(`${colorType} color not specified`);
      } else if (!colorRegex.test(color)) {
        result.errors.push(`Invalid ${colorType} color format. Use rgb(r, g, b) format.`);
      }
    });

    // Check color contrast
    if (config.colors.foreground && config.colors.background) {
      const contrast = this.calculateContrast(config.colors.foreground, config.colors.background);
      if (contrast < 4.5) {
        result.warnings.push('Low color contrast between foreground and background text');
      }
    }
  }

  /**
   * Validate Apple PassKit compliance
   */
  async validateApplePassKit(config, result) {
    result.appleCompliance = {
      isValid: true,
      issues: [],
      recommendations: []
    };

    // Check field limits
    if (config.fields) {
      const totalFields = Object.values(config.fields).reduce((sum, fields) => sum + fields.length, 0);
      if (totalFields > 20) {
        result.appleCompliance.issues.push('Total field count exceeds recommended limit');
        result.appleCompliance.recommendations.push('Consider reducing the number of fields for better performance');
      }
    }

    // Check for required elements
    if (!config.fields || !config.fields.header || config.fields.header.length === 0) {
      result.appleCompliance.recommendations.push('Consider adding header fields for better identification');
    }

    if (!config.fields || !config.fields.primary || config.fields.primary.length === 0) {
      result.appleCompliance.recommendations.push('Consider adding primary fields for main content');
    }

    // Check text length
    if (config.fields) {
      Object.entries(config.fields).forEach(([fieldType, fields]) => {
        fields.forEach((field, index) => {
          if (field.value && field.value.length > 100) {
            result.appleCompliance.issues.push(`${fieldType}[${index}]: text is too long (${field.value.length} chars)`);
          }
        });
      });
    }
  }

  /**
   * Validate business logic
   */
  async validateBusinessLogic(config, result) {
    // Check for empty configurations
    if (config.fields) {
      const hasContent = Object.values(config.fields).some(fields => fields.length > 0);
      if (!hasContent) {
        result.warnings.push('No fields configured - pass will be empty');
      }
    }

    // Check for meaningful content
    if (config.fields && config.fields.primary) {
      const hasPrimaryContent = config.fields.primary.some(field => field.value && field.value.trim().length > 0);
      if (!hasPrimaryContent) {
        result.warnings.push('Primary fields are empty - consider adding main content');
      }
    }
  }

  /**
   * Generate suggestions for improvement
   */
  async generateSuggestions(config, result) {
    // Suggest field additions
    if (!config.fields || !config.fields.header || config.fields.header.length === 0) {
      result.suggestions.push({
        type: 'field',
        fieldType: 'header',
        suggestion: 'Add a header field for campaign identification',
        priority: 'high'
      });
    }

    if (!config.fields || !config.fields.primary || config.fields.primary.length === 0) {
      result.suggestions.push({
        type: 'field',
        fieldType: 'primary',
        suggestion: 'Add a primary field for main content (e.g., stamp count)',
        priority: 'high'
      });
    }

    // Suggest color improvements
    if (config.colors) {
      if (config.colors.foreground === config.colors.background) {
        result.suggestions.push({
          type: 'color',
          suggestion: 'Foreground and background colors are the same - text will be invisible',
          priority: 'critical'
        });
      }
    }

    // Suggest content improvements
    if (config.fields) {
      Object.entries(config.fields).forEach(([fieldType, fields]) => {
        fields.forEach((field, index) => {
          if (field.value && field.value.length < 3) {
            result.suggestions.push({
              type: 'content',
              fieldType,
              index,
              suggestion: 'Field value is very short - consider adding more descriptive text',
              priority: 'low'
            });
          }
        });
      });
    }
  }

  /**
   * Calculate color contrast ratio
   */
  calculateContrast(color1, color2) {
    // Simple contrast calculation - in production, use a proper color library
    const rgb1 = this.parseRgb(color1);
    const rgb2 = this.parseRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;
    
    const lum1 = this.getLuminance(rgb1);
    const lum2 = this.getLuminance(rgb2);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Parse RGB color string
   */
  parseRgb(color) {
    const match = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }
    return null;
  }

  /**
   * Get relative luminance
   */
  getLuminance(rgb) {
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Get cache key for configuration
   */
  getCacheKey(config) {
    return JSON.stringify(config);
  }

  /**
   * Clear validation cache
   */
  clearCache() {
    this.validationCache.clear();
    logger.info('Validation cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.validationCache.size,
      timeout: this.cacheTimeout
    };
  }
}

module.exports = EditorValidationService;
