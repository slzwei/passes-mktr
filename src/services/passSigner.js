const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const forge = require('node-forge');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const ImageProcessor = require('./imageProcessor');
const StampGenerator = require('./stampGenerator');
const PassConfigService = require('./passConfigService');

class PassSigner {
  constructor() {
    this.teamId = process.env.APPLE_TEAM_ID;
    this.passTypeId = process.env.PASS_TYPE_ID;
    this.certPath = process.env.APPLE_CERT_PATH;
    this.certPassword = process.env.APPLE_CERT_PASSWORD;
    this.imageProcessor = new ImageProcessor();
    this.stampGenerator = new StampGenerator();
    this.configService = new PassConfigService();
    
    if (!this.teamId || !this.passTypeId || !this.certPath || !this.certPassword) {
      throw new Error('Missing required Apple certificate configuration');
    }
  }

  /**
   * Generate a complete .pkpass file
   */
  async generatePass(passData) {
    try {
      const passId = uuidv4();
      const tempDir = path.join(process.cwd(), 'temp', passId);
      
      // Create temporary directory
      await fs.promises.mkdir(tempDir, { recursive: true });

      // Generate pass.json
      const passJson = this.generatePassJson(passData);
      await fs.promises.writeFile(
        path.join(tempDir, 'pass.json'),
        JSON.stringify(passJson, null, 2)
      );

      // Check if stamps are needed
      const { stampsRequired = 10 } = passData;
      const includeStrips = stampsRequired > 0;

      // Process and add images
      await this.addImagesToPass(tempDir, includeStrips);

      // Generate and add stamps
      await this.addStampsToPass(tempDir, passData);

      // Generate manifest.json
      const manifest = await this.generateManifest(tempDir);
      await fs.promises.writeFile(
        path.join(tempDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      // Generate signature
      const signature = await this.generateSignature(manifest);
      await fs.promises.writeFile(
        path.join(tempDir, 'signature'),
        signature
      );

      // Create .pkpass file
      const pkpassPath = await this.createPkpassFile(tempDir, passId);

      // Cleanup temp directory
      await fs.promises.rmdir(tempDir, { recursive: true });

      logger.logPassOperation('pass_generated', {
        passId,
        serialNumber: passJson.serialNumber,
        campaignId: passData.campaignId
      });

      return pkpassPath;
    } catch (error) {
      logger.error('Pass generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate pass.json content
   */
  generatePassJson(passData, customConfig = null) {
    const {
      campaignId,
      partnerId,
      serialNumber,
      customerEmail,
      customerName,
      stampsEarned = 0,
      stampsRequired = 10,
      campaignName,
      tenantName,
      colors = {},
      images = {}
    } = passData;

    // Get field configuration (use custom config if provided, otherwise use default loyalty card config)
    const fieldConfig = customConfig || this.configService.getLoyaltyCardConfig(passData);
    
    // Merge colors with field config colors
    const finalColors = { ...fieldConfig.colors, ...colors };

    return {
      formatVersion: 1,
      passTypeIdentifier: this.passTypeId,
      serialNumber: serialNumber || uuidv4(),
      teamIdentifier: this.teamId,
      organizationName: tenantName || 'MKTR',
      description: `${campaignName} Loyalty Card`,
      logoText: campaignName,
      foregroundColor: finalColors.foreground,
      backgroundColor: finalColors.background,
      labelColor: finalColors.label,
      headerFields: fieldConfig.fields.header,
      storeCard: {
        primaryFields: fieldConfig.fields.primary,
        secondaryFields: fieldConfig.fields.secondary,
        auxiliaryFields: fieldConfig.fields.auxiliary,
        backFields: fieldConfig.fields.back
      },
      barcode: {
        message: `PASS_ID:${uuidv4()}:CAMPAIGN_ID:${campaignId}:PARTNER_ID:${partnerId || 'default'}`,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
        altText: 'Loyalty Card QR Code'
      }
    };
  }

  /**
   * Generate manifest.json with SHA-1 hashes
   */
  async generateManifest(tempDir) {
    const manifest = {};
    const files = await fs.promises.readdir(tempDir);

    for (const file of files) {
      if (file !== 'manifest.json' && file !== 'signature') {
        const filePath = path.join(tempDir, file);
        const content = await fs.promises.readFile(filePath);
        const hash = crypto.createHash('sha1').update(content).digest('hex');
        manifest[file] = hash;
      }
    }

    return manifest;
  }

  /**
   * Generate PKCS#7 detached signature
   */
  async generateSignature(manifest) {
    try {
      // Read certificate
      const certBuffer = await fs.promises.readFile(this.certPath);
      
      // Convert P12 to PEM
      const p12Asn1 = forge.asn1.fromDer(certBuffer.toString('binary'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, this.certPassword);
      
      // Get private key and certificate
      const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
      const privateKey = keyBag.key;

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag][0];
      const certificate = certBag.cert;

      // Create manifest content
      const manifestContent = JSON.stringify(manifest, null, 2);
      
      // Create PKCS#7 signature
      const p7 = forge.pkcs7.createSignedData();
      p7.content = forge.util.createBuffer(manifestContent, 'utf8');
      p7.addCertificate(certificate);
      p7.addSigner({
        key: privateKey,
        certificate: certificate,
        digestAlgorithm: forge.pki.oids.sha1,
        authenticatedAttributes: [
          {
            type: forge.pki.oids.contentType,
            value: forge.pki.oids.data
          },
          {
            type: forge.pki.oids.messageDigest
          },
          {
            type: forge.pki.oids.signingTime,
            value: new Date()
          }
        ]
      });

      p7.sign({ detached: true });
      const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
      
      return Buffer.from(der, 'binary');
    } catch (error) {
      logger.error('Signature generation failed:', error);
      throw new Error('Failed to generate pass signature');
    }
  }

  /**
   * Create .pkpass ZIP file
   */
  async createPkpassFile(tempDir, passId) {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip();
    
    // Add all files to ZIP
    const files = await fs.promises.readdir(tempDir);
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const content = await fs.promises.readFile(filePath);
      zip.addFile(file, content);
    }

    // Save as .pkpass file
    const outputPath = path.join(process.cwd(), 'storage', 'passes', `${passId}.pkpass`);
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    
    zip.writeZip(outputPath);
    
    return outputPath;
  }

  /**
   * Add processed images to pass directory
   */
  async addImagesToPass(tempDir, includeStrips = true) {
    try {
      // Process images and get paths
      const imagePaths = await this.imageProcessor.getProcessedImagePaths(includeStrips);
      
      // Copy processed images to pass directory
      await this.imageProcessor.copyImagesToPassDir(tempDir, imagePaths);
      
      if (!includeStrips) {
        logger.info('Skipping strip images for clean pass');
      }
      
      // Skip coffee bean texture for clean passes
      logger.info('Skipping coffee bean texture for clean pass');
      
      logger.info('Images added to pass successfully');
    } catch (error) {
      logger.error('Failed to add images to pass:', error);
      // Continue without images - will use defaults
    }
  }

  /**
   * Add stamps to pass directory
   */
  async addStampsToPass(tempDir, passData) {
    try {
      const { stampsEarned = 0, stampsRequired = 10 } = passData;
      
      // Skip stamp generation if no stamps required
      if (stampsRequired === 0) {
        logger.info('No stamps required - skipping stamp generation');
        return;
      }
      
      // Check if we have SVG stamp strip
      const svgStampStripPath = path.join(process.cwd(), 'storage', 'images', 'stamps', `svg_stamp_strip_${stampsEarned}_${stampsRequired}.png`);
      const svgStampStrip2xPath = path.join(process.cwd(), 'storage', 'images', 'stamps', `svg_stamp_strip_${stampsEarned}_${stampsRequired}@2x.png`);
      
      if (fs.existsSync(svgStampStripPath) && fs.existsSync(svgStampStrip2xPath)) {
        // Use SVG stamp strip
        const stripDest = path.join(tempDir, 'strip.png');
        const strip2xDest = path.join(tempDir, 'strip@2x.png');
        
        await fs.promises.copyFile(svgStampStripPath, stripDest);
        await fs.promises.copyFile(svgStampStrip2xPath, strip2xDest);
        
        logger.info(`SVG stamp strip added to pass: ${stampsEarned}/${stampsRequired} redeemed`);
        return;
      }
      
      // Check if we have taller strip Hi icon stamps
      const tallerStripHiStampsPath = path.join(process.cwd(), 'storage', 'images', 'stamps', `taller_strip_hi_stamps_${stampsEarned}_${stampsRequired}.png`);
      
      if (fs.existsSync(tallerStripHiStampsPath)) {
        // Use taller strip Hi icon stamps
        const stripDest = path.join(tempDir, 'strip.png');
        const strip2xDest = path.join(tempDir, 'strip@2x.png');
        
        await fs.promises.copyFile(tallerStripHiStampsPath, stripDest);
        await fs.promises.copyFile(tallerStripHiStampsPath, strip2xDest);
        
        logger.info(`Taller strip Hi icon stamps added to pass: ${stampsEarned}/${stampsRequired} redeemed`);
        return;
      }
      
      // Check if we have large Hi icon stamps
      const largeHiStampsPath = path.join(process.cwd(), 'storage', 'images', 'stamps', `large_hi_stamps_${stampsEarned}_${stampsRequired}.png`);
      
      if (fs.existsSync(largeHiStampsPath)) {
        // Use large Hi icon stamps
        const stripDest = path.join(tempDir, 'strip.png');
        const strip2xDest = path.join(tempDir, 'strip@2x.png');
        
        await fs.promises.copyFile(largeHiStampsPath, stripDest);
        await fs.promises.copyFile(largeHiStampsPath, strip2xDest);
        
        logger.info(`Large Hi icon stamps added to pass: ${stampsEarned}/${stampsRequired} redeemed`);
        return;
      }
      
      // Check if we have Hi icon stamps
      const hiIconStampsPath = path.join(process.cwd(), 'storage', 'images', 'stamps', `hi_icon_stamps_${stampsEarned}_${stampsRequired}.png`);
      
      if (fs.existsSync(hiIconStampsPath)) {
        // Use Hi icon stamps
        const stripDest = path.join(tempDir, 'strip.png');
        const strip2xDest = path.join(tempDir, 'strip@2x.png');
        
        await fs.promises.copyFile(hiIconStampsPath, stripDest);
        await fs.promises.copyFile(hiIconStampsPath, strip2xDest);
        
        logger.info(`Hi icon stamps added to pass: ${stampsEarned}/${stampsRequired} redeemed`);
        return;
      }
      
      // Check if we have centered wider strip
      const centeredWiderStripPath = path.join(process.cwd(), 'storage', 'images', 'stamps', `centered_wider_strip_${stampsEarned}_${stampsRequired}.png`);
      
      if (fs.existsSync(centeredWiderStripPath)) {
        // Use centered wider strip
        const stripDest = path.join(tempDir, 'strip.png');
        const strip2xDest = path.join(tempDir, 'strip@2x.png');
        
        await fs.promises.copyFile(centeredWiderStripPath, stripDest);
        await fs.promises.copyFile(centeredWiderStripPath, strip2xDest);
        
        logger.info(`Centered wider strip added to pass: ${stampsEarned}/${stampsRequired} redeemed`);
        return;
      }
      
      // Check if we have full width stamps
      const fullWidthStampsPath = path.join(process.cwd(), 'storage', 'images', 'stamps', `full_width_stamps_${stampsEarned}_${stampsRequired}.png`);
      
      if (fs.existsSync(fullWidthStampsPath)) {
        // Use full width stamps
        const stripDest = path.join(tempDir, 'strip.png');
        const strip2xDest = path.join(tempDir, 'strip@2x.png');
        
        await fs.promises.copyFile(fullWidthStampsPath, stripDest);
        await fs.promises.copyFile(fullWidthStampsPath, strip2xDest);
        
        logger.info(`Full width stamps added to pass: ${stampsEarned}/${stampsRequired} redeemed`);
        return;
      }
      
      // Check if we have a pizza card layout
      const pizzaCardPath = path.join(process.cwd(), 'storage', 'images', 'stamps', `pizza_card_${stampsEarned}_${stampsRequired}.png`);
      
      if (fs.existsSync(pizzaCardPath)) {
        // Use pizza card layout
        const stripDest = path.join(tempDir, 'strip.png');
        const strip2xDest = path.join(tempDir, 'strip@2x.png');
        
        await fs.promises.copyFile(pizzaCardPath, stripDest);
        await fs.promises.copyFile(pizzaCardPath, strip2xDest);
        
        logger.info(`Pizza card layout added to pass: ${stampsEarned}/${stampsRequired} redeemed`);
        return;
      }
      
      // Check if we have a taller strip container
      const tallerStripPath = path.join(process.cwd(), 'storage', 'images', 'stamps', `taller_strip_${stampsEarned}_${stampsRequired}.png`);
      
      if (fs.existsSync(tallerStripPath)) {
        // Use taller strip container
        const stripDest = path.join(tempDir, 'strip.png');
        const strip2xDest = path.join(tempDir, 'strip@2x.png');
        
        await fs.promises.copyFile(tallerStripPath, stripDest);
        await fs.promises.copyFile(tallerStripPath, strip2xDest);
        
        logger.info(`Taller strip container added to pass: ${stampsEarned}/${stampsRequired} redeemed`);
        return;
      }
      
      // Check if we have a taller spacer grid
      const tallerSpacerGridPath = path.join(process.cwd(), 'storage', 'images', 'stamps', `taller_spacer_${stampsEarned}_${stampsRequired}.png`);
      
      if (fs.existsSync(tallerSpacerGridPath)) {
        // Use taller spacer grid
        const stripDest = path.join(tempDir, 'strip.png');
        const strip2xDest = path.join(tempDir, 'strip@2x.png');
        
        await fs.promises.copyFile(tallerSpacerGridPath, stripDest);
        await fs.promises.copyFile(tallerSpacerGridPath, strip2xDest);
        
        logger.info(`Taller spacer grid added to pass: ${stampsEarned}/${stampsRequired} redeemed`);
        return;
      }
      
      // Check if we have a stamps with spacer grid
      const spacerGridPath = path.join(process.cwd(), 'storage', 'images', 'stamps', `stamps_with_spacer_${stampsEarned}_${stampsRequired}.png`);
      
      if (fs.existsSync(spacerGridPath)) {
        // Use stamps with spacer grid
        const stripDest = path.join(tempDir, 'strip.png');
        const strip2xDest = path.join(tempDir, 'strip@2x.png');
        
        await fs.promises.copyFile(spacerGridPath, stripDest);
        await fs.promises.copyFile(spacerGridPath, strip2xDest);
        
        logger.info(`Stamps with spacer grid added to pass: ${stampsEarned}/${stampsRequired} redeemed`);
        return;
      }
      
      // Check if we have an edge-to-edge grid
      const edgeToEdgeGridPath = path.join(process.cwd(), 'storage', 'images', 'stamps', `edge_to_edge_${stampsEarned}_${stampsRequired}.png`);
      
      if (fs.existsSync(edgeToEdgeGridPath)) {
        // Use edge-to-edge grid
        const stripDest = path.join(tempDir, 'strip.png');
        const strip2xDest = path.join(tempDir, 'strip@2x.png');
        
        await fs.promises.copyFile(edgeToEdgeGridPath, stripDest);
        await fs.promises.copyFile(edgeToEdgeGridPath, strip2xDest);
        
        logger.info(`Edge-to-edge grid added to pass: ${stampsEarned}/${stampsRequired} redeemed`);
        return;
      }
      
      // Check if we have a stamps-only grid
      const stampsOnlyGridPath = path.join(process.cwd(), 'storage', 'images', 'stamps', `stamps_only_${stampsEarned}_${stampsRequired}.png`);
      
      if (fs.existsSync(stampsOnlyGridPath)) {
        // Use stamps-only grid
        const stripDest = path.join(tempDir, 'strip.png');
        const strip2xDest = path.join(tempDir, 'strip@2x.png');
        
        await fs.promises.copyFile(stampsOnlyGridPath, stripDest);
        await fs.promises.copyFile(stampsOnlyGridPath, strip2xDest);
        
        logger.info(`Stamps-only grid added to pass: ${stampsEarned}/${stampsRequired} redeemed`);
        return;
      }
      
      // Check if we have a minimal stamp grid
      const minimalGridPath = path.join(process.cwd(), 'storage', 'images', 'stamps', `minimal_stamp_grid_${stampsEarned}_${stampsRequired}.png`);
      
      if (fs.existsSync(minimalGridPath)) {
        // Use minimal stamp grid
        const stripDest = path.join(tempDir, 'strip.png');
        const strip2xDest = path.join(tempDir, 'strip@2x.png');
        
        await fs.promises.copyFile(minimalGridPath, stripDest);
        await fs.promises.copyFile(minimalGridPath, strip2xDest);
        
        logger.info(`Minimal stamp grid added to pass: ${stampsEarned}/${stampsRequired} redeemed`);
        return;
      }
      
      // Check if we have a simple stamp grid
      const simpleGridPath = path.join(process.cwd(), 'storage', 'images', 'stamps', `simple_stamp_grid_${stampsEarned}_${stampsRequired}.png`);
      
      if (fs.existsSync(simpleGridPath)) {
        // Use simple stamp grid
        const stripDest = path.join(tempDir, 'strip.png');
        const strip2xDest = path.join(tempDir, 'strip@2x.png');
        
        await fs.promises.copyFile(simpleGridPath, stripDest);
        await fs.promises.copyFile(simpleGridPath, strip2xDest);
        
        logger.info(`Simple stamp grid added to pass: ${stampsEarned}/${stampsRequired} redeemed`);
        return;
      }
      
      // Check if we have a clean stamp grid
      const cleanGridPath = path.join(process.cwd(), 'storage', 'images', 'stamps', `clean_stamp_grid_${stampsEarned}_${stampsRequired}.png`);
      
      if (fs.existsSync(cleanGridPath)) {
        // Use clean stamp grid
        const stripDest = path.join(tempDir, 'strip.png');
        const strip2xDest = path.join(tempDir, 'strip@2x.png');
        
        await fs.promises.copyFile(cleanGridPath, stripDest);
        await fs.promises.copyFile(cleanGridPath, strip2xDest);
        
        logger.info(`Clean stamp grid added to pass: ${stampsEarned}/${stampsRequired} redeemed`);
        return;
      }
      
      // Check if we have a "Hi" logo stamp grid (fallback)
      const hiGridPath = path.join(process.cwd(), 'storage', 'images', 'stamps', `hi_stamp_grid_${stampsEarned}_${stampsRequired}.png`);
      
      if (fs.existsSync(hiGridPath)) {
        // Use "Hi" logo stamp grid
        const stripDest = path.join(tempDir, 'strip.png');
        const strip2xDest = path.join(tempDir, 'strip@2x.png');
        
        await fs.promises.copyFile(hiGridPath, stripDest);
        await fs.promises.copyFile(hiGridPath, strip2xDest);
        
        logger.info(`"Hi" logo stamp grid added to pass: ${stampsEarned}/${stampsRequired} redeemed`);
        return;
      }
      
      // Fallback to regular stamp generation
      const iconPath = path.join(process.cwd(), 'storage', 'images', 'icons', 'icon.png');
      const coffeeTexturePath = path.join(process.cwd(), 'storage', 'images', 'strips', 'coffee-bean-texture.png');
      
      if (!fs.existsSync(iconPath)) {
        logger.warn('Icon not found for stamps, skipping stamp generation');
        return;
      }
      
      // Generate stamp grid with icon and coffee bean background
      const stampGridPath = await this.stampGenerator.createStampGridWithBackground(
        stampsEarned,
        stampsRequired,
        iconPath,
        coffeeTexturePath
      );
      
      // Replace the strip images with stamp grid
      const stripDest = path.join(tempDir, 'strip.png');
      const strip2xDest = path.join(tempDir, 'strip@2x.png');
      
      // Copy stamp grid as strip images (this will be visible in Apple Wallet)
      await fs.promises.copyFile(stampGridPath, stripDest);
      await fs.promises.copyFile(stampGridPath, strip2xDest);
      
      logger.info(`Stamps added to pass as strip images: ${stampsEarned}/${stampsRequired} redeemed`);
    } catch (error) {
      logger.error('Failed to add stamps to pass:', error);
      // Continue without stamps
    }
  }

  /**
   * Generate unsigned pass for preview (no signing)
   */
  async generatePreview(passData, customConfig = null) {
    try {
      const tempDir = path.join(process.cwd(), 'temp_preview');
      await fs.promises.mkdir(tempDir, { recursive: true });

      // Generate pass.json
      const passJson = this.generatePassJson(passData, customConfig);
      await fs.promises.writeFile(
        path.join(tempDir, 'pass.json'),
        JSON.stringify(passJson, null, 2)
      );

      // Process images
      const images = await this.imageProcessor.processImagesForPass(true);
      for (const [name, buffer] of Object.entries(images)) {
        await fs.promises.writeFile(path.join(tempDir, name), buffer);
      }

      // Add stamps if needed
      await this.addStampsToPass(tempDir, passData);

      // Generate manifest (without signature)
      const manifest = await this.generateManifest(tempDir);
      await fs.promises.writeFile(
        path.join(tempDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      logger.info('Preview pass generated successfully');
      return tempDir;

    } catch (error) {
      logger.error('Preview generation failed:', error);
      throw error;
    }
  }

  /**
   * Validate pass data
   */
  validatePassData(passData) {
    const required = ['campaignId', 'campaignName', 'tenantName'];
    const missing = required.filter(field => !passData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Validate partnerId if provided
    if (passData.partnerId && !passData.partnerId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid partnerId format. Must be a valid UUID.');
    }

    return true;
  }
}

module.exports = PassSigner;
