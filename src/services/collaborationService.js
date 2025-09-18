const EventEmitter = require('events');
const logger = require('../utils/logger');

class CollaborationService extends EventEmitter {
  constructor() {
    super();
    this.activeSessions = new Map(); // templateId -> Set of userIds
    this.userSessions = new Map(); // userId -> Set of templateIds
    this.cursors = new Map(); // templateId -> Map of userId -> cursor position
    this.changes = new Map(); // templateId -> Array of changes
    this.locks = new Map(); // templateId -> Map of field -> userId
  }

  /**
   * Join a template collaboration session
   * @param {string} templateId - Template ID
   * @param {string} userId - User ID
   * @param {Object} userInfo - User information
   * @returns {Object} - Session information
   */
  joinSession(templateId, userId, userInfo) {
    try {
      // Initialize template session if not exists
      if (!this.activeSessions.has(templateId)) {
        this.activeSessions.set(templateId, new Set());
        this.cursors.set(templateId, new Map());
        this.changes.set(templateId, []);
        this.locks.set(templateId, new Map());
      }

      // Add user to template session
      this.activeSessions.get(templateId).add(userId);
      
      // Add template to user sessions
      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, new Set());
      }
      this.userSessions.get(userId).add(templateId);

      // Initialize user cursor
      this.cursors.get(templateId).set(userId, {
        position: { x: 0, y: 0 },
        field: null,
        timestamp: Date.now()
      });

      const sessionInfo = {
        templateId,
        userId,
        userInfo,
        activeUsers: Array.from(this.activeSessions.get(templateId)).map(id => ({
          id,
          ...userInfo
        })),
        joinedAt: new Date().toISOString()
      };

      // Emit join event
      this.emit('userJoined', sessionInfo);

      logger.info('User joined collaboration session:', {
        templateId,
        userId,
        activeUsers: this.activeSessions.get(templateId).size
      });

