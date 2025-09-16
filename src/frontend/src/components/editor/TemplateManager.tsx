import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FolderOpen, 
  Download, 
  Upload, 
  Copy, 
  Trash2, 
  Eye,
  Search,
  Grid,
  List,
  Star
} from 'lucide-react';
import { PassTemplate } from '../../types/passTypes';
import templateService from '../../services/templateService';
import notificationService from '../../services/notificationService';
import TemplateLibrary from './TemplateLibrary';

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: PassTemplate) => void;
  onNewTemplate: () => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onNewTemplate
}) => {
  const [templates, setTemplates] = useState<PassTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<PassTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Filter and sort templates
  useEffect(() => {
    let filtered = [...templates];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(template => template.type === filterType);
    }

    // Sort templates
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created':
          comparison = new Date(a.id).getTime() - new Date(b.id).getTime();
          break;
        case 'updated':
          comparison = new Date(a.id).getTime() - new Date(b.id).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, filterType, sortBy, sortOrder]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const loadedTemplates = templateService.getTemplates();
      setTemplates(loadedTemplates);
    } catch (error) {
      notificationService.error('Error', 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewTemplate = () => {
    const newTemplate = templateService.createNewTemplate();
    setTemplates(prev => [...prev, newTemplate]);
    onSelectTemplate(newTemplate);
    onClose();
    notificationService.templateCreated(newTemplate.name);
  };

  const handleUseTemplateFromLibrary = (template: PassTemplate) => {
    setTemplates(prev => [...prev, template]);
    onSelectTemplate(template);
    onClose();
    notificationService.templateCreated(template.name);
  };

  const handleSelectTemplate = (template: PassTemplate) => {
    onSelectTemplate(template);
    onClose();
    notificationService.templateLoaded(template.name);
  };

  const handleDuplicateTemplate = (template: PassTemplate) => {
    const duplicated = templateService.duplicateTemplate(template.id);
    if (duplicated) {
      setTemplates(prev => [...prev, duplicated]);
      notificationService.templateDuplicated(template.name);
    }
  };

  const handleDeleteTemplate = (template: PassTemplate) => {
    if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      const success = templateService.deleteTemplate(template.id);
      if (success) {
        setTemplates(prev => prev.filter(t => t.id !== template.id));
        notificationService.templateDeleted(template.name);
      }
    }
  };

  const handleExportTemplate = (template: PassTemplate) => {
    const jsonString = templateService.exportTemplate(template.id);
    if (jsonString) {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notificationService.templateExported(template.name);
    }
  };

  const handleImportTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const imported = templateService.importTemplate(jsonString);
        if (imported) {
          setTemplates(prev => [...prev, imported]);
          notificationService.templateImported(imported.name);
        } else {
          notificationService.error('Import Error', 'Invalid template file');
        }
      } catch (error) {
        notificationService.error('Import Error', 'Failed to import template');
      }
    };
    reader.readAsText(file);
  };

  const handleBulkDelete = () => {
    if (selectedTemplates.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedTemplates.size} templates?`)) {
      selectedTemplates.forEach(templateId => {
        templateService.deleteTemplate(templateId);
      });
      setTemplates(prev => prev.filter(t => !selectedTemplates.has(t.id)));
      setSelectedTemplates(new Set());
      notificationService.templatesDeleted(selectedTemplates.size);
    }
  };

  const handleSelectAll = () => {
    if (selectedTemplates.size === filteredTemplates.length) {
      setSelectedTemplates(new Set());
    } else {
      setSelectedTemplates(new Set(filteredTemplates.map(t => t.id)));
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const newSelected = new Set(selectedTemplates);
    if (newSelected.has(templateId)) {
      newSelected.delete(templateId);
    } else {
      newSelected.add(templateId);
    }
    setSelectedTemplates(newSelected);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          <div className="bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <FolderOpen className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">Template Manager</h2>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                  {filteredTemplates.length} templates
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowTemplateLibrary(true)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Star className="w-4 h-4" />
                  <span>Template Library</span>
                </button>
                <button
                  onClick={handleNewTemplate}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Template</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Filters */}
                <div className="flex items-center space-x-4">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="form-select text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="redemption">Redemption</option>
                    <option value="points">Points</option>
                    <option value="rewards">Rewards</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="form-select text-sm"
                  >
                    <option value="updated">Last Updated</option>
                    <option value="created">Date Created</option>
                    <option value="name">Name</option>
                  </select>

                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 hover:bg-gray-200 rounded-md"
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    <svg className={`w-4 h-4 transform transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>

                  <div className="flex border border-gray-300 rounded-md">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedTemplates.size > 0 && (
                <div className="mt-4 flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedTemplates.size} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="btn-danger text-sm"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Selected
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="loading-spinner"></div>
                  <span className="ml-2 text-gray-600">Loading templates...</span>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first template'}
                  </p>
                  <button
                    onClick={handleNewTemplate}
                    className="btn-primary"
                  >
                    Create Template
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isSelected={selectedTemplates.has(template.id)}
                      onSelect={() => handleTemplateSelect(template.id)}
                      onOpen={() => handleSelectTemplate(template)}
                      onDuplicate={() => handleDuplicateTemplate(template)}
                      onDelete={() => handleDeleteTemplate(template)}
                      onExport={() => handleExportTemplate(template)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map((template) => (
                    <TemplateListItem
                      key={template.id}
                      template={template}
                      isSelected={selectedTemplates.has(template.id)}
                      onSelect={() => handleTemplateSelect(template.id)}
                      onOpen={() => handleSelectTemplate(template)}
                      onDuplicate={() => handleDuplicateTemplate(template)}
                      onDelete={() => handleDeleteTemplate(template)}
                      onExport={() => handleExportTemplate(template)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTemplates.size === filteredTemplates.length && filteredTemplates.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                    <span>Select All</span>
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="btn-secondary text-sm cursor-pointer">
                    <Upload className="w-4 h-4 mr-1" />
                    Import
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportTemplate}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Library Modal */}
      <TemplateLibrary
        isOpen={showTemplateLibrary}
        onClose={() => setShowTemplateLibrary(false)}
        onSelectTemplate={handleUseTemplateFromLibrary}
      />
    </div>
  );
};

// Template Card Component
interface TemplateCardProps {
  template: PassTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onExport: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onSelect,
  onOpen,
  onDuplicate,
  onDelete,
  onExport
}) => {
  return (
    <div
      className={`relative border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
          <p className="text-sm text-gray-500 capitalize">{template.type}</p>
          {template.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-1 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="p-1 hover:bg-gray-200 rounded text-gray-600"
            title="Open template"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1 hover:bg-gray-200 rounded text-gray-600"
            title="Duplicate template"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExport();
            }}
            className="p-1 hover:bg-gray-200 rounded text-gray-600"
            title="Export template"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-red-100 rounded text-red-600"
            title="Delete template"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Fields: {Object.values(template.fields).flat().length}</span>
        <span>{new Date(template.id).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

// Template List Item Component
interface TemplateListItemProps {
  template: PassTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onExport: () => void;
}

const TemplateListItem: React.FC<TemplateListItemProps> = ({
  template,
  isSelected,
  onSelect,
  onOpen,
  onDuplicate,
  onDelete,
  onExport
}) => {
  return (
    <div
      className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onSelect}
        className="mr-3 rounded"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3">
          <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
            {template.type}
          </span>
          {template.description && (
            <span className="text-sm text-gray-500 truncate">{template.description}</span>
          )}
        </div>
        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
          <span>Fields: {Object.values(template.fields).flat().length}</span>
          <span>Created: {new Date(template.id).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex items-center space-x-1">
        <button
          onClick={onOpen}
          className="p-1 hover:bg-gray-200 rounded text-gray-600"
          title="Open template"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={onDuplicate}
          className="p-1 hover:bg-gray-200 rounded text-gray-600"
          title="Duplicate template"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={onExport}
          className="p-1 hover:bg-gray-200 rounded text-gray-600"
          title="Export template"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 hover:bg-red-100 rounded text-red-600"
          title="Delete template"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TemplateManager;
