import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Grid, 
  List, 
  Star, 
  Eye,
  Plus,
  X
} from 'lucide-react';
import { TemplateLibraryItem } from '../../services/templateLibraryService';
import templateLibraryService from '../../services/templateLibraryService';
import templateService from '../../services/templateService';
import notificationService from '../../services/notificationService';

interface TemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: any) => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  const [templates, setTemplates] = useState<TemplateLibraryItem[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateLibraryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'popularity'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // Load templates and metadata on mount
  useEffect(() => {
    const libraryTemplates = templateLibraryService.getTemplateLibrary();
    setTemplates(libraryTemplates);
    setCategories(templateLibraryService.getCategories());
    setTags(templateLibraryService.getTags());
  }, []);

  // Filter and sort templates
  useEffect(() => {
    let filtered = [...templates];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = templateLibraryService.searchTemplates(searchQuery);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by tag
    if (selectedTag !== 'all') {
      filtered = filtered.filter(template => 
        template.tags.some(tag => tag === selectedTag)
      );
    }

    // Sort templates
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'popularity':
          // Mock popularity based on template ID
          comparison = a.id.localeCompare(b.id);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory, selectedTag, sortBy, sortOrder]);

  const handleUseTemplate = (libraryItem: TemplateLibraryItem) => {
    const newTemplate = templateLibraryService.createTemplateFromLibrary(libraryItem);
    templateService.saveTemplate(newTemplate);
    onSelectTemplate(newTemplate);
    onClose();
    notificationService.templateCreated(newTemplate.name);
  };

  const handlePreviewTemplate = (libraryItem: TemplateLibraryItem) => {
    // TODO: Implement template preview
    notificationService.info('Preview', 'Template preview coming soon...');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedTag('all');
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
                <Star className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-semibold text-gray-800">Template Library</h2>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                  {filteredTemplates.length} templates
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
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
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="form-select text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>

                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="form-select text-sm"
                  >
                    <option value="all">All Tags</option>
                    {tags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="form-select text-sm"
                  >
                    <option value="name">Name</option>
                    <option value="category">Category</option>
                    <option value="popularity">Popularity</option>
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

                  <button
                    onClick={handleClearFilters}
                    className="btn-secondary text-sm"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery ? 'Try adjusting your search criteria' : 'No templates match your current filters'}
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="btn-primary"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <TemplateLibraryCard
                      key={template.id}
                      template={template}
                      onUse={() => handleUseTemplate(template)}
                      onPreview={() => handlePreviewTemplate(template)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map((template) => (
                    <TemplateLibraryListItem
                      key={template.id}
                      template={template}
                      onUse={() => handleUseTemplate(template)}
                      onPreview={() => handlePreviewTemplate(template)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Choose a template to get started quickly
                </div>
                <div className="text-sm text-gray-500">
                  All templates are customizable
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Template Library Card Component
interface TemplateLibraryCardProps {
  template: TemplateLibraryItem;
  onUse: () => void;
  onPreview: () => void;
}

const TemplateLibraryCard: React.FC<TemplateLibraryCardProps> = ({
  template,
  onUse,
  onPreview
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
          <p className="text-sm text-gray-500 capitalize">{template.category}</p>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.description}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1 mb-3">
        {template.tags.slice(0, 3).map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
          >
            {tag}
          </span>
        ))}
        {template.tags.length > 3 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            +{template.tags.length - 3}
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <button
            onClick={onPreview}
            className="p-1 hover:bg-gray-200 rounded text-gray-600"
            title="Preview template"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={onUse}
          className="btn-primary text-sm flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Use Template</span>
        </button>
      </div>
    </div>
  );
};

// Template Library List Item Component
interface TemplateLibraryListItemProps {
  template: TemplateLibraryItem;
  onUse: () => void;
  onPreview: () => void;
}

const TemplateLibraryListItem: React.FC<TemplateLibraryListItemProps> = ({
  template,
  onUse,
  onPreview
}) => {
  return (
    <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3">
          <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
            {template.category}
          </span>
          <p className="text-sm text-gray-500 truncate">{template.description}</p>
        </div>
        <div className="flex items-center space-x-2 mt-1">
          {template.tags.slice(0, 4).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 4 && (
            <span className="text-xs text-gray-500">
              +{template.tags.length - 4} more
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={onPreview}
          className="p-1 hover:bg-gray-200 rounded text-gray-600"
          title="Preview template"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={onUse}
          className="btn-primary text-sm flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Use</span>
        </button>
      </div>
    </div>
  );
};

export default TemplateLibrary;