      return sessionInfo;
    } catch (error) {
      logger.error('Failed to join collaboration session:', error);
      throw error;
    }
  }

  /**
   * Leave a template collaboration session
   * @param {string} templateId - Template ID
   * @param {string} userId - User ID
   * @returns {Object} - Leave confirmation
   */
  leaveSession(templateId, userId) {
    try {
      // Remove user from template session
      if (this.activeSessions.has(templateId)) {
        this.activeSessions.get(templateId).delete(userId);
        
        // Remove template if no active users
        if (this.activeSessions.get(templateId).size === 0) {
          this.activeSessions.delete(templateId);
          this.cursors.delete(templateId);
          this.changes.delete(templateId);
          this.locks.delete(templateId);
        } else {
          // Remove user cursor
          this.cursors.get(templateId).delete(userId);
          
          // Release any locks held by user
          this.releaseUserLocks(templateId, userId);
        }
      }

      // Remove template from user sessions
      if (this.userSessions.has(userId)) {
        this.userSessions.get(userId).delete(templateId);
        
        // Remove user if no active sessions
        if (this.userSessions.get(userId).size === 0) {
          this.userSessions.delete(userId);
        }
      }

      const leaveInfo = {
        templateId,
        userId,
        activeUsers: this.activeSessions.has(templateId) 
          ? Array.from(this.activeSessions.get(templateId))
          : [],
        leftAt: new Date().toISOString()
      };

      // Emit leave event
      this.emit('userLeft', leaveInfo);

      logger.info('User left collaboration session:', {
        templateId,
        userId,
        activeUsers: this.activeSessions.has(templateId) 
          ? this.activeSessions.get(templateId).size 
          : 0
      });

      return leaveInfo;
    } catch (error) {
      logger.error('Failed to leave collaboration session:', error);
      throw error;
    }
  }

  /**
   * Update user cursor position
   * @param {string} templateId - Template ID
   * @param {string} userId - User ID
   * @param {Object} cursor - Cursor position
   * @returns {Object} - Updated cursor info
   */
  updateCursor(templateId, userId, cursor) {
    try {
      if (!this.activeSessions.has(templateId) || 
          !this.activeSessions.get(templateId).has(userId)) {
        throw new Error('User not in collaboration session');
      }

      const cursorInfo = {
        userId,
        position: cursor.position,
        field: cursor.field,
        timestamp: Date.now()
      };

      this.cursors.get(templateId).set(userId, cursorInfo);

      // Emit cursor update event
      this.emit('cursorUpdated', {
        templateId,
        cursor: cursorInfo
      });

      return cursorInfo;
    } catch (error) {
      logger.error('Failed to update cursor:', error);
      throw error;
    }
  }

  /**
   * Get active cursors for a template
   * @param {string} templateId - Template ID
   * @returns {Array} - Active cursors
   */
  getActiveCursors(templateId) {
    if (!this.cursors.has(templateId)) {
      return [];
    }

    const cursors = Array.from(this.cursors.get(templateId).values());
    return cursors.filter(cursor => {
      // Filter out cursors older than 30 seconds
      return Date.now() - cursor.timestamp < 30000;
    });
  }

  /**
   * Apply a change to a template
   * @param {string} templateId - Template ID
   * @param {string} userId - User ID
   * @param {Object} change - Change object
   * @returns {Object} - Applied change
   */
  applyChange(templateId, userId, change) {
    try {
      if (!this.activeSessions.has(templateId) || 
          !this.activeSessions.get(templateId).has(userId)) {
        throw new Error('User not in collaboration session');
      }

      const changeInfo = {
        id: `${Date.now()}-${userId}`,
        templateId,
        userId,
        type: change.type, // 'add', 'update', 'delete', 'move'
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        timestamp: Date.now(),
        applied: true
      };

      // Store change
      this.changes.get(templateId).push(changeInfo);

      // Keep only last 100 changes per template
      const changes = this.changes.get(templateId);
      if (changes.length > 100) {
        changes.splice(0, changes.length - 100);
      }

      // Emit change event
      this.emit('changeApplied', changeInfo);

      logger.info('Change applied to template:', {
        templateId,
        userId,
        changeType: change.type,
        field: change.field
      });

      return changeInfo;
    } catch (error) {
      logger.error('Failed to apply change:', error);
      throw error;
    }
  }

  /**
   * Get recent changes for a template
   * @param {string} templateId - Template ID
   * @param {number} limit - Number of changes to return
   * @returns {Array} - Recent changes
   */
  getRecentChanges(templateId, limit = 50) {
    if (!this.changes.has(templateId)) {
      return [];
    }

    const changes = this.changes.get(templateId);
    return changes.slice(-limit).reverse();
  }

  /**
   * Lock a field for editing
   * @param {string} templateId - Template ID
   * @param {string} userId - User ID
   * @param {string} field - Field to lock
   * @returns {Object} - Lock information
   */
  lockField(templateId, userId, field) {
    try {
      if (!this.activeSessions.has(templateId) || 
          !this.activeSessions.get(templateId).has(userId)) {
        throw new Error('User not in collaboration session');
      }

      const locks = this.locks.get(templateId);
      
      // Check if field is already locked by another user
      if (locks.has(field) && locks.get(field) !== userId) {
        throw new Error('Field is locked by another user');
      }

      // Lock the field
      locks.set(field, userId);

      const lockInfo = {
        templateId,
        userId,
        field,
        lockedAt: new Date().toISOString()
      };

      // Emit lock event
      this.emit('fieldLocked', lockInfo);

      logger.info('Field locked for editing:', {
        templateId,
        userId,
        field
      });

      return lockInfo;
    } catch (error) {
      logger.error('Failed to lock field:', error);
      throw error;
    }
  }

  /**
   * Unlock a field
   * @param {string} templateId - Template ID
   * @param {string} userId - User ID
   * @param {string} field - Field to unlock
   * @returns {Object} - Unlock information
   */
  unlockField(templateId, userId, field) {
    try {
      if (!this.activeSessions.has(templateId) || 
          !this.activeSessions.get(templateId).has(userId)) {
        throw new Error('User not in collaboration session');
      }

      const locks = this.locks.get(templateId);
      
      // Check if user owns the lock
      if (locks.has(field) && locks.get(field) !== userId) {
        throw new Error('User does not own the field lock');
      }

      // Unlock the field
      locks.delete(field);

      const unlockInfo = {
        templateId,
        userId,
        field,
        unlockedAt: new Date().toISOString()
      };

      // Emit unlock event
      this.emit('fieldUnlocked', unlockInfo);

      logger.info('Field unlocked:', {
        templateId,
        userId,
        field
      });

      return unlockInfo;
    } catch (error) {
      logger.error('Failed to unlock field:', error);
      throw error;
    }
  }

  /**
   * Release all locks held by a user
   * @param {string} templateId - Template ID
   * @param {string} userId - User ID
   * @returns {Array} - Released locks
   */
  releaseUserLocks(templateId, userId) {
    const locks = this.locks.get(templateId);
    const releasedLocks = [];

    for (const [field, lockUserId] of locks.entries()) {
      if (lockUserId === userId) {
        locks.delete(field);
        releasedLocks.push(field);
        
        this.emit('fieldUnlocked', {
          templateId,
          userId,
          field,
          unlockedAt: new Date().toISOString()
        });
      }
    }

    return releasedLocks;
  }

  /**
   * Get locked fields for a template
   * @param {string} templateId - Template ID
   * @returns {Object} - Locked fields
   */
  getLockedFields(templateId) {
    if (!this.locks.has(templateId)) {
      return {};
    }

    const locks = this.locks.get(templateId);
    const lockedFields = {};

    for (const [field, userId] of locks.entries()) {
      lockedFields[field] = userId;
    }

    return lockedFields;
  }

  /**
   * Get active users for a template
   * @param {string} templateId - Template ID
   * @returns {Array} - Active users
   */
  getActiveUsers(templateId) {
    if (!this.activeSessions.has(templateId)) {
      return [];
    }

    return Array.from(this.activeSessions.get(templateId));
  }

  /**
   * Get user's active sessions
   * @param {string} userId - User ID
   * @returns {Array} - Active template sessions
   */
  getUserSessions(userId) {
    if (!this.userSessions.has(userId)) {
      return [];
    }

    return Array.from(this.userSessions.get(userId));
  }

  /**
   * Get collaboration status for a template
   * @param {string} templateId - Template ID
   * @returns {Object} - Collaboration status
   */
  getCollaborationStatus(templateId) {
    return {
      templateId,
      activeUsers: this.getActiveUsers(templateId),
      activeCursors: this.getActiveCursors(templateId),
      lockedFields: this.getLockedFields(templateId),
      recentChanges: this.getRecentChanges(templateId, 10),
      isActive: this.activeSessions.has(templateId)
    };
  }

  /**
   * Clean up inactive sessions
   * @param {number} timeout - Timeout in milliseconds (default: 5 minutes)
   * @returns {number} - Number of sessions cleaned up
   */
  cleanupInactiveSessions(timeout = 5 * 60 * 1000) {
    let cleanedCount = 0;
    const now = Date.now();

    // Clean up inactive cursors
    for (const [templateId, cursors] of this.cursors.entries()) {
      for (const [userId, cursor] of cursors.entries()) {
        if (now - cursor.timestamp > timeout) {
          cursors.delete(userId);
          cleanedCount++;
        }
      }
    }

    // Clean up sessions with no active users
    for (const [templateId, users] of this.activeSessions.entries()) {
      if (users.size === 0) {
        this.activeSessions.delete(templateId);
        this.cursors.delete(templateId);
        this.changes.delete(templateId);
        this.locks.delete(templateId);
        cleanedCount++;
      }
    }

    logger.info('Cleaned up inactive collaboration sessions:', {
      cleanedCount
    });

    return cleanedCount;
  }
}

module.exports = CollaborationService;
