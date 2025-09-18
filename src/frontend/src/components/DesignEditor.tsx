import React, { useState, useCallback } from 'react';
import { PassDesign, CardType } from '../types';
import { Palette, Type, Grid, ChevronDown, ChevronUp, Star, Target, CreditCard, Upload } from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';

interface DesignEditorProps {
  design: PassDesign;
  onDesignChange: (design: PassDesign) => void;
}

// Helper to create stable, accessible ids from labels
function labelToId(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
  idBase?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, description, idBase }) => {
  const base = idBase || labelToId(label);
  const colorId = `${base}-color`;
  const textId = `${base}-text`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={textId} className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-xs text-gray-500">{value}</span>
      </div>
      <div className="flex items-center space-x-3">
        <input
          id={colorId}
          name={colorId}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-colors"
          aria-label={`${label} color`}
        />
        <input
          id={textId}
          name={textId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="#000000"
          aria-label={`${label} value`}
        />
      </div>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
};

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  id?: string;
  disabled?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({ label, value, onChange, placeholder, maxLength, id, disabled }) => {
  const inputId = id || labelToId(label);
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">{label}</label>
      <input
        id={inputId}
        name={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
        }`}
      />
    </div>
  );
};

interface DragDropUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  children: React.ReactNode;
  className?: string;
  isDragActive?: boolean;
}

const DragDropUpload: React.FC<DragDropUploadProps> = ({ 
  onFileSelect, 
  accept = "image/*", 
  children, 
  className = "",
  isDragActive = false
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  }, [onFileSelect]);

  return (
    <div
      className={`relative ${className} ${dragActive ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {children}
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  );
};


interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon, isExpanded, onToggle }) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
    aria-expanded={isExpanded}
  >
    <div className="flex items-center space-x-2">
      {icon}
      <span className="font-medium text-gray-900">{title}</span>
    </div>
    {isExpanded ? (
      <ChevronUp className="w-4 h-4 text-gray-500" />
    ) : (
      <ChevronDown className="w-4 h-4 text-gray-500" />
    )}
  </button>
);

