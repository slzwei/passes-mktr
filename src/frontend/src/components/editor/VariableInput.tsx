import React, { useState, useRef, useEffect } from 'react';
import { Code, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Variable } from '../../services/variableService';
import variableService from '../../services/variableService';
import VariablePicker from './VariablePicker';

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  context?: string;
  showValidation?: boolean;
}

const VariableInput: React.FC<VariableInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter text or use variables...',
  className = '',
  disabled = false,
  context = '',
  showValidation = true
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
  const [validation, setValidation] = useState<{ isValid: boolean; message?: string }>({ isValid: true });
  const [detectedVariables, setDetectedVariables] = useState<Variable[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect variables in the current value
  useEffect(() => {
    const variablePattern = /\{\{(\w+)\}\}/g;
    const matches = value.match(variablePattern);
    
    if (matches) {
      const variables = matches
        .map(match => match.replace(/\{\{|\}\}/g, ''))
        .map(key => variableService.getVariableByKey(key))
        .filter((variable): variable is Variable => variable !== null);
      
      setDetectedVariables(variables);
    } else {
      setDetectedVariables([]);
    }
  }, [value]);

  // Validate the input
  useEffect(() => {
    if (!showValidation) return;

    const variablePattern = /\{\{(\w+)\}\}/g;
    const matches = value.match(variablePattern);
    
    if (matches) {
      let isValid = true;
      let message = '';
      
      for (const match of matches) {
        const key = match.replace(/\{\{|\}\}/g, '');
        const variable = variableService.getVariableByKey(key);
        
        if (!variable) {
          isValid = false;
          message = `Unknown variable: ${key}`;
          break;
        }
      }
      
      setValidation({ isValid, message });
    } else {
      setValidation({ isValid: true });
    }
  }, [value, showValidation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '{' && e.ctrlKey) {
      e.preventDefault();
      showVariablePicker();
    }
  };

  const showVariablePicker = () => {
    if (disabled) return;
    
    const rect = inputRef.current?.getBoundingClientRect();
    if (rect) {
      setPickerPosition({
        x: rect.left,
        y: rect.bottom
      });
      setShowPicker(true);
    }
  };

  const handleVariableSelect = (variable: Variable) => {
    const cursorPosition = inputRef.current?.selectionStart || 0;
    const beforeCursor = value.substring(0, cursorPosition);
    const afterCursor = value.substring(inputRef.current?.selectionEnd || 0);
    
    const newValue = beforeCursor + `{{${variable.key}}}` + afterCursor;
    onChange(newValue);
    
    // Focus back to input and position cursor after the inserted variable
    setTimeout(() => {
      if (inputRef.current) {
        const newPosition = cursorPosition + variable.key.length + 4; // +4 for {{}}
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const handleRemoveVariable = (variableKey: string) => {
    const newValue = value.replace(new RegExp(`\\{\\{${variableKey}\\}\\}`, 'g'), '');
    onChange(newValue);
  };


  return (
    <div ref={containerRef} className="relative">
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 pr-20 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            validation.isValid ? 'border-gray-300' : 'border-red-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
        />
        
        {/* Action Buttons */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {validation.isValid ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
          
          <button
            onClick={showVariablePicker}
            disabled={disabled}
            className="p-1 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Insert variable (Ctrl+{)"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Detected Variables */}
      {detectedVariables.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {detectedVariables.map((variable) => (
            <div
              key={variable.key}
              className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
            >
              <span>{`{{${variable.key}}}`}</span>
              <button
                onClick={() => handleRemoveVariable(variable.key)}
                disabled={disabled}
                className="hover:bg-blue-200 rounded p-0.5 disabled:opacity-50"
                title={`Remove ${variable.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Validation Message */}
      {!validation.isValid && validation.message && (
        <div className="mt-1 flex items-center space-x-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          <span>{validation.message}</span>
        </div>
      )}

      {/* Variable Picker */}
      <VariablePicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelectVariable={handleVariableSelect}
        position={pickerPosition}
        context={context}
      />
    </div>
  );
};

export default VariableInput;
