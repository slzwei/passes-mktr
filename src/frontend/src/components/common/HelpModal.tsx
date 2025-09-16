import React, { useState, useEffect } from 'react';
import { X, Search, BookOpen, Keyboard, Lightbulb } from 'lucide-react';
import helpService from '../../services/helpService';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<string>('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const helpSections = helpService.getHelpSections();
  const quickTips = helpService.getQuickTips();
  const keyboardShortcuts = helpService.getKeyboardShortcuts();

  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      const results = helpService.searchHelp(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setSearchQuery('');
  };

  const renderSection = (section: any) => {
    if (section.subsections) {
      return (
        <div key={section.id} className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{section.title}</h3>
          <p className="text-gray-600 mb-4">{section.content}</p>
          <div className="space-y-4">
            {section.subsections.map((subsection: any) => (
              <div key={subsection.id} className="border-l-4 border-blue-200 pl-4">
                <h4 className="font-medium text-gray-700 mb-2">{subsection.title}</h4>
                <p className="text-gray-600 text-sm">{subsection.content}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div key={section.id} className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">{section.title}</h3>
        <p className="text-gray-600">{section.content}</p>
      </div>
    );
  };

  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="loading-spinner"></div>
          <span className="ml-2 text-gray-600">Searching...</span>
        </div>
      );
    }

    if (searchResults.length === 0 && searchQuery.trim()) {
      return (
        <div className="text-center py-8">
          <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">No results found for "{searchQuery}"</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {searchResults.map((result) => (
          <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
            <h4 className="font-medium text-gray-800 mb-2">{result.title}</h4>
            <p className="text-gray-600 text-sm">{result.content}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderKeyboardShortcuts = () => {
    return (
      <div className="space-y-6">
        {keyboardShortcuts.map((category) => (
          <div key={category.category}>
            <h4 className="font-semibold text-gray-800 mb-3">{category.category}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {category.shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                    {shortcut.key}
                  </span>
                  <span className="text-sm text-gray-600">{shortcut.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderQuickTips = () => {
    return (
      <div className="space-y-3">
        {quickTips.map((tip, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
            <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">{tip}</p>
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">Help & Documentation</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex h-96">
              {/* Sidebar */}
              <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
                <div className="p-4">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search help..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <nav className="space-y-1">
                    <button
                      onClick={() => handleSectionClick('getting-started')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                        activeSection === 'getting-started' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Getting Started
                    </button>
                    <button
                      onClick={() => handleSectionClick('field-types')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                        activeSection === 'field-types' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Field Types
                    </button>
                    <button
                      onClick={() => handleSectionClick('keyboard-shortcuts')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                        activeSection === 'keyboard-shortcuts' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Keyboard Shortcuts
                    </button>
                    <button
                      onClick={() => handleSectionClick('validation')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                        activeSection === 'validation' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Validation & Requirements
                    </button>
                    <button
                      onClick={() => handleSectionClick('troubleshooting')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                        activeSection === 'troubleshooting' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Troubleshooting
                    </button>
                    <button
                      onClick={() => handleSectionClick('best-practices')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                        activeSection === 'best-practices' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Best Practices
                    </button>
                  </nav>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {searchQuery.trim() ? (
                    renderSearchResults()
                  ) : activeSection === 'keyboard-shortcuts' ? (
                    renderKeyboardShortcuts()
                  ) : activeSection === 'quick-tips' ? (
                    renderQuickTips()
                  ) : (
                    renderSection(helpService.getHelpSection(activeSection) || helpSections[0])
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setActiveSection('quick-tips')}
                    className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span>Quick Tips</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('keyboard-shortcuts')}
                    className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Keyboard className="w-4 h-4" />
                    <span>Shortcuts</span>
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  Press Ctrl+H to open help anytime
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
