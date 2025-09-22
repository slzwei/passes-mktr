/**
 * Enhanced WebSocket Service
 * Handles real-time communication, campaign updates, and UX feedback
 */

const { Server } = require('socket.io');
const logger = require('../utils/logger');

class WebSocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:5173',
          'http://localhost:5174',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:5174',
          process.env.CORS_ORIGIN
        ].filter(Boolean),
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });
    
    this.connectedUsers = new Map(); // Store user sessions
    this.campaignRooms = new Map(); // Track campaign collaborators
    this.saveIndicators = new Map(); // Track save states
    
    this.setupEventHandlers();
    logger.info('✅ Enhanced WebSocket service initialized');
  }

  /**
   * Setup WebSocket event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info('Client connected', { socketId: socket.id });

      // Store user session
      this.connectedUsers.set(socket.id, {
        socketId: socket.id,
        connectedAt: new Date(),
        currentCampaign: null,
        userId: null
      });

      // Handle user identification
      socket.on('identify', (data) => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          user.userId = data.userId;
          user.userName = data.userName;
          logger.info('User identified', { socketId: socket.id, userId: data.userId });
        }
      });

      // Handle joining campaign room
      socket.on('join-campaign', (data) => {
        this.handleJoinCampaign(socket, data);
      });

      // Handle leaving campaign room
      socket.on('leave-campaign', (data) => {
        this.handleLeaveCampaign(socket, data);
      });

      // Handle campaign design updates
      socket.on('campaign-design-update', (data) => {
        this.handleCampaignDesignUpdate(socket, data);
      });

      // Handle preview updates
      socket.on('preview-updated', (data) => {
        this.handlePreviewUpdated(socket, data);
      });

      // Handle save status updates
      socket.on('save-status', (data) => {
        this.handleSaveStatus(socket, data);
      });

      // Handle collaboration events
      socket.on('cursor-position', (data) => {
        this.handleCursorPosition(socket, data);
      });

      socket.on('selection-changed', (data) => {
        this.handleSelectionChanged(socket, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  /**
   * Handle joining campaign room
   */
  handleJoinCampaign(socket, data) {
    const { campaignId, userId } = data;
    
    // Update user session
    const user = this.connectedUsers.get(socket.id);
    if (user) {
      user.currentCampaign = campaignId;
    }

    // Join the campaign room
    socket.join(`campaign-${campaignId}`);
    
    // Track campaign collaborators
    if (!this.campaignRooms.has(campaignId)) {
      this.campaignRooms.set(campaignId, new Set());
    }
    this.campaignRooms.get(campaignId).add(socket.id);

    // Notify other users in the campaign
    socket.to(`campaign-${campaignId}`).emit('user-joined', {
      userId,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    logger.info('User joined campaign room', { socketId: socket.id, campaignId, userId });
  }

  /**
   * Handle leaving campaign room
   */
  handleLeaveCampaign(socket, data) {
    const { campaignId, userId } = data;
    
    // Update user session
    const user = this.connectedUsers.get(socket.id);
    if (user) {
      user.currentCampaign = null;
    }

    // Leave the campaign room
    socket.leave(`campaign-${campaignId}`);
    
    // Remove from campaign collaborators
    if (this.campaignRooms.has(campaignId)) {
      this.campaignRooms.get(campaignId).delete(socket.id);
      
      // Clean up empty rooms
      if (this.campaignRooms.get(campaignId).size === 0) {
        this.campaignRooms.delete(campaignId);
      }
    }

    // Notify other users in the campaign
    socket.to(`campaign-${campaignId}`).emit('user-left', {
      userId,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    logger.info('User left campaign room', { socketId: socket.id, campaignId, userId });
  }

  /**
   * Handle campaign design updates
   */
  handleCampaignDesignUpdate(socket, data) {
    const { campaignId, design, userId } = data;
    
    // Broadcast to other users in the same campaign
    socket.to(`campaign-${campaignId}`).emit('campaign-design-updated', {
      campaignId,
      design,
      userId,
      timestamp: new Date().toISOString()
    });

    logger.debug('Campaign design update broadcasted', { campaignId, userId });
  }

  /**
   * Handle preview updates
   */
  handlePreviewUpdated(socket, data) {
    const { campaignId, previewUrl, userId } = data;
    
    // Broadcast to other users in the same campaign
    socket.to(`campaign-${campaignId}`).emit('campaign-preview-updated', {
      campaignId,
      previewUrl,
      userId,
      timestamp: new Date().toISOString()
    });

    logger.debug('Preview update broadcasted', { campaignId, previewUrl, userId });
  }

  /**
   * Handle save status updates
   */
  handleSaveStatus(socket, data) {
    const { campaignId, status, message, userId } = data;
    
    // Update save indicator state
    this.saveIndicators.set(campaignId, {
      status,
      message,
      userId,
      timestamp: new Date().toISOString()
    });

    // Broadcast to other users in the same campaign
    socket.to(`campaign-${campaignId}`).emit('save-status-updated', {
      campaignId,
      status,
      message,
      userId,
      timestamp: new Date().toISOString()
    });

    logger.debug('Save status update broadcasted', { campaignId, status, userId });
  }

  /**
   * Handle cursor position updates (for collaboration)
   */
  handleCursorPosition(socket, data) {
    const { campaignId, position, userId } = data;
    
    // Broadcast cursor position to other users
    socket.to(`campaign-${campaignId}`).emit('cursor-moved', {
      userId,
      position,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle selection changes (for collaboration)
   */
  handleSelectionChanged(socket, data) {
    const { campaignId, selection, userId } = data;
    
    // Broadcast selection to other users
    socket.to(`campaign-${campaignId}`).emit('selection-updated', {
      userId,
      selection,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle user disconnect
   */
  handleDisconnect(socket) {
    const user = this.connectedUsers.get(socket.id);
    
    if (user && user.currentCampaign) {
      // Notify campaign room about user leaving
      socket.to(`campaign-${user.currentCampaign}`).emit('user-disconnected', {
        userId: user.userId,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
      
      // Remove from campaign room
      if (this.campaignRooms.has(user.currentCampaign)) {
        this.campaignRooms.get(user.currentCampaign).delete(socket.id);
        
        // Clean up empty rooms
        if (this.campaignRooms.get(user.currentCampaign).size === 0) {
          this.campaignRooms.delete(user.currentCampaign);
        }
      }
    }

    // Remove user session
    this.connectedUsers.delete(socket.id);
    
    logger.info('Client disconnected and cleaned up', { 
      socketId: socket.id,
      userId: user?.userId,
      campaignId: user?.currentCampaign
    });
  }

  /**
   * Broadcast campaign update to all users in campaign room
   */
  broadcastCampaignUpdate(campaignId, data) {
    this.io.to(`campaign-${campaignId}`).emit('campaign-updated', {
      campaignId,
      ...data,
      timestamp: new Date().toISOString()
    });
    
    logger.debug('Campaign update broadcasted', { campaignId, type: data.type });
  }

  /**
   * Broadcast preview update to all users in campaign room
   */
  broadcastPreviewUpdate(campaignId, previewUrl) {
    this.io.to(`campaign-${campaignId}`).emit('preview-updated', {
      campaignId,
      previewUrl,
      timestamp: new Date().toISOString()
    });
    
    logger.debug('Preview update broadcasted', { campaignId, previewUrl });
  }

  /**
   * Broadcast save indicator to all users in campaign room
   */
  broadcastSaveIndicator(campaignId, action, message = '', type = 'info') {
    this.io.to(`campaign-${campaignId}`).emit('save-indicator', {
      action, // 'show' or 'hide'
      message,
      type,
      campaignId,
      timestamp: new Date().toISOString()
    });
    
    logger.debug('Save indicator broadcasted', { campaignId, action, message });
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount() {
    return this.io.engine.clientsCount;
  }

  /**
   * Get campaign collaborators
   */
  getCampaignCollaborators(campaignId) {
    const collaborators = this.campaignRooms.get(campaignId) || new Set();
    return Array.from(collaborators).map(socketId => {
      const user = this.connectedUsers.get(socketId);
      return {
        socketId,
        userId: user?.userId,
        userName: user?.userName,
        connectedAt: user?.connectedAt
      };
    });
  }

  /**
   * Get all active campaigns
   */
  getActiveCampaigns() {
    return Array.from(this.campaignRooms.keys()).map(campaignId => ({
      campaignId,
      collaborators: this.getCampaignCollaborators(campaignId),
      saveStatus: this.saveIndicators.get(campaignId)
    }));
  }

  /**
   * Broadcast to all clients
   */
  broadcast(event, data) {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send to specific client
   */
  sendToClient(socketId, event, data) {
    this.io.to(socketId).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      activeCampaigns: this.campaignRooms.size,
      totalRoomConnections: Array.from(this.campaignRooms.values())
        .reduce((sum, room) => sum + room.size, 0),
      pendingSaveIndicators: this.saveIndicators.size
    };
  }

  /**
   * Cleanup and close service
   */
  async close() {
    // Notify all users about service shutdown
    this.broadcast('service-shutdown', {
      message: 'Service is shutting down, please save your work'
    });

    // Close all connections
    this.io.close();
    
    // Clear all data structures
    this.connectedUsers.clear();
    this.campaignRooms.clear();
    this.saveIndicators.clear();
    
    logger.info('WebSocket service closed');
  }
}

module.exports = WebSocketService;
