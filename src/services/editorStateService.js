/**
 * Editor State Service
 * Manages WYSIWYG editor state and provides undo/redo functionality
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class EditorStateService {
  constructor() {
    this.state = this.getInitialState();
    this.history = [];
    this.historyIndex = -1;
    this.maxHistorySize = 50;
  }

  /**
   * Get initial editor state
   */
  getInitialState() {
    return {
      currentTemplate: {
        id: uuidv4(),
        name: 'New Pass Template',
        type: 'redemption',
        fields: {
          header: [],
          primary: [],
          secondary: [],
          auxiliary: [],
          back: []
        },
        colors: {
          foreground: 'rgb(255, 255, 255)',
          background: 'rgb(60, 65, 76)',
          label: 'rgb(255, 255, 255)'
        },
        images: {
          logo: null,
          icon: null,
          strip: null
        }
      },
      previewData: null,
      validation: {
        isValid: true,
        errors: [],
        warnings: []
      },
      isDirty: false,
      isLoading: false,
      selectedFieldType: null,
      selectedFieldIndex: null
    };
  }

  /**
   * Get current state
   */
  getState() {
    return this.state;
  }

  /**
   * Update state with new values
   */
  updateState(updates) {
    const previousState = { ...this.state };
    
    this.state = {
      ...this.state,
      ...updates,
      isDirty: true
    };

    // Add to history
    this.addToHistory(previousState);
    
    logger.info('Editor state updated', { updates: Object.keys(updates) });
  }

  /**
   * Update template
   */
  updateTemplate(templateUpdates) {
    this.updateState({
      currentTemplate: {
        ...this.state.currentTemplate,
        ...templateUpdates
      }
    });
  }

  /**
   * Update colors
   */
  updateColors(colorUpdates) {
    this.updateState({
      currentTemplate: {
        ...this.state.currentTemplate,
        colors: {
          ...this.state.currentTemplate.colors,
          ...colorUpdates
        }
      }
    });
  }

  /**
   * Update fields for a specific field type
   */
  updateFields(fieldType, fields) {
    this.updateState({
      currentTemplate: {
        ...this.state.currentTemplate,
        fields: {
          ...this.state.currentTemplate.fields,
          [fieldType]: fields
        }
      }
    });
  }

  /**
   * Add field to specific field type
   */
  addField(fieldType, field) {
    const currentFields = this.state.currentTemplate.fields[fieldType] || [];
    const newFields = [...currentFields, field];
    
    this.updateFields(fieldType, newFields);
  }

  /**
   * Update specific field
   */
  updateField(fieldType, fieldIndex, fieldUpdates) {
    const currentFields = [...this.state.currentTemplate.fields[fieldType]];
    currentFields[fieldIndex] = {
      ...currentFields[fieldIndex],
      ...fieldUpdates
    };
    
    this.updateFields(fieldType, currentFields);
  }

  /**
   * Remove field
   */
  removeField(fieldType, fieldIndex) {
    const currentFields = [...this.state.currentTemplate.fields[fieldType]];
    currentFields.splice(fieldIndex, 1);
    
    this.updateFields(fieldType, currentFields);
  }

  /**
   * Update images
   */
  updateImages(imageUpdates) {
    this.updateState({
      currentTemplate: {
        ...this.state.currentTemplate,
        images: {
          ...this.state.currentTemplate.images,
          ...imageUpdates
        }
      }
    });
  }

  /**
   * Set preview data
   */
  setPreviewData(previewData) {
    this.updateState({
      previewData,
      isLoading: false
    });
  }

  /**
   * Set loading state
   */
  setLoading(isLoading) {
    this.updateState({ isLoading });
  }

  /**
   * Set validation results
   */
  setValidation(validation) {
    this.updateState({ validation });
  }

  /**
   * Set selected field
   */
  setSelectedField(fieldType, fieldIndex) {
    this.updateState({
      selectedFieldType: fieldType,
      selectedFieldIndex: fieldIndex
    });
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.updateState({
      selectedFieldType: null,
      selectedFieldIndex: null
    });
  }

  /**
   * Load template
   */
  loadTemplate(template) {
    this.updateState({
      currentTemplate: template,
      isDirty: false
    });
  }

  /**
   * Reset to clean state
   */
  reset() {
    this.state = this.getInitialState();
    this.history = [];
    this.historyIndex = -1;
  }

  /**
   * Add state to history
   */
  addToHistory(state) {
    // Remove any states after current index
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    // Add new state
    this.history.push(JSON.parse(JSON.stringify(state)));
    this.historyIndex++;
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  /**
   * Undo last action
   */
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.state = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      logger.info('Editor state undone');
      return true;
    }
    return false;
  }

  /**
   * Redo last undone action
   */
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.state = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      logger.info('Editor state redone');
      return true;
    }
    return false;
  }

  /**
   * Check if undo is available
   */
  canUndo() {
    return this.historyIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * Get field limits for Apple PassKit compliance
   */
  getFieldLimits() {
    return {
      header: 2,
      primary: 2,
      secondary: 4,
      auxiliary: 4,
      back: -1 // unlimited
    };
  }

  /**
   * Check if field can be added to field type
   */
  canAddField(fieldType) {
    const limits = this.getFieldLimits();
    const currentCount = this.state.currentTemplate.fields[fieldType]?.length || 0;
    return limits[fieldType] === -1 || currentCount < limits[fieldType];
  }

  /**
   * Export current template
   */
  exportTemplate() {
    return {
      ...this.state.currentTemplate,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import template
   */
  importTemplate(template) {
    this.updateState({
      currentTemplate: {
        ...template,
        id: uuidv4() // Generate new ID
      },
      isDirty: false
    });
  }
}

module.exports = EditorStateService;