/**
 * Pass Configuration Schema
 * Defines the structure and validation rules for Apple Wallet pass configuration
 */

const passConfigSchema = {
  // Color configuration
  colors: {
    foreground: { 
      type: 'color', 
      default: 'rgb(255, 255, 255)',
      description: 'Text color for pass content'
    },
    background: { 
      type: 'color', 
      default: 'rgb(60, 65, 76)',
      description: 'Background color of the pass'
    },
    label: { 
      type: 'color', 
      default: 'rgb(255, 255, 255)',
      description: 'Color for field labels'
    }
  },

  // Field configuration limits
  fields: {
    header: { 
      max: 2, 
      configurable: true,
      description: 'Header fields at top of pass'
    },
    primary: { 
      max: 2, 
      configurable: true,
      description: 'Primary content fields'
    },
    secondary: { 
      max: 4, 
      configurable: true,
      description: 'Secondary content fields'
    },
    auxiliary: { 
      max: 4, 
      configurable: true,
      description: 'Auxiliary information fields'
    },
    back: { 
      max: -1, 
      configurable: true,
      description: 'Back of pass fields (unlimited)'
    }
  },

  // Image configuration
  images: {
    logo: { 
      required: true, 
      dimensions: [160, 50], // Apple's maximum dimensions
      description: 'Logo image (max 160x50px, auto-processed for aspect ratio)',
      aspectRatioHandling: 'smart' // Square logos centered, wide logos scaled to fit
    },
    icon: { 
      required: true, 
      dimensions: [29, 29],
      description: 'Icon image (29x29px)'
    },
    strip: { 
      required: false, 
      dimensions: [320, 84],
      description: 'Strip image (320x84px)'
    }
  },

  // Text alignment options
  textAlignment: {
    options: ['PKTextAlignmentLeft', 'PKTextAlignmentCenter', 'PKTextAlignmentRight', 'PKTextAlignmentNatural'],
    default: 'PKTextAlignmentLeft'
  }
};

/**
 * Field template configurations
 */
const fieldTemplates = {
  // Header field templates
  header: {
    status: {
      key: 'status',
      label: 'Status',
      value: 'Active',
      textAlignment: 'PKTextAlignmentRight'
    },
    redemptionCounter: {
      key: 'redemptionCounter',
      label: '',
      value: '{{stampsEarned}} / {{stampsRequired}}',
      textAlignment: 'PKTextAlignmentRight'
    }
    ,
    expiryHeader: {
      key: 'expiry',
      label: 'EXP',
      value: '{{expiryShort}}',
      textAlignment: 'PKTextAlignmentRight'
    },
    redemptionCard: {
      key: 'redemptionCard',
      label: '',
      value: 'Redemption Card',
      textAlignment: 'PKTextAlignmentRight'
    }
  },

  // Primary field templates
  primary: {
    balance: {
      key: 'balance',
      label: 'Stamps',
      value: '{{stampsEarned}} of {{stampsRequired}}',
      textAlignment: 'PKTextAlignmentCenter'
    },
    progress: {
      key: 'progress',
      label: 'Progress',
      value: '{{progressPercentage}}% Complete',
      textAlignment: 'PKTextAlignmentCenter'
    }
  },

  // Secondary field templates
  secondary: {
    customerInfo: {
      key: 'customerInfo',
      label: 'Card Holder',
      value: '{{customerName}}',
      textAlignment: 'PKTextAlignmentLeft'
    },
    redemptionCounter: {
      key: 'redemptionCounter',
      label: 'Redeemed',
      value: '{{stampsEarned}} out of {{stampsRequired}}',
      textAlignment: 'PKTextAlignmentLeft'
    },
    expiry: {
      key: 'expiry',
      label: 'Expires',
      value: '{{expiryDate}}',
      textAlignment: 'PKTextAlignmentRight'
    }
  },

  // Auxiliary field templates
  auxiliary: {
    nextReward: {
      key: 'nextReward',
      label: 'Next Reward',
      value: 'Free coffee at 10 stamps',
      textAlignment: 'PKTextAlignmentCenter'
    },
    points: {
      key: 'points',
      label: 'Points',
      value: '{{pointsEarned}} points',
      textAlignment: 'PKTextAlignmentLeft'
    }
  },

  // Back field templates
  back: {
    terms: {
      key: 'terms',
      label: 'Terms & Conditions',
      value: 'Valid at participating locations. Not transferable. Expires 1 year from issue date.',
      textAlignment: 'PKTextAlignmentLeft'
    },
    contact: {
      key: 'contact',
      label: 'Contact',
      value: '{{customerEmail}}',
      textAlignment: 'PKTextAlignmentLeft'
    },
    instructions: {
      key: 'instructions',
      label: 'How to Earn Stamps',
      value: 'Show this pass to staff when making a purchase. Each purchase earns one stamp.',
      textAlignment: 'PKTextAlignmentLeft'
    },
    rewards: {
      key: 'rewards',
      label: 'Reward Tiers',
      value: '5 stamps: Free pastry\n10 stamps: Free coffee\n15 stamps: Free meal',
      textAlignment: 'PKTextAlignmentLeft'
    }
  }
};

/**
 * Validate field configuration
 */
function validateFieldConfig(fieldType, fields) {
  const limits = passConfigSchema.fields[fieldType];
  
  if (limits.max > 0 && fields.length > limits.max) {
    throw new Error(`${fieldType} fields cannot exceed ${limits.max} fields`);
  }
  
  return true;
}

/**
 * Validate color configuration
 */
function validateColorConfig(colors) {
  const colorRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
  
  for (const [key, value] of Object.entries(colors)) {
    if (value && !colorRegex.test(value)) {
      throw new Error(`Invalid color format for ${key}: ${value}. Use rgb(r, g, b) format.`);
    }
  }
  
  return true;
}

module.exports = {
  passConfigSchema,
  fieldTemplates,
  validateFieldConfig,
  validateColorConfig
};
