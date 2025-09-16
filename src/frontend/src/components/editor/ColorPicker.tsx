import React, { useState, useRef, useEffect } from 'react';
import { ChromePicker } from 'react-color';

interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, color, onChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPicker]);

  const handleColorChange = (colorResult: any) => {
    const rgbColor = `rgb(${colorResult.rgb.r}, ${colorResult.rgb.g}, ${colorResult.rgb.b})`;
    onChange(rgbColor);
  };

  const handleInputChange = (value: string) => {
    const rgbRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
    const isValidColor = rgbRegex.test(value);
    setIsValid(isValidColor);
    
    if (isValidColor) {
      onChange(value);
    }
  };

  const parseRgbColor = (rgbString: string) => {
    const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }
    return { r: 255, g: 255, b: 255 };
  };

  return (
    <div className="space-y-2">
      <label className="form-label">{label}</label>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="color-picker"
          style={{ backgroundColor: color }}
          title="Click to change color"
        />
        <input
          type="text"
          value={color}
          onChange={(e) => handleInputChange(e.target.value)}
          className={`form-input flex-1 ${!isValid ? 'border-red-500 focus:border-red-500' : ''}`}
          placeholder="rgb(r, g, b)"
        />
        {!isValid && (
          <span className="text-red-500 text-xs">Invalid format</span>
        )}
      </div>
      
      {showPicker && (
        <div ref={pickerRef} className="absolute z-10 mt-2">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2">
            <ChromePicker
              color={parseRgbColor(color)}
              onChange={handleColorChange}
              disableAlpha
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => setShowPicker(false)}
                className="btn-secondary text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