const DesignEditor: React.FC<DesignEditorProps> = ({ design, onDesignChange }) => {
  const [expandedSections, setExpandedSections] = useState({
    colors: false,
    content: false,
    stamps: false,
    images: false,
  });

  const updateDesign = (updates: Partial<PassDesign>) => {
    onDesignChange({ ...design, ...updates });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => {
      const newState = {
        colors: false,
        content: false,
        stamps: false,
        images: false,
      };
      
      // If the clicked section was closed, open it; otherwise close it
      if (!prev[section]) {
        newState[section] = true;
      }
      
      return newState;
    });
  };

  const getCardTypeIcon = (cardType: CardType) => {
    switch (cardType) {
      case 'redemption':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'points':
        return <Star className="w-4 h-4 text-yellow-600" />;
      case 'milestone':
        return <Target className="w-4 h-4 text-purple-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-blue-600" />;
    }
  };

  const getCardTypeName = (cardType: CardType) => {
    switch (cardType) {
      case 'redemption':
        return 'Redemption Card';
      case 'points':
        return 'Points Card';
      case 'milestone':
        return 'Milestone Card';
      default:
        return 'Redemption Card';
    }
  };
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Design Editor</h2>
        <p className="text-sm text-gray-600">Customize your Apple Wallet pass</p>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Colors Section */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <SectionHeader
              title="Colors"
              icon={<Palette className="w-4 h-4 text-blue-600" />}
              isExpanded={expandedSections.colors}
              onToggle={() => toggleSection('colors')}
            />
            <div 
              className={`transition-all duration-200 ease-out ${
                expandedSections.colors ? 'max-h-[70vh] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'
              }`}
            >
              <div className="p-4 space-y-4 bg-gray-50">
                <ColorPicker
                  label="Background Color"
                  value={design.backgroundColor}
                  onChange={(color) => updateDesign({ backgroundColor: color })}
                  description="Main pass background color"
                  idBase="background-color"
                />
                <ColorPicker
                  label="Text Color"
                  value={design.foregroundColor}
                  onChange={(color) => updateDesign({ foregroundColor: color })}
                  description="Primary text color"
                  idBase="text-color"
                />
                <ColorPicker
                  label="Label Color"
                  value={design.labelColor}
                  onChange={(color) => updateDesign({ labelColor: color })}
                  description="Field label color"
                  idBase="label-color"
                />
                <ColorPicker
                  label="Strip Background"
                  value={design.stripBackgroundColor}
                  onChange={(color) => updateDesign({ stripBackgroundColor: color })}
                  description="Stamp area background"
                  idBase="strip-background"
                />
                
                {/* Stamp Colors - Only for Redemption and Milestone Cards */}
                {(design.cardType === 'redemption' || design.cardType === 'milestone') && (
                  <>
                    <div className="pt-4 border-t border-gray-300">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Stamp Colors</h5>
                    </div>
                    <ColorPicker
                      label="Unredeemed Color"
                      value={design.stampUnredeemedColor || '#e5e7eb'}
                      onChange={(color) => updateDesign({ stampUnredeemedColor: color })}
                      description="Color for unredeemed stamps"
                      idBase="stamp-unredeemed"
                    />
                    <ColorPicker
                      label="Earned Color"
                      value={design.stampEarnedColor || design.backgroundColor}
                      onChange={(color) => updateDesign({ stampEarnedColor: color })}
                      description="Color for earned stamps"
                      idBase="stamp-earned"
                    />
                    {design.cardType === 'milestone' && (
                      <>
                        <ColorPicker
                          label="Milestone Color"
                          value={design.stampMilestoneColor || design.backgroundColor}
                          onChange={(color) => updateDesign({ stampMilestoneColor: color })}
                          description="Color for milestone stamps"
                          idBase="stamp-milestone"
                        />
                        <ColorPicker
                          label="Milestone Circle Color"
                          value={design.stampMilestoneCircleColor || design.backgroundColor}
                          onChange={(color) => updateDesign({ stampMilestoneCircleColor: color })}
                          description="Background color for milestone stamp circles"
                          idBase="stamp-milestone-circle"
                        />
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <SectionHeader
              title="Content"
              icon={<Type className="w-4 h-4 text-green-600" />}
              isExpanded={expandedSections.content}
              onToggle={() => toggleSection('content')}
            />
            <div 
              className={`transition-all duration-200 ease-out ${
                expandedSections.content ? 'max-h-[70vh] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'
              }`}
            >
              <div className="p-4 space-y-4 bg-gray-50">
                {/* Logo Text */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="logo-text" className="text-sm font-medium text-gray-700">
                      Logo Text
                    </label>
                    {design.hideLogoText && (
                      <span className="text-xs text-orange-600 font-medium">
                        Hidden (wide logo)
                      </span>
                    )}
                  </div>
                  <input
                    id="logo-text"
                    name="logo-text"
                    type="text"
                    value={design.logoText}
                    onChange={(e) => updateDesign({ logoText: e.target.value })}
                    placeholder="COFFEE REWARDS"
                    maxLength={20}
                    disabled={design.hideLogoText}
                    className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      design.hideLogoText ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
                    }`}
                  />
                  {design.hideLogoText && (
                    <p className="text-xs text-orange-600">
                      Logo text is hidden when using wide format logos
                    </p>
                  )}
                </div>

                {/* Card Type Display */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">Card Type</h4>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getCardTypeIcon(design.cardType)}
                      <span className="text-sm font-medium text-blue-800">Card Type:</span>
                      <span className="text-sm text-blue-700">{getCardTypeName(design.cardType)}</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      {design.cardType === 'redemption' && 'This template is designed for redemption cards with stamp tracking'}
                      {design.cardType === 'points' && 'This template is designed for points-based loyalty programs'}
                      {design.cardType === 'milestone' && 'This template is designed for milestone-based achievement systems'}
                    </p>
                  </div>
                </div>

                {/* Barcode */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">Barcode</h4>
                  <div className="space-y-2">
                    <label htmlFor="qr-alt-text" className="text-sm font-medium text-gray-700">QR Code Alt Text</label>
                    <input
                      id="qr-alt-text"
                      name="qr-alt-text"
                      type="text"
                      value={design.qrAltText || ''}
                      onChange={(e) => updateDesign({ qrAltText: e.target.value })}
                      placeholder="Loyalty Card QR Code"
                      maxLength={60}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-gray-500">Used in pass.json as the barcode altText (Apple supports this field).</p>
                  </div>
                </div>

                {/* Card Type Specific Fields */}
                {design.cardType === 'redemption' && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">Redemption Fields</h4>
                    
                    {/* Expiry Date Section */}
                    <div className="p-3 bg-white rounded-lg border border-gray-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Expiry Date</span>
                        <label className="inline-flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={design.hasExpiryDate || false}
                            onChange={(e) => updateDesign({ hasExpiryDate: e.target.checked })}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-sm text-gray-700">Has Expiry</span>
                        </label>
                      </div>
                      
                      {design.hasExpiryDate && (
                        <div className="space-y-2">
                          <label htmlFor="expiry-date" className="text-sm font-medium text-gray-700">
                            Expiration Date
                          </label>
                          <input
                            id="expiry-date"
                            name="expiry-date"
                            type="date"
                            value={design.expirationDate || ''}
                            onChange={(e) => updateDesign({ expirationDate: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                          <p className="text-xs text-gray-500">
                            Will be displayed in DD/MM/YYYY format on the pass
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card Holder Field */}
                    {design.secondaryFields.filter((field, index) => index === 0).map((field, index) => (
                      <div key={index} className="p-3 bg-white rounded-lg border border-gray-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">{field.label}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Fixed Label</span>
                        </div>
                        <div className="space-y-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Label</label>
                            <div className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed">
                              {field.label}
                            </div>
                          </div>
                          <TextInput
                            label="Value"
                            value={field.value}
                            onChange={(value) => {
                              const newFields = [...design.secondaryFields];
                              newFields[index] = { ...field, value: value };
                              updateDesign({ secondaryFields: newFields });
                            }}
                            maxLength={25}
                            id={`secondary-value-${index}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {design.cardType === 'points' && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">Points Fields</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <TextInput
                        label="Points Balance"
                        value={design.pointsBalance.toString()}
                        onChange={(value) => updateDesign({ pointsBalance: parseInt(value) || 0 })}
                        placeholder="1250"
                        id="points-balance"
                      />
                      <TextInput
                        label="Points Required"
                        value={design.pointsRequired.toString()}
                        onChange={(value) => updateDesign({ pointsRequired: parseInt(value) || 0 })}
                        placeholder="2000"
                        id="points-required"
                      />
                      <TextInput
                        label="Points Per Transaction"
                        value={design.pointsPerTransaction.toString()}
                        onChange={(value) => updateDesign({ pointsPerTransaction: parseInt(value) || 0 })}
                        placeholder="50"
                        id="points-per-transaction"
                      />
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">
                          {design.pointsBalance} / {design.pointsRequired} points
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((design.pointsBalance / design.pointsRequired) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}


              </div>
            </div>
          </div>

          {/* Stamps Section - For Redemption and Milestone Cards */}
          {(design.cardType === 'redemption' || design.cardType === 'milestone') && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <SectionHeader
                title="Stamps"
                icon={<Grid className="w-4 h-4 text-purple-600" />}
                isExpanded={expandedSections.stamps}
                onToggle={() => toggleSection('stamps')}
              />
              <div 
                className={`transition-all duration-200 ease-out ${
                  expandedSections.stamps ? 'max-h-[70vh] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'
                }`}
              >
                <div className="p-4 space-y-4 bg-gray-50">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-blue-700">
                      <strong>Note:</strong> This area is just to help you visualize how the final design will look like.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Total Stamps</label>
                      <select
                        value={design.totalStamps}
                        onChange={(e) => {
                          const newTotal = parseInt(e.target.value);
                          updateDesign({ 
                            totalStamps: newTotal,
                            stampsEarned: Math.min(design.stampsEarned, newTotal)
                          });
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        {Array.from({ length: 30 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1} stamps
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500">Total number of stamps needed</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        {design.cardType === 'redemption' ? 'Stamps Redeemed' : 'Stamps Earned'}
                      </label>
                      <select
                        value={design.stampsEarned}
                        onChange={(e) => updateDesign({ 
                          stampsEarned: parseInt(e.target.value) 
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        {Array.from({ length: design.totalStamps + 1 }, (_, i) => (
                          <option key={i} value={i}>
                            {i} stamps
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500">Cannot exceed total stamps</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">
                        {design.stampsEarned} / {design.totalStamps} {design.cardType === 'redemption' ? 'redeemed' : 'earned'}
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(design.stampsEarned / design.totalStamps) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Images Section */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <SectionHeader
              title="Images"
              icon={<ImageIcon className="w-4 h-4 text-pink-600" />}
              isExpanded={expandedSections.images}
              onToggle={() => toggleSection('images')}
            />
            <div 
              className={`transition-all duration-200 ease-out ${
                expandedSections.images ? 'max-h-[70vh] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'
              }`}
            >
              <div className="p-4 space-y-6 bg-gray-50">
                {/* Logo Image Upload */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Logo</h4>
                      <p className="text-xs text-gray-500">Top-left corner of the pass</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <DragDropUpload
                        onFileSelect={(file) => {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const logoImage = String(ev.target?.result || '');
                            
                            // Create an image to get dimensions
                            const img = new Image();
                            img.onload = () => {
                              const aspectRatio = img.width / img.height;
                              const format = aspectRatio > 1.5 ? 'wide' : 'square';
                              const hideLogoText = format === 'wide';
                              
                              updateDesign({ 
                                logoImage,
                                logoFormat: format,
                                hideLogoText
                              });
                            };
                            img.src = logoImage;
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="w-full h-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group hover:border-blue-400 transition-colors"
                      >
                        {design.logoImage ? (
                          <img 
                            src={design.logoImage} 
                            alt="Logo preview" 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-center">
                            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">Drop or click to upload</p>
                          </div>
                        )}
                      </DragDropUpload>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs text-gray-600 space-y-1">
                        <p><strong>Square (1:1):</strong> 50×50px with text</p>
                        <p><strong>Wide (&gt;1.5:1):</strong> 160×50px, text hidden</p>
                      </div>
                      {design.logoImage && (
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          design.logoFormat === 'wide' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {design.logoFormat === 'wide' 
                            ? `📏 Wide format` 
                            : `⬜ Square format`
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Strip Background Upload */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Grid className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Strip Background</h4>
                      <p className="text-xs text-gray-500">Custom background for the strip area</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <DragDropUpload
                        onFileSelect={(file) => {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const stripBackgroundImage = String(ev.target?.result || '');
                            updateDesign({ stripBackgroundImage });
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="w-full h-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group hover:border-purple-400 transition-colors"
                      >
                        {design.stripBackgroundImage ? (
                          <img 
                            src={design.stripBackgroundImage} 
                            alt="Strip background preview" 
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="text-center">
                            <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">Drop or click to upload</p>
                          </div>
                        )}
                      </DragDropUpload>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs text-gray-600 space-y-1">
                        <p><strong>Recommended:</strong> 320×84px</p>
                        <p><strong>Formats:</strong> PNG, JPG</p>
                        <p><strong>Auto-resize:</strong> 1x, 2x, 3x</p>
                      </div>
                      {design.stripBackgroundImage && (
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          🎨 Custom background
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Strip Background Opacity Slider */}
                  {design.stripBackgroundImage && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label htmlFor="strip-opacity" className="text-sm font-medium text-gray-700">
                          Background Opacity
                        </label>
                        <span className="text-xs text-gray-500">
                          {Math.round((design.stripBackgroundOpacity || 0.8) * 100)}%
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          id="strip-opacity"
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={design.stripBackgroundOpacity || 0.8}
                          onChange={(e) => updateDesign({ stripBackgroundOpacity: parseFloat(e.target.value) })}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${(design.stripBackgroundOpacity || 0.8) * 100}%, #E5E7EB ${(design.stripBackgroundOpacity || 0.8) * 100}%, #E5E7EB 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stamp Icons - For Redemption and Milestone Cards */}
                {(design.cardType === 'redemption' || design.cardType === 'milestone') && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Star className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Stamp Icons</h4>
                      <p className="text-xs text-gray-500">
                        {design.cardType === 'redemption' ? 'Icons for earned and redeemed stamps' : 'Icons for earned and milestone stamps'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Unredeemed Icon */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Unredeemed Icon</label>
                      <div className="flex items-center space-x-3">
                        <DragDropUpload
                          onFileSelect={(file) => {
                            const reader = new FileReader();
                            reader.onload = (ev) => updateDesign({ stampIconUnredeemed: String(ev.target?.result || '') });
                            reader.readAsDataURL(file);
                          }}
                          className="w-16 h-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group hover:border-orange-400 transition-colors"
                        >
                          {design.stampIconUnredeemed ? (
                            <img 
                              src={design.stampIconUnredeemed} 
                              alt="Unredeemed icon" 
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-center">
                              <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                              <p className="text-xs text-gray-500">Drop or click</p>
                            </div>
                          )}
                        </DragDropUpload>
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 mb-2">Shows when stamp is not yet earned</p>
                          <p className="text-xs text-gray-500">Recommended: 32×32px PNG with transparency</p>
                        </div>
                      </div>
                    </div>

                    {/* Use Same Icon Toggle */}
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={!!design.useSameStampIcon}
                        onChange={(e) => updateDesign({ useSameStampIcon: e.target.checked })}
                        className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <div>
                        <label className="text-sm font-medium text-gray-700 cursor-pointer">
                          {design.cardType === 'redemption' ? 'Use Same Icon for Redeemed' : 'Use Same Icon for Earned'}
                        </label>
                        <p className="text-xs text-gray-500">Check to use the same icon for both states</p>
                      </div>
                    </div>

                    {/* Redeemed/Earned Icon (hidden when using same) */}
                    {!design.useSameStampIcon && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          {design.cardType === 'redemption' ? 'Redeemed Icon' : 'Earned Icon'}
                        </label>
                        <div className="flex items-center space-x-3">
                          <DragDropUpload
                            onFileSelect={(file) => {
                              const reader = new FileReader();
                              reader.onload = (ev) => updateDesign({ stampIconRedeemed: String(ev.target?.result || '') });
                              reader.readAsDataURL(file);
                            }}
                            className="w-16 h-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group hover:border-green-400 transition-colors"
                          >
                            {design.stampIconRedeemed ? (
                              <img 
                                src={design.stampIconRedeemed} 
                                alt="Redeemed icon" 
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="text-center">
                                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-500">Drop or click</p>
                              </div>
                            )}
                          </DragDropUpload>
                          <div className="flex-1">
                            <p className="text-xs text-gray-600 mb-2">
                              {design.cardType === 'redemption' ? 'Shows when stamp is earned/redeemed' : 'Shows when stamp is earned'}
                            </p>
                            <p className="text-xs text-gray-500">Recommended: 32×32px PNG with transparency</p>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
                )}
              </div>
            </div>
          </div>


          {/* Milestone Card Section - Only for Milestone Cards */}
          {design.cardType === 'milestone' && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <SectionHeader
                title="Milestones"
                icon={<Star className="w-4 h-4 text-yellow-600" />}
                isExpanded={expandedSections.stamps} // Reusing 'stamps' expansion state for now
                onToggle={() => toggleSection('stamps')}
              />
              <div 
                className={`transition-all duration-200 ease-out ${
                  expandedSections.stamps ? 'max-h-[70vh] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'
                }`}
              >
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Number of Milestones</label>
                    <select
                      value={design.numberOfMilestones || 2}
                      onChange={(e) => {
                        const newCount = parseInt(e.target.value) || 2;
                        const newPositions = Array.from({ length: newCount }, (_, i) => {
                          // Try to preserve existing positions, or set defaults
                          if (i < (design.milestonePositions?.length || 0)) {
                            return design.milestonePositions[i];
                          }
                          // Default positions: 3rd, 6th, 9th, 12th stamps, etc.
                          return Math.min(3 + (i * 3), design.totalStamps);
                        });
                        updateDesign({ 
                          numberOfMilestones: newCount,
                          milestonePositions: newPositions
                        });
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    >
                      {Array.from({ length: Math.min(design.totalStamps - 1, 5) }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num} milestone{num !== 1 ? 's' : ''}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">Choose how many milestones to set</p>
                  </div>

                  {/* Dynamic Milestone Position Inputs */}
                  {Array.from({ length: design.numberOfMilestones || 2 }, (_, index) => (
                    <div key={index} className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Milestone {index + 1} Position
                      </label>
                      <select
                        value={design.milestonePositions?.[index] || 2}
                        onChange={(e) => {
                          const newPosition = parseInt(e.target.value) || 2;
                          const newPositions = [...(design.milestonePositions || [])];
                          newPositions[index] = newPosition;
                          updateDesign({ milestonePositions: newPositions });
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                      >
                        {Array.from({ length: design.totalStamps - 1 }, (_, i) => i + 2)
                          .filter(position => {
                            // Allow current selection or positions not used by other milestones
                            const currentPosition = design.milestonePositions?.[index] || 2;
                            return position === currentPosition || !design.milestonePositions?.includes(position);
                          })
                          .map(position => (
                            <option key={position} value={position}>
                              Stamp {position}
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-gray-500">
                        {(() => {
                          const availablePositions = Array.from({ length: design.totalStamps - 1 }, (_, i) => i + 2)
                            .filter(position => {
                              const currentPosition = design.milestonePositions?.[index] || 2;
                              return position === currentPosition || !design.milestonePositions?.includes(position);
                            });
                          
                          if (availablePositions.length === 1) {
                            return "Only one position available";
                          } else if (availablePositions.length < 5) {
                            return `Limited positions available (${availablePositions.length} left)`;
                          } else {
                            return "Stamp position (2 to " + design.totalStamps + ")";
                          }
                        })()}
                      </p>
                    </div>
                  ))}

                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center text-sm">
                      <span className="text-yellow-600">💡</span>
                      <span className="text-yellow-700 ml-2">
                        Milestone stamps will be highlighted with a special border. Each milestone must have a unique position.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DesignEditor;