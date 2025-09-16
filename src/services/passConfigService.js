/**
 * Pass Configuration Service
 * Handles field configuration and template management for Apple Wallet passes
 */

const { fieldTemplates, validateFieldConfig, validateColorConfig } = require('../schemas/passConfigSchema');
const logger = require('../utils/logger');

class PassConfigService {
  constructor() {
    this.defaultConfig = this.getDefaultConfig();
  }

  /**
   * Get default pass configuration
   */
  getDefaultConfig() {
    return {
      colors: {
        foreground: 'rgb(255, 255, 255)',
        background: 'rgb(60, 65, 76)',
        label: 'rgb(255, 255, 255)'
      },
      fields: {
        header: [fieldTemplates.header.campaign],
        primary: [],
        secondary: [],
        auxiliary: [],
        back: [
          fieldTemplates.back.terms,
          fieldTemplates.back.contact,
          fieldTemplates.back.instructions
        ]
      },
      images: {
        logo: null,
        icon: null,
        strip: null
      }
    };
  }

  /**
   * Build field configuration from template and data
   */
  buildFieldConfig(fieldType, templateKey, data = {}) {
    const template = fieldTemplates[fieldType][templateKey];
    if (!template) {
      throw new Error(`Template ${templateKey} not found for field type ${fieldType}`);
    }

    return {
      key: template.key,
      label: template.label,
      value: this.interpolateValue(template.value, data),
      textAlignment: template.textAlignment
    };
  }

