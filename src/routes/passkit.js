const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const PassSigner = require('../services/passSigner');
const logger = require('../utils/logger');

const passSigner = new PassSigner();

/**
 * Apple PassKit Web Service API
 * These endpoints are required for pass updates and device registration
 * Reference: https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/PassKit_PG/Updating.html
 */

/**
 * GET /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}
 * Get the serial numbers for passes associated with a device
 */
router.get('/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier', async (req, res) => {
  try {
    const { deviceLibraryIdentifier, passTypeIdentifier } = req.params;
    const { passesUpdatedSince } = req.query;

    logger.info('Device requesting pass registrations', {
      deviceLibraryIdentifier,
      passTypeIdentifier,
      passesUpdatedSince
    });

    // Get passes for this device
    let query_text = `
      SELECT DISTINCT p.serial_number, p.updated_at
      FROM passes p
      JOIN device_registrations dr ON p.serial_number = dr.serial_number
      WHERE dr.device_library_identifier = $1 
      AND dr.pass_type_identifier = $2
    `;
    
    const params = [deviceLibraryIdentifier, passTypeIdentifier];
    
    // Filter by update time if provided
    if (passesUpdatedSince) {
      query_text += ' AND p.updated_at > $3';
      params.push(new Date(parseInt(passesUpdatedSince) * 1000));
    }

    const result = await query(query_text, params);
    
    if (result.rows.length === 0) {
      return res.status(204).send(); // No passes
    }

    const serialNumbers = result.rows.map(row => row.serial_number);
    const lastUpdated = Math.max(...result.rows.map(row => 
      Math.floor(new Date(row.updated_at).getTime() / 1000)
    ));

    res.json({
      serialNumbers,
      lastUpdated: lastUpdated.toString()
    });

  } catch (error) {
    logger.error('Failed to get device registrations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
 * Register a device to receive push notifications for a pass
 */
router.post('/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber', async (req, res) => {
  try {
    const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = req.params;
    const { pushToken } = req.body;
    const authToken = req.headers.authorization;

    logger.info('Device registering for pass updates', {
      deviceLibraryIdentifier,
      passTypeIdentifier,
      serialNumber,
      authToken: authToken ? authToken.substring(0, 20) + '...' : 'none'
    });

    // Verify the pass exists and auth token is valid
    const passResult = await query(
      'SELECT * FROM passes WHERE serial_number = $1',
      [serialNumber]
    );

    if (passResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pass not found' });
    }

    // TODO: Verify auth token matches pass
    // For now, we'll accept all registrations

    // Register or update device
    await query(`
      INSERT INTO device_registrations (
        device_library_identifier, 
        pass_type_identifier, 
        serial_number, 
        push_token,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (device_library_identifier, pass_type_identifier, serial_number)
      DO UPDATE SET 
        push_token = $4,
        updated_at = NOW()
    `, [deviceLibraryIdentifier, passTypeIdentifier, serialNumber, pushToken]);

    logger.info('Device registered successfully', {
      deviceLibraryIdentifier,
      serialNumber
    });

    res.status(201).send(); // Registration successful

  } catch (error) {
    logger.error('Failed to register device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /v1/passes/{passTypeIdentifier}/{serialNumber}
 * Get the latest version of a pass
 */
router.get('/v1/passes/:passTypeIdentifier/:serialNumber', async (req, res) => {
  try {
    const { passTypeIdentifier, serialNumber } = req.params;
    const authToken = req.headers.authorization;
    const ifModifiedSince = req.headers['if-modified-since'];

    logger.info('Device requesting pass update', {
      passTypeIdentifier,
      serialNumber,
      authToken: authToken ? authToken.substring(0, 20) + '...' : 'none',
      ifModifiedSince
    });

    // Get pass data from database
    const passResult = await query(`
      SELECT p.*, c.name as campaign_name, c.design, c.settings
      FROM passes p
      JOIN campaigns c ON p.campaign_id = c.id
      WHERE p.serial_number = $1
    `, [serialNumber]);

    if (passResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pass not found' });
    }

    const passData = passResult.rows[0];

    // Check if pass has been modified since last request
    if (ifModifiedSince) {
      const modifiedSince = new Date(ifModifiedSince);
      const lastModified = new Date(passData.updated_at);
      
      if (lastModified <= modifiedSince) {
        return res.status(304).send(); // Not modified
      }
    }

    // TODO: Verify auth token matches pass
    // For now, we'll serve all passes

    // Generate updated pass
    const passConfig = {
      campaignId: passData.campaign_id,
      campaignName: passData.campaign_name,
      serialNumber: passData.serial_number,
      customerEmail: passData.customer_email,
      stampsEarned: passData.stamps_earned,
      stampsRequired: passData.stamps_required,
      ...passData.settings,
      ...passData.design
    };

    const pkpassBuffer = await passSigner.generatePass(passConfig);

    // Set headers
    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Last-Modified', new Date(passData.updated_at).toUTCString());
    
    res.send(pkpassBuffer);

    logger.info('Pass update served successfully', {
      serialNumber,
      bufferSize: pkpassBuffer.length
    });

  } catch (error) {
    logger.error('Failed to serve pass update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
 * Unregister a device from receiving push notifications for a pass
 */
router.delete('/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber', async (req, res) => {
  try {
    const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = req.params;
    const authToken = req.headers.authorization;

    logger.info('Device unregistering from pass updates', {
      deviceLibraryIdentifier,
      passTypeIdentifier,
      serialNumber,
      authToken: authToken ? authToken.substring(0, 20) + '...' : 'none'
    });

    // TODO: Verify auth token
    
    // Remove registration
    const result = await query(`
      DELETE FROM device_registrations 
      WHERE device_library_identifier = $1 
      AND pass_type_identifier = $2 
      AND serial_number = $3
    `, [deviceLibraryIdentifier, passTypeIdentifier, serialNumber]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    logger.info('Device unregistered successfully', {
      deviceLibraryIdentifier,
      serialNumber
    });

    res.status(200).send(); // Unregistration successful

  } catch (error) {
    logger.error('Failed to unregister device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /v1/log
 * Log messages from devices (for debugging)
 */
router.post('/v1/log', (req, res) => {
  try {
    const { logs } = req.body;
    
    if (logs && Array.isArray(logs)) {
      logs.forEach(logEntry => {
        logger.info('Device log entry', {
          source: 'device',
          ...logEntry
        });
      });
    }

    res.status(200).send();

  } catch (error) {
    logger.error('Failed to process device logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
