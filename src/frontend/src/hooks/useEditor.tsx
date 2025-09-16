import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { EditorState, PassTemplate, PassData, ValidationResult, FieldConfiguration, Field, ColorConfiguration, ImageConfiguration, PassPreview } from '../types/passTypes';
import { useWebSocket } from './useWebSocket';

interface EditorContextType {
  state: EditorState;
  updateTemplate: (template: Partial<PassTemplate>) => void;
  updateField: (fieldType: keyof FieldConfiguration, fieldIndex: number, field: Field) => void;
  addField: (fieldType: keyof FieldConfiguration, field: Field) => void;
  removeField: (fieldType: keyof FieldConfiguration, fieldIndex: number) => void;
  updateColors: (colors: Partial<any>) => void;
  updateImages: (images: Partial<any>) => void;
  setSelectedField: (fieldType: keyof FieldConfiguration, fieldIndex: number) => void;
  clearSelection: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  generatePreview: (passData: PassData) => void;
  validateTemplate: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

const initialState: EditorState = {
  currentTemplate: {
    id: '',
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

type EditorAction =
  | { type: 'UPDATE_TEMPLATE'; payload: Partial<PassTemplate> }
  | { type: 'UPDATE_FIELD'; payload: { fieldType: keyof FieldConfiguration; fieldIndex: number; field: Field } }
  | { type: 'ADD_FIELD'; payload: { fieldType: keyof FieldConfiguration; field: Field } }
  | { type: 'REMOVE_FIELD'; payload: { fieldType: keyof FieldConfiguration; fieldIndex: number } }
  | { type: 'UPDATE_COLORS'; payload: Partial<ColorConfiguration> }
  | { type: 'UPDATE_IMAGES'; payload: Partial<ImageConfiguration> }
  | { type: 'SET_SELECTED_FIELD'; payload: { fieldType: keyof FieldConfiguration; fieldIndex: number } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_PREVIEW_DATA'; payload: PassPreview | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_VALIDATION'; payload: ValidationResult }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'LOAD_TEMPLATE'; payload: PassTemplate };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        currentTemplate: { ...state.currentTemplate, ...action.payload },
        isDirty: true
      };
    
    case 'UPDATE_FIELD':
      const { fieldType, fieldIndex, field } = action.payload;
      const updatedFields = { ...state.currentTemplate.fields };
      updatedFields[fieldType] = [...updatedFields[fieldType]];
      updatedFields[fieldType][fieldIndex] = { ...updatedFields[fieldType][fieldIndex], ...field };
      
      return {
        ...state,
        currentTemplate: {
          ...state.currentTemplate,
          fields: updatedFields
        },
        isDirty: true
      };
    
    case 'ADD_FIELD':
      const { fieldType: addFieldType, field: newField } = action.payload;
      const addFields = { ...state.currentTemplate.fields };
      addFields[addFieldType] = [...addFields[addFieldType], newField];
      
      return {
        ...state,
        currentTemplate: {
          ...state.currentTemplate,
          fields: addFields
        },
        isDirty: true
      };
    
    case 'REMOVE_FIELD':
      const { fieldType: removeFieldType, fieldIndex: removeIndex } = action.payload;
      const removeFields = { ...state.currentTemplate.fields };
      removeFields[removeFieldType] = removeFields[removeFieldType].filter((_, index) => index !== removeIndex);
      
      return {
        ...state,
        currentTemplate: {
          ...state.currentTemplate,
          fields: removeFields
        },
        isDirty: true
      };
    
    case 'UPDATE_COLORS':
      return {
        ...state,
        currentTemplate: {
          ...state.currentTemplate,
          colors: { ...state.currentTemplate.colors, ...action.payload }
        },
        isDirty: true
      };
    
    case 'UPDATE_IMAGES':
      return {
        ...state,
        currentTemplate: {
          ...state.currentTemplate,
          images: { ...state.currentTemplate.images, ...action.payload }
        },
        isDirty: true
      };
    
