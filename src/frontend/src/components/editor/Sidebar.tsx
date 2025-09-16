import React from 'react';
import { useEditor } from '../../hooks/useEditor';
import FieldEditor from './FieldEditor';
import { ChevronLeft, ChevronRight, Plus, Settings } from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { state, addField, setSelectedField, clearSelection } = useEditor();

  const fieldTypes = [
    { key: 'header', label: 'Header Fields', max: 2 },
    { key: 'primary', label: 'Primary Fields', max: 2 },
    { key: 'secondary', label: 'Secondary Fields', max: 4 },
    { key: 'auxiliary', label: 'Auxiliary Fields', max: 4 },
    { key: 'back', label: 'Back Fields', max: -1 }
  ] as const;

  const canAddField = (fieldType: string, currentCount: number, max: number) => {
    return max === -1 || currentCount < max;
  };

  const handleAddField = (fieldType: string) => {
    const newField = {
      key: `${fieldType}_${Date.now()}`,
      label: 'New Field',
      value: '{{placeholder}}',
      textAlignment: 'PKTextAlignmentLeft' as const
    };
    
    addField(fieldType as any, newField);
  };

  if (collapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4 space-y-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-md"
          title="Expand sidebar"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        
        <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
          <Settings className="w-4 h-4 text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Fields</h2>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-gray-100 rounded-md"
          title="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Field Types */}
      <div className="flex-1 overflow-y-auto">
        {fieldTypes.map((fieldType) => {
          const fields = state.currentTemplate.fields[fieldType.key] || [];
          const canAdd = canAddField(fieldType.key, fields.length, fieldType.max);
          
          return (
            <div key={fieldType.key} className="border-b border-gray-100">
              {/* Field Type Header */}
              <div className="p-3 bg-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-700">{fieldType.label}</h3>
                  <p className="text-xs text-gray-500">
                    {fields.length} {fieldType.max === -1 ? '' : `of ${fieldType.max}`}
                  </p>
                </div>
                {canAdd && (
                  <button
                    onClick={() => handleAddField(fieldType.key)}
                    className="p-1 hover:bg-gray-200 rounded-md"
                    title={`Add ${fieldType.label}`}
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                )}
              </div>

              {/* Fields */}
              <div className="space-y-1">
                {fields.map((field, index) => (
                  <FieldEditor
                    key={field.key}
                    fieldType={fieldType.key}
                    fieldIndex={index}
                    field={field}
                    isSelected={
                      state.selectedFieldType === fieldType.key &&
                      state.selectedFieldIndex === index
                    }
                    onSelect={() => setSelectedField(fieldType.key, index)}
                    onDeselect={clearSelection}
                  />
                ))}
                
                {fields.length === 0 && (
                  <div className="p-3 text-center text-gray-500 text-sm">
                    No {fieldType.label.toLowerCase()}
                    {canAdd && (
                      <button
                        onClick={() => handleAddField(fieldType.key)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        Add one
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          <p>Apple PassKit compliant</p>
          <p>Real-time preview enabled</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
