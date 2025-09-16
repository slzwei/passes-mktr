import React, { useState, useRef, useEffect } from 'react';
import { useEditor } from '../../hooks/useEditor';
import { Field, FieldConfiguration } from '../../types/passTypes';
import VariableInput from './VariableInput';
import { Edit2, Trash2, GripVertical, Check, X } from 'lucide-react';

interface FieldEditorProps {
  fieldType: keyof FieldConfiguration;
  fieldIndex: number;
  field: Field;
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({
  fieldType,
  fieldIndex,
  field,
  isSelected,
  onSelect,
  onDeselect
}) => {
  const { updateField, removeField } = useEditor();
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    label: field.label,
    value: field.value,
    textAlignment: field.textAlignment
  });
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleUpdate = () => {
    updateField(fieldType, fieldIndex, { ...editValues, key: field.key });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValues({
      label: field.label,
      value: field.value,
      textAlignment: field.textAlignment
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      removeField(fieldType, fieldIndex);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUpdate();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const textAlignmentOptions = [
    { value: 'PKTextAlignmentLeft', label: 'Left' },
    { value: 'PKTextAlignmentCenter', label: 'Center' },
    { value: 'PKTextAlignmentRight', label: 'Right' },
    { value: 'PKTextAlignmentNatural', label: 'Natural' }
  ];

  if (isEditing) {
    return (
      <div className="field-editor selected p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-700">Edit Field</h4>
          <div className="flex space-x-1">
            <button
              onClick={handleUpdate}
              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
              title="Save (Enter)"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title="Cancel (Escape)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <label className="form-label">Label</label>
            <input
              ref={inputRef}
              type="text"
              value={editValues.label}
              onChange={(e) => setEditValues({ ...editValues, label: e.target.value })}
              onKeyDown={handleKeyDown}
              className="form-input"
              placeholder="Field label"
            />
          </div>

          <div>
            <label className="form-label">Value</label>
            <VariableInput
              value={editValues.value}
              onChange={(value) => setEditValues({ ...editValues, value })}
              placeholder="Field value (use {{variable}} for dynamic content)"
              context={fieldType}
              showValidation={true}
            />
          </div>

          <div>
            <label className="form-label">Text Alignment</label>
            <select
              value={editValues.textAlignment}
              onChange={(e) => setEditValues({ ...editValues, textAlignment: e.target.value as any })}
              className="form-select"
            >
              {textAlignmentOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`field-editor ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center space-x-2">
        <GripVertical className="w-4 h-4 text-gray-400" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-700 truncate">{field.label}</h4>
            <div className={`flex space-x-1 transition-opacity ${isHovered || isSelected ? 'opacity-100' : 'opacity-0'}`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-1 hover:bg-gray-200 rounded text-gray-600"
                title="Edit field (double-click)"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="p-1 hover:bg-red-100 rounded text-red-600"
                title="Delete field"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 truncate">{field.value}</p>
          <p className="text-xs text-gray-400">
            {field.textAlignment.replace('PKTextAlignment', '')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FieldEditor;
