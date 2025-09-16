/**
 * Shared TypeScript definitions between frontend and backend
 * Used for API communication and data consistency
 */

export interface PassConfigRequest {
  config: PassTemplate;
  passData: PassData;
}

export interface PassConfigResponse {
  success: boolean;
  config?: PassTemplate;
  preview?: PassPreview;
  validation?: ValidationResult;
  error?: string;
}

export interface PreviewRequest {
  config: PassTemplate;
  passData: PassData;
}

export interface PreviewResponse {
  success: boolean;
  preview?: PassPreview;
  error?: string;
}

export interface ValidationRequest {
  config: PassTemplate;
}

export interface ValidationResponse {
  success: boolean;
  validation: ValidationResult;
  error?: string;
}

export interface TemplateRequest {
  passData: PassData;
  templateType?: 'redemption' | 'points' | 'rewards';
}

export interface TemplateResponse {
  success: boolean;
  templates?: PassTemplate[];
  defaultConfig?: PassTemplate;
  error?: string;
}

// Re-export types from frontend
export type {
  PassTemplate,
  FieldConfiguration,
  Field,
  ColorConfiguration,
  ImageConfiguration,
  PassData,
  PassPreview,
  EditorState,
  ValidationResult,
  StampConfiguration,
  PassType,
  ApplePassKitField,
  ApplePassKitBarcode
} from '../frontend/src/types/passTypes';
