/**
 * WebSocket Service
 * Handles real-time communication for WYSIWYG editor preview updates
 */

const { Server } = require('socket.io');
const logger = require('../utils/logger');
const PreviewService = require('./previewService');
const EditorStateService = require('./editorStateService');

class WebSocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });
    
    this.previewService = new PreviewService();
    this.editorStates = new Map(); // Store editor states by session ID
    
    this.setupEventHandlers();
    logger.info('WebSocket service initialized');
  }

  /**
   * Setup WebSocket event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info('Client connected', { socketId: socket.id });

      // Initialize editor state for this session
      const editorState = new EditorStateService();
      this.editorStates.set(socket.id, editorState);

      // Handle preview updates
      socket.on('update-preview', async (data) => {
        try {
          await this.handlePreviewUpdate(socket, data);
        } catch (error) {
          logger.error('Preview update failed:', error);
          socket.emit('preview-error', { error: error.message });
        }
      });

      // Handle template updates
      socket.on('update-template', async (data) => {
        try {
          await this.handleTemplateUpdate(socket, data);
        } catch (error) {
          logger.error('Template update failed:', error);
          socket.emit('template-error', { error: error.message });
        }
      });

      // Handle field updates
      socket.on('update-field', async (data) => {
        try {
          await this.handleFieldUpdate(socket, data);
        } catch (error) {
          logger.error('Field update failed:', error);
          socket.emit('field-error', { error: error.message });
        }
      });

      // Handle color updates
      socket.on('update-colors', async (data) => {
        try {
          await this.handleColorUpdate(socket, data);
        } catch (error) {
          logger.error('Color update failed:', error);
          socket.emit('color-error', { error: error.message });
        }
      });

      // Handle image updates
      socket.on('update-images', async (data) => {
        try {
          await this.handleImageUpdate(socket, data);
        } catch (error) {
          logger.error('Image update failed:', error);
          socket.emit('image-error', { error: error.message });
        }
      });

      // Handle validation requests
      socket.on('validate-template', async (data) => {
        try {
          await this.handleValidation(socket, data);
        } catch (error) {
          logger.error('Validation failed:', error);
          socket.emit('validation-error', { error: error.message });
        }
      });

      // Handle undo/redo
      socket.on('undo', () => {
        this.handleUndo(socket);
      });

      socket.on('redo', () => {
        this.handleRedo(socket);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info('Client disconnected', { socketId: socket.id });
        this.editorStates.delete(socket.id);
      });
    });
  }

  /**
   * Handle preview update
   */
  async handlePreviewUpdate(socket, data) {
    const { template, passData } = data;
    const editorState = this.editorStates.get(socket.id);
    
    if (!editorState) {
      throw new Error('Editor state not found');
    }

    // Update editor state
    editorState.updateTemplate(template);
    editorState.setLoading(true);

    // Emit loading state
    socket.emit('preview-loading', { isLoading: true });

    try {
      // Generate preview
      const previewData = await this.previewService.generatePreview(template, passData);
      
      // Update editor state
      editorState.setPreviewData(previewData);
      editorState.setValidation(previewData);

      // Emit preview update
      socket.emit('preview-updated', {
        preview: previewData,
        validation: previewData
      });

    } catch (error) {
      editorState.setLoading(false);
      throw error;
    }
  }

  /**
   * Handle template update
   */
  async handleTemplateUpdate(socket, data) {
    const { template, passData } = data;
    const editorState = this.editorStates.get(socket.id);
    
    if (!editorState) {
      throw new Error('Editor state not found');
    }

    editorState.updateTemplate(template);
    
    // Generate preview for updated template
    await this.handlePreviewUpdate(socket, { template, passData });
  }

  /**
   * Handle field update
   */
  async handleFieldUpdate(socket, data) {
    const { fieldType, fieldIndex, field, template, passData } = data;
    const editorState = this.editorStates.get(socket.id);
    
    if (!editorState) {
      throw new Error('Editor state not found');
    }

    editorState.updateField(fieldType, fieldIndex, field);
    
    // Get updated template
    const updatedTemplate = editorState.getState().currentTemplate;
    
    // Generate preview for updated template
    await this.handlePreviewUpdate(socket, { template: updatedTemplate, passData });
  }

  /**
   * Handle color update
   */
  async handleColorUpdate(socket, data) {
    const { colors, template, passData } = data;
    const editorState = this.editorStates.get(socket.id);
    
    if (!editorState) {
      throw new Error('Editor state not found');
    }

    editorState.updateColors(colors);
    
    // Get updated template
    const updatedTemplate = editorState.getState().currentTemplate;
    
    // Generate preview for updated template
    await this.handlePreviewUpdate(socket, { template: updatedTemplate, passData });
  }

  /**
   * Handle image update
   */
  async handleImageUpdate(socket, data) {
    const { images, template, passData } = data;
    const editorState = this.editorStates.get(socket.id);
    
    if (!editorState) {
      throw new Error('Editor state not found');
    }

    editorState.updateImages(images);
    
    // Get updated template
    const updatedTemplate = editorState.getState().currentTemplate;
    
    // Generate preview for updated template
    await this.handlePreviewUpdate(socket, { template: updatedTemplate, passData });
  }

  /**
   * Handle validation
   */
  async handleValidation(socket, data) {
    const { template } = data;
    
    try {
      const validation = await this.previewService.validateTemplate(template);
      
      socket.emit('validation-complete', {
        validation
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle undo
   */
  handleUndo(socket) {
    const editorState = this.editorStates.get(socket.id);
    
    if (!editorState) {
      throw new Error('Editor state not found');
    }

    const success = editorState.undo();
    
    if (success) {
      const state = editorState.getState();
      socket.emit('state-updated', {
        state,
        canUndo: editorState.canUndo(),
        canRedo: editorState.canRedo()
      });
    }
  }

  /**
   * Handle redo
   */
  handleRedo(socket) {
    const editorState = this.editorStates.get(socket.id);
    
    if (!editorState) {
      throw new Error('Editor state not found');
    }

    const success = editorState.redo();
    
    if (success) {
      const state = editorState.getState();
      socket.emit('state-updated', {
        state,
        canUndo: editorState.canUndo(),
        canRedo: editorState.canRedo()
      });
    }
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount() {
    return this.io.engine.clientsCount;
  }

  /**
   * Broadcast to all clients
   */
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  /**
   * Send to specific client
   */
  sendToClient(socketId, event, data) {
    this.io.to(socketId).emit(event, data);
  }

  /**
   * Get editor state for client
   */
  getEditorState(socketId) {
    return this.editorStates.get(socketId);
  }
}

module.exports = WebSocketService;
