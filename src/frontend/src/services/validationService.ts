import { PassTemplate, FieldConfiguration, Field, ValidationResult } from '../types/passTypes';

export class ValidationService {
  private static instance: ValidationService;

  constructor() {}

  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  // Validate entire template
  validateTemplate(template: PassTemplate): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate basic template properties
    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!template.type) {
      errors.push('Template type is required');
    }

    // Validate colors
    this.validateColors(template.colors, errors, warnings);

    // Validate images
    this.validateImages(template.images, errors, warnings);

    // Validate fields
    this.validateFields(template.fields, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate colors
  private validateColors(colors: any, errors: string[], warnings: string[]): void {
    if (!colors) {
      errors.push('Color configuration is required');
      return;
    }

    const requiredColors = ['foreground', 'background', 'label'];
    
    requiredColors.forEach(colorKey => {
      if (!colors[colorKey]) {
        errors.push(`${colorKey} color is required`);
      } else if (!this.isValidColor(colors[colorKey])) {
        errors.push(`${colorKey} color has invalid format`);
      }
    });

    // Check for accessibility
    if (colors.foreground && colors.background) {
      const contrast = this.calculateContrast(colors.foreground, colors.background);
      if (contrast < 4.5) {
        warnings.push('Low contrast between foreground and background colors');
      }
    }
  }

  // Validate images
  private validateImages(images: any, errors: string[], warnings: string[]): void {
    if (!images) {
      errors.push('Image configuration is required');
      return;
    }

    // Logo is required for Apple Wallet passes
    if (!images.logo) {
      errors.push('Logo image is required');
    }

    // Icon is required for Apple Wallet passes
    if (!images.icon) {
      errors.push('Icon image is required');
    }

    // Validate image formats if provided
    Object.entries(images).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        if (!this.isValidImageData(value)) {
          errors.push(`${key} image has invalid format`);
        }
      }
    });
  }

  // Validate fields
  private validateFields(fields: FieldConfiguration, errors: string[], warnings: string[]): void {
    if (!fields) {
      errors.push('Field configuration is required');
      return;
    }

    const fieldTypes = ['header', 'primary', 'secondary', 'auxiliary', 'back'];
    
    fieldTypes.forEach(fieldType => {
      const fieldArray = fields[fieldType as keyof FieldConfiguration];
      
      if (!Array.isArray(fieldArray)) {
        errors.push(`${fieldType} fields must be an array`);
        return;
      }

      // Check field limits
      const limits = {
        header: 2,
        primary: 2,
        secondary: 4,
        auxiliary: 4,
        back: -1 // No limit
      };

      const limit = limits[fieldType as keyof typeof limits];
      if (limit !== -1 && fieldArray.length > limit) {
        errors.push(`${fieldType} fields cannot exceed ${limit} items`);
      }

      // Validate individual fields
      fieldArray.forEach((field, index) => {
        this.validateField(field, `${fieldType}[${index}]`, errors, warnings);
      });
    });

    // Check for required fields
    if (fields.primary.length === 0) {
      warnings.push('No primary fields defined - pass may not display properly');
    }
  }

  // Validate individual field
  private validateField(field: Field, fieldPath: string, errors: string[], warnings: string[]): void {
    if (!field.key || field.key.trim().length === 0) {
      errors.push(`${fieldPath}: Field key is required`);
    }

    if (!field.label || field.label.trim().length === 0) {
      errors.push(`${fieldPath}: Field label is required`);
    }

    if (!field.value || field.value.trim().length === 0) {
      warnings.push(`${fieldPath}: Field value is empty`);
    }

    if (!field.textAlignment) {
      errors.push(`${fieldPath}: Text alignment is required`);
    }

    // Validate text alignment value
    const validAlignments = ['PKTextAlignmentLeft', 'PKTextAlignmentCenter', 'PKTextAlignmentRight', 'PKTextAlignmentNatural'];
    if (field.textAlignment && !validAlignments.includes(field.textAlignment)) {
      errors.push(`${fieldPath}: Invalid text alignment value`);
    }

    // Check for placeholder values
    if (field.value && field.value.includes('{{placeholder}}')) {
      warnings.push(`${fieldPath}: Field contains placeholder value`);
    }
  }

  // Validate color format
  private isValidColor(color: string): boolean {
    const rgbRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    return rgbRegex.test(color) || hexRegex.test(color);
  }

  // Validate image data format
  private isValidImageData(data: string): boolean {
    // Check if it's a valid base64 data URL
    const dataUrlRegex = /^data:image\/(png|jpeg|jpg|gif);base64,/;
    return dataUrlRegex.test(data);
  }

  // Calculate color contrast ratio
  private calculateContrast(color1: string, color2: string): number {
    const rgb1 = this.parseColor(color1);
    const rgb2 = this.parseColor(color2);
    
    if (!rgb1 || !rgb2) return 0;

    const lum1 = this.getLuminance(rgb1);
    const lum2 = this.getLuminance(rgb2);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  // Parse color string to RGB values
  private parseColor(color: string): { r: number; g: number; b: number } | null {
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3])
      };
    }
    
    const hexMatch = color.match(/#([0-9A-Fa-f]{6})/);
    if (hexMatch) {
      return {
        r: parseInt(hexMatch[1].substr(0, 2), 16),
        g: parseInt(hexMatch[1].substr(2, 2), 16),
        b: parseInt(hexMatch[1].substr(4, 2), 16)
      };
    }
    
    return null;
  }

  // Calculate relative luminance
  private getLuminance(rgb: { r: number; g: number; b: number }): number {
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Validate pass data
  validatePassData(passData: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!passData.campaignId) {
      errors.push('Campaign ID is required');
    }

    if (!passData.campaignName) {
      errors.push('Campaign name is required');
    }

    if (!passData.tenantName) {
      errors.push('Tenant name is required');
    }

    if (!passData.customerEmail) {
      errors.push('Customer email is required');
    } else if (!this.isValidEmail(passData.customerEmail)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate email format
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default ValidationService.getInstance();