    case 'SET_SELECTED_FIELD':
      return {
        ...state,
        selectedFieldType: action.payload.fieldType,
        selectedFieldIndex: action.payload.fieldIndex
      };
    
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedFieldType: null,
        selectedFieldIndex: null
      };
    
    case 'SET_PREVIEW_DATA':
      return {
        ...state,
        previewData: action.payload,
        isLoading: false
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    case 'SET_VALIDATION':
      return {
        ...state,
        validation: action.payload
      };
    
    case 'SET_DIRTY':
      return {
        ...state,
        isDirty: action.payload
      };
    
    case 'LOAD_TEMPLATE':
      return {
        ...state,
        currentTemplate: action.payload,
        isDirty: false
      };
    
    default:
      return state;
  }
}

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const { socket, isConnected } = useWebSocket();

  // WebSocket event handlers
  useEffect(() => {
    if (!socket) return;

    const handlePreviewUpdated = (data: any) => {
      dispatch({ type: 'SET_PREVIEW_DATA', payload: data.preview });
      dispatch({ type: 'SET_VALIDATION', payload: data.validation });
    };

    const handlePreviewLoading = (data: any) => {
      dispatch({ type: 'SET_LOADING', payload: data.isLoading });
    };

    const handlePreviewError = (error: any) => {
      console.error('Preview error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    socket.on('preview-updated', handlePreviewUpdated);
    socket.on('preview-loading', handlePreviewLoading);
    socket.on('preview-error', handlePreviewError);

    return () => {
      socket.off('preview-updated', handlePreviewUpdated);
      socket.off('preview-loading', handlePreviewLoading);
      socket.off('preview-error', handlePreviewError);
    };
  }, [socket]);

  const updateTemplate = useCallback((template: Partial<PassTemplate>) => {
    dispatch({ type: 'UPDATE_TEMPLATE', payload: template });
    
    if (socket && isConnected) {
      socket.emit('update-template', {
        template: { ...state.currentTemplate, ...template },
        passData: getDefaultPassData()
      });
    }
  }, [socket, isConnected, state.currentTemplate]);

  const updateField = useCallback((fieldType: keyof FieldConfiguration, fieldIndex: number, field: Field) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { fieldType, fieldIndex, field } });
    
    if (socket && isConnected) {
      socket.emit('update-field', {
        fieldType,
        fieldIndex,
        field,
        template: state.currentTemplate,
        passData: getDefaultPassData()
      });
    }
  }, [socket, isConnected, state.currentTemplate]);

  const addField = useCallback((fieldType: keyof FieldConfiguration, field: Field) => {
    dispatch({ type: 'ADD_FIELD', payload: { fieldType, field } });
    
    if (socket && isConnected) {
      socket.emit('update-template', {
        template: state.currentTemplate,
        passData: getDefaultPassData()
      });
    }
  }, [socket, isConnected, state.currentTemplate]);

  const removeField = useCallback((fieldType: keyof FieldConfiguration, fieldIndex: number) => {
    dispatch({ type: 'REMOVE_FIELD', payload: { fieldType, fieldIndex } });
    
    if (socket && isConnected) {
      socket.emit('update-template', {
        template: state.currentTemplate,
        passData: getDefaultPassData()
      });
    }
  }, [socket, isConnected, state.currentTemplate]);

  const updateColors = useCallback((colors: Partial<ColorConfiguration>) => {
    dispatch({ type: 'UPDATE_COLORS', payload: colors });
    
    if (socket && isConnected) {
      socket.emit('update-colors', {
        colors,
        template: state.currentTemplate,
        passData: getDefaultPassData()
      });
    }
  }, [socket, isConnected, state.currentTemplate]);

  const updateImages = useCallback((images: Partial<ImageConfiguration>) => {
    dispatch({ type: 'UPDATE_IMAGES', payload: images });
    
    if (socket && isConnected) {
      socket.emit('update-images', {
        images,
        template: state.currentTemplate,
        passData: getDefaultPassData()
      });
    }
  }, [socket, isConnected, state.currentTemplate]);

  const setSelectedField = useCallback((fieldType: keyof FieldConfiguration, fieldIndex: number) => {
    dispatch({ type: 'SET_SELECTED_FIELD', payload: { fieldType, fieldIndex } });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const undo = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('undo');
    }
  }, [socket, isConnected]);

  const redo = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('redo');
    }
  }, [socket, isConnected]);

  const generatePreview = useCallback((passData: PassData) => {
    if (socket && isConnected) {
      dispatch({ type: 'SET_LOADING', payload: true });
      socket.emit('update-preview', {
        template: state.currentTemplate,
        passData
      });
    }
  }, [socket, isConnected, state.currentTemplate]);

  const validateTemplate = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('validate-template', {
        template: state.currentTemplate
      });
    }
  }, [socket, isConnected, state.currentTemplate]);

  const canUndo = false; // TODO: Implement undo/redo state tracking
  const canRedo = false;

  const value: EditorContextType = {
    state,
    updateTemplate,
    updateField,
    addField,
    removeField,
    updateColors,
    updateImages,
    setSelectedField,
    clearSelection,
    undo,
    redo,
    canUndo,
    canRedo,
    generatePreview,
    validateTemplate
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}

// Helper function to get default pass data
function getDefaultPassData(): PassData {
  return {
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
}
