import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import PreviewPane from '../preview/PreviewPane';
import PropertiesPanel from './PropertiesPanel';
import HelpModal from '../common/HelpModal';
import NotificationContainer from '../common/NotificationContainer';
import TemplateManager from './TemplateManager';
import VariableTester from './VariableTester';
import { useEditor } from '../../hooks/useEditor';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useEditorShortcuts } from '../../services/keyboardShortcutsService';
import notificationService from '../../services/notificationService';
import { NotificationProps } from '../common/Notification';

const EditorLayout: React.FC = () => {
  const { state, generatePreview, validateTemplate, undo, redo, canUndo, canRedo } = useEditor();
  const { isConnected } = useWebSocket();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [propertiesCollapsed, setPropertiesCollapsed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showVariableTester, setShowVariableTester] = useState(false);
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  // Auto-generate preview when template changes
  useEffect(() => {
    if (state.isDirty && isConnected) {
      const passData = {
        campaignId: '550e8400-e29b-41d4-a716-446655440001',
        campaignName: 'Demo Campaign',
        tenantName: 'MKTR Platform',
        customerEmail: 'demo@mktr.sg',
        customerName: 'John Doe',
        stampsEarned: 7,
        stampsRequired: 10,
        pointsEarned: 150,
        spendAmount: 10,
        nextReward: 'Free coffee at 10 stamps',
        membershipTier: 'Gold',
        expiryDate: '2024-12-31'
      };
      
      generatePreview(passData);
    }
  }, [state.currentTemplate, isConnected, generatePreview, state.isDirty]);

  // Validate template when it changes
  useEffect(() => {
    if (isConnected) {
      validateTemplate();
    }
  }, [state.currentTemplate, isConnected, validateTemplate]);

  // Subscribe to notifications
  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  // Keyboard shortcuts
  useEditorShortcuts({
    onSave: () => {
      // TODO: Implement save
      notificationService.templateSaved(state.currentTemplate.name);
    },
    onUndo: undo,
    onRedo: redo,
    onNew: () => {
      setShowTemplateManager(true);
    },
    onOpen: () => {
      setShowTemplateManager(true);
    },
    onExport: () => {
      // TODO: Implement export
      notificationService.passExported();
    },
    onPreview: () => {
      // TODO: Implement preview
      notificationService.previewGenerated();
    },
    onFind: () => {
      // TODO: Implement find
      notificationService.info('Find', 'Find functionality coming soon...');
    },
    onHelp: () => setShowHelp(true),
    onClearSelection: () => {
      // TODO: Implement clear selection
      notificationService.info('Clear Selection', 'Selection cleared');
    },
    onDelete: () => {
      // TODO: Implement delete
      notificationService.info('Delete', 'Delete functionality coming soon...');
    },
    onEdit: () => {
      // TODO: Implement edit
      notificationService.info('Edit', 'Edit functionality coming soon...');
    }
  });

  // Handle notification removal
  const handleRemoveNotification = (id: string) => {
    notificationService.remove(id);
  };

  // Handle template selection
  const handleSelectTemplate = (template: any) => {
    // TODO: Load template into editor
    notificationService.templateLoaded(template.name);
  };

  // Handle new template
  const handleNewTemplate = () => {
    // TODO: Create new template
    notificationService.templateCreated('New Template');
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className={`editor-panel transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-80'
      }`}>
        <Sidebar 
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-800">
              Apple Wallet Pass Editor
            </h1>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center space-x-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Connected</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Disconnected</span>
                </div>
              )}
            </div>

            {state.isDirty && (
              <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">
                Unsaved changes
              </span>
            )}
            {state.isLoading && (
              <div className="flex items-center space-x-2">
                <div className="loading-spinner"></div>
                <span className="text-sm text-gray-600">Generating preview...</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Undo/Redo */}
            <div className="flex items-center space-x-1">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo (Ctrl+Y)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>

            <div className="w-px h-6 bg-gray-300"></div>

            <button
              onClick={() => setShowTemplateManager(true)}
              className="btn-secondary"
              title="Template Manager (Ctrl+O)"
            >
              Templates
            </button>
            <button
              onClick={() => {/* TODO: Implement save */}}
              className="btn-primary"
              disabled={!state.isDirty}
            >
              Save Template
            </button>
            <button
              onClick={() => {/* TODO: Implement export */}}
              className="btn-secondary"
            >
              Export Pass
            </button>
            <button
              onClick={() => setShowVariableTester(true)}
              className="btn-secondary"
              title="Test Variables"
            >
              Test Variables
            </button>
            <button
              onClick={() => setShowHelp(true)}
              className="btn-secondary"
              title="Help (Ctrl+H)"
            >
              Help
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex">
          {/* Preview Pane */}
          <div className="flex-1 preview-panel">
            <PreviewPane />
          </div>

          {/* Properties Panel */}
          <div className={`properties-panel transition-all duration-300 ${
            propertiesCollapsed ? 'w-16' : 'w-80'
          }`}>
            <PropertiesPanel 
              collapsed={propertiesCollapsed}
              onToggleCollapse={() => setPropertiesCollapsed(!propertiesCollapsed)}
            />
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {/* Template Manager */}
      <TemplateManager
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        onSelectTemplate={handleSelectTemplate}
        onNewTemplate={handleNewTemplate}
      />

      {/* Variable Tester */}
      <VariableTester
        isOpen={showVariableTester}
        onClose={() => setShowVariableTester(false)}
        template={state.currentTemplate}
      />

      {/* Notifications */}
      <NotificationContainer
        notifications={notifications}
        onRemove={handleRemoveNotification}
      />
    </div>
  );
};

export default EditorLayout;
