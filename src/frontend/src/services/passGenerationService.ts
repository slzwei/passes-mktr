import { PassTemplate, PassData, PassPreview, FieldConfiguration, Field } from '../types/passTypes';

export class PassGenerationService {
  private static instance: PassGenerationService;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  }

  static getInstance(): PassGenerationService {
    if (!PassGenerationService.instance) {
      PassGenerationService.instance = new PassGenerationService();
    }
    return PassGenerationService.instance;
  }

  async generatePass(template: PassTemplate, passData: PassData): Promise<PassPreview> {
    try {
      const response = await fetch(`${this.baseUrl}/api/passes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ template, passData }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate pass: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error generating pass:', error);
      throw error;
    }
  }

  async validateTemplate(template: PassTemplate): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/passes/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ template }),
      });

      if (!response.ok) {
        throw new Error(`Failed to validate template: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error validating template:', error);
      return {
        isValid: false,
        errors: ['Failed to validate template'],
        warnings: []
      };
    }
  }

  async saveTemplate(template: PassTemplate): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/templates/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ template }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save template: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving template:', error);
      return {
        success: false,
        error: 'Failed to save template'
      };
    }
  }

  async loadTemplate(templateId: string): Promise<PassTemplate | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/templates/${templateId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.statusText}`);
      }

      const result = await response.json();
      return result.template;
    } catch (error) {
      console.error('Error loading template:', error);
      return null;
    }
  }

  async listTemplates(): Promise<PassTemplate[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/templates`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list templates: ${response.statusText}`);
      }

      const result = await response.json();
      return result.templates || [];
    } catch (error) {
      console.error('Error listing templates:', error);
      return [];
    }
  }

  // Helper method to convert template fields to Apple PassKit format
  convertFieldsToPassKit(fields: FieldConfiguration): any {
    const passKitFields: any = {};

    Object.entries(fields).forEach(([fieldType, fieldArray]) => {
      if (fieldArray.length > 0) {
        passKitFields[`${fieldType}Fields`] = fieldArray.map((field: Field) => ({
          key: field.key,
          label: field.label,
          value: field.value,
          textAlignment: field.textAlignment
        }));
      }
    });

    return passKitFields;
  }

  // Helper method to create a basic pass.json structure
  createPassJson(template: PassTemplate, passData: PassData): any {
    const passKitFields = this.convertFieldsToPassKit(template.fields);
    
    return {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.mktr.passes",
      serialNumber: passData.campaignId,
      teamIdentifier: "MKTR123456",
      organizationName: passData.tenantName,
      description: template.name,
      logoText: passData.campaignName,
      backgroundColor: template.colors.background,
      foregroundColor: template.colors.foreground,
      labelColor: template.colors.label,
      storeCard: {
        ...passKitFields,
        primaryFields: passKitFields.primaryFields || [],
        secondaryFields: passKitFields.secondaryFields || [],
        auxiliaryFields: passKitFields.auxiliaryFields || [],
        headerFields: passKitFields.headerFields || [],
        backFields: passKitFields.backFields || []
      },
      barcode: {
        message: passData.campaignId,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1"
      }
    };
  }
}

export default PassGenerationService.getInstance();
