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
        header: [],
        primary: [],
        secondary: [],
        auxiliary: [],
        back: [
          fieldTemplates.back.campaignDetails,
          fieldTemplates.back.rewards,
          fieldTemplates.back.contact,
          fieldTemplates.back.terms,
          fieldTemplates.back.storeLocator
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
    
    const fields = fieldConfigs.map(config => {
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

    // Filter out fields with empty values for back fields only
    if (fieldType === 'back') {
      return fields.filter(field => {
        const value = field.value;
        // Keep field if it has meaningful content (not just empty strings or template placeholders)
        return value && 
               value.trim() !== '' && 
               !value.includes('{{') && // Remove unresolved templates
               value !== 'undefined' &&
               value !== 'null';
      });
    }

    return fields;
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
      customerEmail,
      expirationDate,
      hasExpiryDate = false,
      // Campaign details for back fields
      startDate,
      endDate,
      location,
      targetAudience,
      contactPhone,
      contactWebsite,
      storeLocatorLink,
      rewardBreakdown,
      termsAndConditions
    } = passData;

    const data = {
      campaignName,
      customerName,
      stampsEarned,
      stampsRequired,
      customerEmail,
      progressPercentage: Math.round((stampsEarned / stampsRequired) * 100),
      // Campaign details for back fields
      startDate: startDate || '',
      endDate: endDate || '',
      location: location || '',
      targetAudience: targetAudience || '',
      contactEmail: customerEmail || '',
      contactPhone: contactPhone || '',
      contactWebsite: contactWebsite || '',
      storeLocatorLink: storeLocatorLink || '',
      rewardBreakdown: rewardBreakdown || 'Show this pass to staff when making a purchase to earn stamps.',
      termsAndConditions: termsAndConditions || 'Valid at participating locations. Not transferable. Expires 1 year from issue date.',
      ...(expirationDate && hasExpiryDate ? (() => {
        const d = new Date(expirationDate);
        if (isNaN(d.getTime())) return {};
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        return { expiryShort: `${dd}/${mm}/${yy}` };
      })() : {})
    };

    const config = {
      colors: {
        foreground: 'rgb(255, 255, 255)',
        background: 'rgb(60, 65, 76)',
        label: 'rgb(255, 255, 255)'
      },
      fields: {
        // Header: show expiry if available, otherwise status
        header: (() => {
          if (expirationDate && hasExpiryDate) {
            return this.buildFields('header', ['expiryHeader'], data);
          } else {
            return this.buildFields('header', ['status'], data);
          }
        })(),
        // Primary: empty for clean strip design (stamps are visual on strip)
        primary: [],
        // Secondary: show Card Holder and Redeemed status
        secondary: customerName ? this.buildFields('secondary', ['customerInfo', 'redemptionCounter'], data) : [],
        // Auxiliary fields: Keep empty for clean design
        auxiliary: [],
        back: (() => {
          const backFields = this.buildFields('back', ['campaignDetails', 'rewards', 'contact', 'terms', 'storeLocator'], data);
          logger.info('Generated back fields for loyalty card:', { 
            count: backFields.length,
            fields: backFields.map(f => ({ key: f.key, label: f.label, valueLength: f.value?.length || 0, hasValue: !!f.value })),
            dataKeys: Object.keys(data)
          });
          return backFields;
        })()
      }
    };

    return config;
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
        header: this.buildFields('header', ['redemptionCounter'], { stampsEarned, stampsRequired }),
        primary: this.buildFields('primary', ['balance'], { stampsEarned, stampsRequired }),
        // Secondary fields: Card Holder and Redeemed status
        secondary: customerName ? this.buildFields('secondary', ['customerInfo', 'redemptionCounter'], { 
          customerName, stampsEarned, stampsRequired 
        }) : [],
        back: this.buildFields('back', ['campaignDetails', 'rewards', 'contact', 'terms', 'storeLocator'], data)
      }
    };
  }

  /**
   * Points card template
   */
  getPointsTemplate(passData) {
    const { campaignName, customerName, pointsEarned = 0, membershipTier = 'Bronze', stampsEarned = 0, stampsRequired = 10 } = passData;

    return {
      colors: {
        foreground: 'rgb(255, 255, 255)',
        background: 'rgb(25, 25, 112)',
        label: 'rgb(255, 255, 255)'
      },
      fields: {
        header: this.buildFields('header', ['redemptionCounter'], { stampsEarned, stampsRequired }),
        primary: this.buildFields('primary', ['points'], { pointsEarned }),
        // Secondary fields: Card Holder and Redeemed status
        secondary: customerName ? this.buildFields('secondary', ['customerInfo', 'redemptionCounter'], { 
          customerName, stampsEarned, stampsRequired 
        }) : [],
        back: this.buildFields('back', ['campaignDetails', 'rewards', 'contact', 'terms', 'storeLocator'], data)
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
        header: this.buildFields('header', ['redemptionCounter'], { stampsEarned, stampsRequired }),
        primary: this.buildFields('primary', ['balance'], { stampsEarned, stampsRequired }),
        // Secondary fields: Card Holder and Redeemed status
        secondary: customerName ? this.buildFields('secondary', ['customerInfo', 'redemptionCounter'], { 
          customerName, stampsEarned, stampsRequired 
        }) : [],
        back: this.buildFields('back', ['campaignDetails', 'rewards', 'contact', 'terms', 'storeLocator'], data)
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
