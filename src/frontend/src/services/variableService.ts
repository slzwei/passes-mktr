export interface Variable {
  key: string;
  label: string;
  description: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'percentage' | 'boolean';
  defaultValue?: any;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  category: string;
  examples?: string[];
}

export interface VariableCategory {
  name: string;
  description: string;
  variables: Variable[];
}

export class VariableService {
  private static instance: VariableService;

  constructor() {}

  static getInstance(): VariableService {
    if (!VariableService.instance) {
      VariableService.instance = new VariableService();
    }
    return VariableService.instance;
  }

  // Get all variable categories
  getVariableCategories(): VariableCategory[] {
    return [
      {
        name: 'Customer Information',
        description: 'Customer-related data and personal information',
        variables: [
          {
            key: 'customerName',
            label: 'Customer Name',
            description: 'Full name of the customer',
            type: 'string',
            required: true,
            category: 'Customer Information',
            examples: ['John Doe', 'Jane Smith']
          },
          {
            key: 'customerEmail',
            label: 'Customer Email',
            description: 'Email address of the customer',
            type: 'string',
            required: true,
            validation: {
              pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
              message: 'Please enter a valid email address'
            },
            category: 'Customer Information',
            examples: ['john@example.com', 'jane@company.com']
          },
          {
            key: 'customerId',
            label: 'Customer ID',
            description: 'Unique identifier for the customer',
            type: 'string',
            required: true,
            category: 'Customer Information',
            examples: ['CUST-12345', 'USER-67890']
          },
          {
            key: 'customerPhone',
            label: 'Customer Phone',
            description: 'Phone number of the customer',
            type: 'string',
            category: 'Customer Information',
            examples: ['+1-555-123-4567', '+65-9123-4567']
          }
        ]
      },
      {
        name: 'Campaign Information',
        description: 'Campaign and program-related data',
        variables: [
          {
            key: 'campaignId',
            label: 'Campaign ID',
            description: 'Unique identifier for the campaign',
            type: 'string',
            required: true,
            category: 'Campaign Information',
            examples: ['CAMP-001', 'LOYALTY-2024']
          },
          {
            key: 'campaignName',
            label: 'Campaign Name',
            description: 'Name of the loyalty campaign',
            type: 'string',
            required: true,
            category: 'Campaign Information',
            examples: ['Coffee Loyalty Program', 'Retail Rewards']
          },
          {
            key: 'tenantName',
            label: 'Company Name',
            description: 'Name of the company or organization',
            type: 'string',
            required: true,
            category: 'Campaign Information',
            examples: ['Coffee Corner', 'Fashion Store']
          },
          {
            key: 'programType',
            label: 'Program Type',
            description: 'Type of loyalty program',
            type: 'string',
            category: 'Campaign Information',
            examples: ['Stamps', 'Points', 'Tiers']
          }
        ]
      },
      {
        name: 'Loyalty Data',
        description: 'Loyalty program specific data',
        variables: [
          {
            key: 'stampsEarned',
            label: 'Stamps Earned',
            description: 'Number of stamps currently earned',
            type: 'number',
            defaultValue: 0,
            validation: {
              min: 0,
              message: 'Stamps earned cannot be negative'
            },
            category: 'Loyalty Data',
            examples: ['0', '5', '10']
          },
          {
            key: 'stampsRequired',
            label: 'Stamps Required',
            description: 'Total number of stamps required for reward',
            type: 'number',
            defaultValue: 10,
            validation: {
              min: 1,
              message: 'Stamps required must be at least 1'
            },
            category: 'Loyalty Data',
            examples: ['10', '20', '50']
          },
          {
            key: 'pointsEarned',
            label: 'Points Earned',
            description: 'Number of points currently earned',
            type: 'number',
            defaultValue: 0,
            validation: {
              min: 0,
              message: 'Points earned cannot be negative'
            },
            category: 'Loyalty Data',
            examples: ['0', '150', '500']
          },
          {
            key: 'pointsRequired',
            label: 'Points Required',
            description: 'Number of points required for next reward',
            type: 'number',
            defaultValue: 100,
            validation: {
              min: 1,
              message: 'Points required must be at least 1'
            },
            category: 'Loyalty Data',
            examples: ['100', '500', '1000']
          },
          {
            key: 'membershipTier',
            label: 'Membership Tier',
            description: 'Current membership tier level',
            type: 'string',
            category: 'Loyalty Data',
            examples: ['Bronze', 'Silver', 'Gold', 'Platinum']
          }
        ]
      },
      {
        name: 'Transaction Data',
        description: 'Purchase and transaction information',
        variables: [
          {
            key: 'spendAmount',
            label: 'Spend Amount',
            description: 'Amount spent in the current transaction',
            type: 'currency',
            defaultValue: 0,
            validation: {
              min: 0,
              message: 'Spend amount cannot be negative'
            },
            category: 'Transaction Data',
            examples: ['$5.50', '$25.00', '$100.00']
          },
          {
            key: 'totalSpent',
            label: 'Total Spent',
            description: 'Total amount spent in the program',
            type: 'currency',
            defaultValue: 0,
            validation: {
              min: 0,
              message: 'Total spent cannot be negative'
            },
            category: 'Transaction Data',
            examples: ['$50.00', '$250.00', '$1000.00']
          },
          {
            key: 'transactionId',
            label: 'Transaction ID',
            description: 'Unique identifier for the transaction',
            type: 'string',
            category: 'Transaction Data',
            examples: ['TXN-12345', 'ORDER-67890']
          },
          {
            key: 'storeLocation',
            label: 'Store Location',
            description: 'Location where the transaction occurred',
            type: 'string',
            category: 'Transaction Data',
            examples: ['Downtown Store', 'Mall Branch', 'Online']
          }
        ]
      },
      {
        name: 'Rewards & Offers',
        description: 'Reward and offer information',
        variables: [
          {
            key: 'nextReward',
            label: 'Next Reward',
            description: 'Description of the next available reward',
            type: 'string',
            category: 'Rewards & Offers',
            examples: ['Free Coffee', '10% Discount', 'Free Shipping']
          },
          {
            key: 'currentOffer',
            label: 'Current Offer',
            description: 'Currently active offer or promotion',
            type: 'string',
            category: 'Rewards & Offers',
            examples: ['Buy 2 Get 1 Free', '20% Off Today', 'Free Gift with Purchase']
          },
          {
            key: 'rewardValue',
            label: 'Reward Value',
            description: 'Monetary value of the reward',
            type: 'currency',
            category: 'Rewards & Offers',
            examples: ['$5.00', '$10.00', '$25.00']
          }
        ]
      },
      {
        name: 'Dates & Time',
        description: 'Date and time related information',
        variables: [
          {
            key: 'expiryDate',
            label: 'Expiry Date',
            description: 'Date when the pass or reward expires',
            type: 'date',
            category: 'Dates & Time',
            examples: ['2024-12-31', '2025-06-30']
          },
          {
            key: 'issueDate',
            label: 'Issue Date',
            description: 'Date when the pass was issued',
            type: 'date',
            category: 'Dates & Time',
            examples: ['2024-01-01', '2024-06-15']
          },
          {
            key: 'lastVisit',
            label: 'Last Visit',
            description: 'Date of the last visit or transaction',
            type: 'date',
            category: 'Dates & Time',
            examples: ['2024-01-15', '2024-02-01']
          }
        ]
      },
      {
        name: 'System Data',
        description: 'System-generated and technical data',
        variables: [
          {
            key: 'passId',
            label: 'Pass ID',
            description: 'Unique identifier for the pass',
            type: 'string',
            required: true,
            category: 'System Data',
            examples: ['PASS-12345', 'CARD-67890']
          },
          {
            key: 'serialNumber',
            label: 'Serial Number',
            description: 'Serial number of the pass',
            type: 'string',
            required: true,
            category: 'System Data',
            examples: ['SN-001', 'SERIAL-12345']
          },
          {
            key: 'version',
            label: 'Version',
            description: 'Version of the pass template',
            type: 'string',
            category: 'System Data',
            examples: ['1.0', '2.1', '3.0']
          }
        ]
      }
    ];
  }