  /**
   * Interpolate template values with actual data
   */
  interpolateValue(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  /**
   * Build all fields for a pass type
   */
  buildFields(fieldType, fieldConfigs, data = {}) {
    validateFieldConfig(fieldType, fieldConfigs);
    
    return fieldConfigs.map(config => {
      if (typeof config === 'string') {
        // If it's a template key, build from template
        return this.buildFieldConfig(fieldType, config, data);
      } else {
        // If it's a full config object, interpolate values
        return {
          key: config.key,
          label: config.label,
          value: this.interpolateValue(config.value, data),
          textAlignment: config.textAlignment || 'PKTextAlignmentLeft'
        };
      }
    });
  }

  /**
   * Get current field configuration for loyalty card
   */
  getLoyaltyCardConfig(passData) {
    const {
      campaignName,
      customerName,
      stampsEarned = 0,
      stampsRequired = 10,
      customerEmail
    } = passData;

    const data = {
      campaignName,
      customerName,
      stampsEarned,
      stampsRequired,
      customerEmail,
      progressPercentage: Math.round((stampsEarned / stampsRequired) * 100)
    };

    return {
      colors: {
        foreground: 'rgb(255, 255, 255)',
        background: 'rgb(60, 65, 76)',
        label: 'rgb(255, 255, 255)'
      },
      fields: {
        header: this.buildFields('header', ['campaign'], data),
        primary: this.buildFields('primary', [], data),
        secondary: customerName ? this.buildFields('secondary', ['customerInfo', 'redemptionCounter'], data) : [],
        auxiliary: this.buildFields('auxiliary', [], data),
        back: this.buildFields('back', ['terms', 'contact', 'instructions'], data)
      }
    };
  }

  /**
   * Validate complete pass configuration
   */
  validateConfig(config) {
    const errors = [];

    try {
      // Validate colors
      validateColorConfig(config.colors || {});
    } catch (error) {
      errors.push(error.message);
    }

    // Validate field counts
    Object.entries(config.fields || {}).forEach(([fieldType, fields]) => {
      try {
        validateFieldConfig(fieldType, fields);
      } catch (error) {
        errors.push(error.message);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Merge configuration with defaults
   */
  mergeWithDefaults(userConfig) {
    const merged = JSON.parse(JSON.stringify(this.defaultConfig));

    // Merge colors
    if (userConfig.colors) {
      Object.assign(merged.colors, userConfig.colors);
    }

    // Merge fields (replace entire arrays)
    if (userConfig.fields) {
      Object.assign(merged.fields, userConfig.fields);
    }

    // Merge images
    if (userConfig.images) {
      Object.assign(merged.images, userConfig.images);
    }

    return merged;
  }

  /**
   * Get available field templates
   */
  getFieldTemplates(fieldType) {
    return fieldTemplates[fieldType] || {};
  }

  /**
   * Get all field templates
   */
  getAllFieldTemplates() {
    return fieldTemplates;
  }

  /**
   * Generate real-time preview configuration
   * Optimized for WYSIWYG editor updates
   */
  generatePreviewConfig(template, passData) {
    try {
      // Merge template with pass data
      const mergedConfig = this.mergeWithDefaults(template);
      
      // Interpolate field values with pass data
      const interpolatedFields = {};
      Object.keys(mergedConfig.fields).forEach(fieldType => {
        interpolatedFields[fieldType] = mergedConfig.fields[fieldType].map(field => ({
          ...field,
          value: this.interpolateValue(field.value, passData)
        }));
      });

      return {
        ...mergedConfig,
        fields: interpolatedFields
      };
    } catch (error) {
      logger.error('Preview config generation failed:', error);
      throw error;
    }
  }

  /**
   * Get template by type
   */
  getTemplateByType(templateType, passData = {}) {
    const templates = {
      redemption: this.getRedemptionTemplate(passData),
      points: this.getPointsTemplate(passData),
      rewards: this.getRewardsTemplate(passData)
    };

    return templates[templateType] || this.getLoyaltyCardConfig(passData);
  }

  /**
   * Redemption card template
   */
  getRedemptionTemplate(passData) {
    const { campaignName, customerName, stampsEarned = 0, stampsRequired = 10 } = passData;

    return {
      colors: {
        foreground: 'rgb(255, 255, 255)',
        background: 'rgb(60, 65, 76)',
        label: 'rgb(255, 255, 255)'
      },
      fields: {
        header: this.buildFields('header', ['campaign'], { campaignName }),
        primary: this.buildFields('primary', ['balance'], { stampsEarned, stampsRequired }),
        secondary: customerName ? this.buildFields('secondary', ['customerInfo', 'redemptionCounter'], { 
          customerName, stampsEarned, stampsRequired 
        }) : [],
        auxiliary: this.buildFields('auxiliary', ['nextReward'], { 
          nextReward: `Free reward at ${stampsRequired} stamps` 
        }),
        back: this.buildFields('back', ['terms', 'contact', 'instructions'], passData)
      }
    };
  }

  /**
   * Points card template
   */
  getPointsTemplate(passData) {
    const { campaignName, customerName, pointsEarned = 0, membershipTier = 'Bronze' } = passData;

    return {
      colors: {
        foreground: 'rgb(255, 255, 255)',
        background: 'rgb(25, 25, 112)',
        label: 'rgb(255, 255, 255)'
      },
      fields: {
        header: this.buildFields('header', ['campaign'], { campaignName }),
        primary: this.buildFields('primary', ['points'], { pointsEarned }),
        secondary: customerName ? this.buildFields('secondary', ['customerInfo', 'tier'], { 
          customerName, membershipTier 
        }) : [],
        auxiliary: this.buildFields('auxiliary', [], {}),
        back: this.buildFields('back', ['terms', 'contact'], passData)
      }
    };
  }

  /**
   * Rewards card template
   */
  getRewardsTemplate(passData) {
    const { campaignName, customerName, stampsEarned = 0, stampsRequired = 10, spendAmount = 10 } = passData;

    return {
      colors: {
        foreground: 'rgb(255, 255, 255)',
        background: 'rgb(139, 69, 19)',
        label: 'rgb(255, 255, 255)'
      },
      fields: {
        header: this.buildFields('header', ['campaign'], { campaignName }),
        primary: this.buildFields('primary', ['balance'], { stampsEarned, stampsRequired }),
        secondary: customerName ? this.buildFields('secondary', ['customerInfo', 'spendAmount'], { 
          customerName, spendAmount 
        }) : [],
        auxiliary: this.buildFields('auxiliary', ['nextReward'], { 
          nextReward: `Spend $${spendAmount} to earn stamp` 
        }),
        back: this.buildFields('back', ['terms', 'contact', 'instructions'], passData)
      }
    };
  }

  /**
   * Validate template for Apple PassKit compliance
   */
  validateTemplateCompliance(template) {
    const errors = [];
    const warnings = [];

    // Field count validation
    const limits = {
      header: 2,
      primary: 2,
      secondary: 4,
      auxiliary: 4,
      back: -1 // unlimited
    };

    Object.entries(template.fields || {}).forEach(([fieldType, fields]) => {
      if (limits[fieldType] > 0 && fields.length > limits[fieldType]) {
        errors.push(`${fieldType} fields exceed Apple limit of ${limits[fieldType]}`);
      }
    });

    // Color format validation
    Object.entries(template.colors || {}).forEach(([colorType, color]) => {
      if (color && !color.match(/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/)) {
        errors.push(`Invalid ${colorType} color format. Use rgb(r, g, b) format.`);
      }
    });

    // Warnings for best practices
    if (template.fields && template.fields.primary && template.fields.primary.length === 0) {
      warnings.push('Consider adding primary fields for better user experience');
    }

    if (template.fields && template.fields.header && template.fields.header.length === 0) {
      warnings.push('Consider adding header fields for campaign identification');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

module.exports = PassConfigService;
