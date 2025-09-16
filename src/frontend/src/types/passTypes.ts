/**
 * TypeScript definitions for Apple Wallet Pass Editor
 * Based on Apple PassKit documentation and existing codebase
 */

export interface PassTemplate {
  id: string;
  name: string;
  type: 'redemption' | 'points' | 'rewards';
  fields: FieldConfiguration;
  colors: ColorConfiguration;
  images: ImageConfiguration;
  description?: string;
}

export interface FieldConfiguration {
  header: Field[];
  primary: Field[];
  secondary: Field[];
  auxiliary: Field[];
  back: Field[];
}

export interface Field {
  key: string;
  label: string;
  value: string;
  textAlignment: 'PKTextAlignmentLeft' | 'PKTextAlignmentCenter' | 'PKTextAlignmentRight' | 'PKTextAlignmentNatural';
}

export interface ColorConfiguration {
  foreground: string; // RGB format: 'rgb(r, g, b)'
  background: string;
  label: string;
}

export interface ImageConfiguration {
  logo?: string | null; // Base64 or URL
  icon?: string | null;
  strip?: string | null;
}

export interface PassData {
  campaignId: string;
  campaignName: string;
  tenantName: string;
  customerEmail: string;
  customerName?: string;
  stampsEarned?: number;
  stampsRequired?: number;
  pointsEarned?: number;
  spendAmount?: number;
  nextReward?: string;
  membershipTier?: string;
  expiryDate?: string;
}

export interface PassPreview {
  passJson: any; // Apple PassKit pass.json structure
  images: Record<string, string>; // Base64 encoded images
  config: PassTemplate;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EditorState {
  currentTemplate: PassTemplate;
  previewData: PassPreview | null;
  validation: ValidationResult;
  isDirty: boolean;
  isLoading: boolean;
  selectedFieldType: keyof FieldConfiguration | null;
  selectedFieldIndex: number | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StampConfiguration {
  type: 'star' | 'coffee' | 'heart' | 'custom';
  earnedColor: string;
  unearnedColor: string;
  size: number;
  borderWidth: number;
}

// Apple PassKit specific types
export type PassType = 'storeCard' | 'generic' | 'coupon' | 'eventTicket' | 'boardingPass';

export interface ApplePassKitField {
  key: string;
  label: string;
  value: string;
  textAlignment?: 'PKTextAlignmentLeft' | 'PKTextAlignmentCenter' | 'PKTextAlignmentRight' | 'PKTextAlignmentNatural';
  changeMessage?: string;
  attributedValue?: {
    value: string;
    attributes: any[];
  };
}

export interface ApplePassKitBarcode {
  message: string;
  format: 'PKBarcodeFormatQR' | 'PKBarcodeFormatPDF417' | 'PKBarcodeFormatAztec' | 'PKBarcodeFormatCode128';
  messageEncoding: 'iso-8859-1' | 'utf-8';
  altText?: string;
}

// Editor UI types
export interface EditorLayout {
  sidebar: boolean;
  preview: boolean;
  properties: boolean;
}

export interface FieldEditorProps {
  fieldType: keyof FieldConfiguration;
  fieldIndex: number;
  field: Field;
  onUpdate: (field: Field) => void;
  onDelete: () => void;
}

export interface PreviewPaneProps {
  previewData: PassPreview | null;
  isLoading: boolean;
  deviceType: 'iphone' | 'apple-watch';
}

export interface PropertiesPanelProps {
  template: PassTemplate;
  onUpdate: (template: PassTemplate) => void;
  validation: ValidationResult;
}