  // Get all variables
  getAllVariables(): Variable[] {
    return this.getVariableCategories().flatMap(category => category.variables);
  }

  // Get variables by category
  getVariablesByCategory(categoryName: string): Variable[] {
    const category = this.getVariableCategories().find(cat => cat.name === categoryName);
    return category ? category.variables : [];
  }

  // Get variable by key
  getVariableByKey(key: string): Variable | null {
    return this.getAllVariables().find(variable => variable.key === key) || null;
  }

  // Search variables
  searchVariables(query: string): Variable[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllVariables().filter(variable =>
      variable.key.toLowerCase().includes(lowercaseQuery) ||
      variable.label.toLowerCase().includes(lowercaseQuery) ||
      variable.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Validate variable value
  validateVariableValue(variable: Variable, value: any): { isValid: boolean; message?: string } {
    if (variable.required && (value === null || value === undefined || value === '')) {
      return {
        isValid: false,
        message: `${variable.label} is required`
      };
    }

    if (value === null || value === undefined || value === '') {
      return { isValid: true };
    }

    if (variable.validation) {
      const { min, max, pattern } = variable.validation;

      if (min !== undefined && typeof value === 'number' && value < min) {
        return {
          isValid: false,
          message: variable.validation.message || `${variable.label} must be at least ${min}`
        };
      }

      if (max !== undefined && typeof value === 'number' && value > max) {
        return {
          isValid: false,
          message: variable.validation.message || `${variable.label} must be at most ${max}`
        };
      }

      if (pattern && typeof value === 'string' && !new RegExp(pattern).test(value)) {
        return {
          isValid: false,
          message: variable.validation.message || `${variable.label} format is invalid`
        };
      }
    }

    return { isValid: true };
  }

  // Format variable value for display
  formatVariableValue(variable: Variable, value: any): string {
    if (value === null || value === undefined) {
      return variable.defaultValue || '';
    }

    switch (variable.type) {
      case 'currency':
        return typeof value === 'number' ? `$${value.toFixed(2)}` : value;
      case 'percentage':
        return typeof value === 'number' ? `${value}%` : value;
      case 'date':
        return value instanceof Date ? value.toLocaleDateString() : value;
      case 'number':
        return typeof value === 'number' ? value.toString() : value;
      default:
        return String(value);
    }
  }

  // Parse variable value from string
  parseVariableValue(variable: Variable, value: string): any {
    if (!value || value === '') {
      return variable.defaultValue || null;
    }

    switch (variable.type) {
      case 'number':
      case 'currency':
        const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
        return isNaN(num) ? variable.defaultValue || 0 : num;
      case 'date':
        const date = new Date(value);
        return isNaN(date.getTime()) ? variable.defaultValue || null : date;
      case 'boolean':
        return value.toLowerCase() === 'true' || value === '1';
      default:
        return value;
    }
  }

  // Get variable suggestions for a given context
  getVariableSuggestions(context: string): Variable[] {
    const lowercaseContext = context.toLowerCase();
    
    if (lowercaseContext.includes('name') || lowercaseContext.includes('customer')) {
      return this.getVariablesByCategory('Customer Information');
    }
    
    if (lowercaseContext.includes('campaign') || lowercaseContext.includes('program')) {
      return this.getVariablesByCategory('Campaign Information');
    }
    
    if (lowercaseContext.includes('stamp') || lowercaseContext.includes('point') || lowercaseContext.includes('loyalty')) {
      return this.getVariablesByCategory('Loyalty Data');
    }
    
    if (lowercaseContext.includes('spend') || lowercaseContext.includes('purchase') || lowercaseContext.includes('transaction')) {
      return this.getVariablesByCategory('Transaction Data');
    }
    
    if (lowercaseContext.includes('reward') || lowercaseContext.includes('offer')) {
      return this.getVariablesByCategory('Rewards & Offers');
    }
    
    if (lowercaseContext.includes('date') || lowercaseContext.includes('time') || lowercaseContext.includes('expire')) {
      return this.getVariablesByCategory('Dates & Time');
    }
    
    return this.getAllVariables();
  }
}

export default VariableService.getInstance();
