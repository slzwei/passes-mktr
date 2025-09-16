import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, ChevronRight, Code, Info, Check } from 'lucide-react';
import { Variable, VariableCategory } from '../../services/variableService';
import variableService from '../../services/variableService';

interface VariablePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVariable: (variable: Variable) => void;
  position?: { x: number; y: number };
  context?: string;
}

const VariablePicker: React.FC<VariablePickerProps> = ({
  isOpen,
  onClose,
  onSelectVariable,
  position = { x: 0, y: 0 },
  context = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<VariableCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedVariable, setSelectedVariable] = useState<Variable | null>(null);
  const [categories, setCategories] = useState<VariableCategory[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Load categories on mount
  useEffect(() => {
    const loadedCategories = variableService.getVariableCategories();
    setCategories(loadedCategories);
    
    // Auto-expand relevant categories based on context
    if (context) {
      const suggestions = variableService.getVariableSuggestions(context);
      const relevantCategories = new Set(suggestions.map(v => v.category));
      setExpandedCategories(relevantCategories);
    }
  }, [context]);

  // Filter categories based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = categories.map(category => ({
        ...category,
        variables: category.variables.filter(variable =>
          variable.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          variable.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          variable.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.variables.length > 0);
      
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchQuery, categories]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'Enter':
          if (selectedVariable) {
            onSelectVariable(selectedVariable);
            onClose();
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          // TODO: Implement arrow key navigation
          break;
        case 'ArrowUp':
          event.preventDefault();
          // TODO: Implement arrow key navigation
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, selectedVariable, onSelectVariable]);

  const handleCategoryToggle = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const handleVariableSelect = (variable: Variable) => {
    setSelectedVariable(variable);
    onSelectVariable(variable);
    onClose();
  };

  const handleVariableHover = (variable: Variable) => {
    setSelectedVariable(variable);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-md max-h-96 overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateY(-100%)'
      }}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search variables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {filteredCategories.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Code className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No variables found</p>
          </div>
        ) : (
          <div className="p-2">
            {filteredCategories.map((category) => (
              <div key={category.name} className="mb-2">
                {/* Category Header */}
                <button
                  onClick={() => handleCategoryToggle(category.name)}
                  className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-md"
                >
                  <div className="flex items-center space-x-2">
                    {expandedCategories.has(category.name) ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="font-medium text-gray-700">{category.name}</span>
                    <span className="text-xs text-gray-500">({category.variables.length})</span>
                  </div>
                </button>

                {/* Variables */}
                {expandedCategories.has(category.name) && (
                  <div className="ml-4 space-y-1">
                    {category.variables.map((variable) => (
                      <button
                        key={variable.key}
                        onClick={() => handleVariableSelect(variable)}
                        onMouseEnter={() => handleVariableHover(variable)}
                        className={`w-full flex items-center justify-between p-2 text-left hover:bg-blue-50 rounded-md ${
                          selectedVariable?.key === variable.key ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded text-blue-600">
                              {`{{${variable.key}}}`}
                            </code>
                            {variable.required && (
                              <span className="text-xs text-red-500">*</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">{variable.label}</p>
                          <p className="text-xs text-gray-500 truncate">{variable.description}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {variable.examples && variable.examples.length > 0 && (
                            <div title={`Examples: ${variable.examples.join(', ')}`}>
                              <Info className="w-3 h-3 text-gray-400" />
                            </div>
                          )}
                          <Check className="w-3 h-3 text-green-500" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>↑↓ Navigate</span>
            <span>Enter Select</span>
            <span>Esc Close</span>
          </div>
          <div>
            {selectedVariable && (
              <span>Selected: {selectedVariable.label}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariablePicker;
