import React, { useState } from 'react';
import { useEditor } from '../../hooks/useEditor';
import { ChevronLeft, ChevronRight, Palette, Image, Settings } from 'lucide-react';
import ColorPicker from './ColorPicker';
import ImageUpload from './ImageUpload';

interface PropertiesPanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ collapsed, onToggleCollapse }) => {
  const { state, updateColors, updateImages, updateTemplate } = useEditor();
  const [activeTab, setActiveTab] = useState<'colors' | 'images' | 'settings'>('colors');

  const handleColorChange = (colorType: string, color: string) => {
    updateColors({ [colorType]: color });
  };

  const handleImageChange = (imageType: string, imageData: string) => {
    updateImages({ [imageType]: imageData });
  };

  const handleTemplateTypeChange = (type: 'redemption' | 'points' | 'rewards') => {
    updateTemplate({ type });
  };

  if (collapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4 space-y-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-md"
          title="Expand properties"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="space-y-2">
          <button
            onClick={() => setActiveTab('colors')}
            className={`w-8 h-8 rounded-md flex items-center justify-center ${
              activeTab === 'colors' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Colors"
          >
            <Palette className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`w-8 h-8 rounded-md flex items-center justify-center ${
              activeTab === 'images' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Images"
          >
            <Image className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-8 h-8 rounded-md flex items-center justify-center ${
              activeTab === 'settings' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Properties</h2>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-gray-100 rounded-md"
          title="Collapse properties"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'colors', label: 'Colors', icon: Palette },
          { key: 'images', label: 'Images', icon: Image },
          { key: 'settings', label: 'Settings', icon: Settings }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'colors' && (
          <div className="p-4 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Pass Colors</h3>
              <div className="space-y-4">
                <ColorPicker
                  label="Background Color"
                  color={state.currentTemplate.colors.background}
                  onChange={(color) => handleColorChange('background', color)}
                />
                <ColorPicker
                  label="Text Color"
                  color={state.currentTemplate.colors.foreground}
                  onChange={(color) => handleColorChange('foreground', color)}
                />
                <ColorPicker
                  label="Label Color"
                  color={state.currentTemplate.colors.label}
                  onChange={(color) => handleColorChange('label', color)}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Preset Themes</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Coffee', bg: 'rgb(139, 69, 19)', fg: 'rgb(255, 255, 255)', label: 'rgb(255, 255, 255)' },
                  { name: 'Midnight', bg: 'rgb(25, 25, 112)', fg: 'rgb(255, 255, 255)', label: 'rgb(255, 255, 255)' },
                  { name: 'Forest', bg: 'rgb(34, 139, 34)', fg: 'rgb(255, 255, 255)', label: 'rgb(255, 255, 255)' },
                  { name: 'Sunset', bg: 'rgb(255, 69, 0)', fg: 'rgb(255, 255, 255)', label: 'rgb(255, 255, 255)' }
                ].map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => updateColors({
                      background: theme.bg,
                      foreground: theme.fg,
                      label: theme.label
                    })}
                    className="p-2 text-xs border border-gray-200 rounded hover:bg-gray-50"
                  >
                    <div 
                      className="w-full h-4 rounded mb-1"
                      style={{ backgroundColor: theme.bg }}
                    ></div>
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'images' && (
          <div className="p-4 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Pass Images</h3>
              <div className="space-y-4">
                <ImageUpload
                  label="Logo (29x29px)"
                  imageData={state.currentTemplate.images.logo || null}
                  onChange={(imageData) => handleImageChange('logo', imageData)}
                  required
                />
                <ImageUpload
                  label="Icon (29x29px)"
                  imageData={state.currentTemplate.images.icon || null}
                  onChange={(imageData) => handleImageChange('icon', imageData)}
                  required
                />
                <ImageUpload
                  label="Strip (320x84px)"
                  imageData={state.currentTemplate.images.strip || null}
                  onChange={(imageData) => handleImageChange('strip', imageData)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Pass Type</h3>
              <div className="space-y-2">
                {[
                  { key: 'redemption', label: 'Redemption Card', description: 'Stamp-based loyalty card' },
                  { key: 'points', label: 'Points Card', description: 'Points accumulation system' },
                  { key: 'rewards', label: 'Rewards Card', description: 'Spend-based stamp system' }
                ].map((type) => (
                  <label key={type.key} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="passType"
                      value={type.key}
                      checked={state.currentTemplate.type === type.key}
                      onChange={() => handleTemplateTypeChange(type.key as any)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-sm text-gray-500">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Template Info</h3>
              <div className="space-y-3">
                <div>
                  <label className="form-label">Template Name</label>
                  <input
                    type="text"
                    value={state.currentTemplate.name}
                    onChange={(e) => updateTemplate({ name: e.target.value })}
                    className="form-input"
                    placeholder="Enter template name"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Validation</h3>
              <div className="space-y-2">
                {state.validation.isValid ? (
                  <div className="text-green-600 text-sm flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Template is valid</span>
                  </div>
                ) : (
                  <div className="text-red-600 text-sm">
                    <div className="font-medium mb-1">Validation errors:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {state.validation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
