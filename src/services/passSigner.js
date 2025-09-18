const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const forge = require('node-forge');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const logger = require('../utils/logger');
const ImageProcessor = require('./imageProcessor');
// const StampGenerator = require('./stampGenerator'); // Removed - using buildStampStrip instead
const PassConfigService = require('./passConfigService');
const DynamicStampService = require('./dynamicStampService');
const { 
  STRIP_W_1X, 
  STRIP_H_1X, 
  STRIP_W_2X, 
  STRIP_H_2X, 
  STRIP_W_3X, 
  STRIP_H_3X, 
  STRIP_DEBUG 
} = require('../shared/stripConstants.js');

class PassSigner {
  constructor() {
    this.teamId = process.env.APPLE_TEAM_ID;
    this.passTypeId = process.env.PASS_TYPE_ID;
    this.certPath = process.env.APPLE_CERT_PATH;
    this.certPassword = process.env.APPLE_CERT_PASSWORD;
    this.imageProcessor = new ImageProcessor();
    // this.stampGenerator = new StampGenerator(); // Removed - using buildStampStrip instead
    this.configService = new PassConfigService();
    this.dynamicStampService = new DynamicStampService();

    // Holds the most recent image paths used during generation for diagnostics
    this.lastProvenance = null;

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

      // Check if stamps are needed
      const { stampsRequired = 10 } = passData;
      const includeStrips = stampsRequired > 0;

      // Process and add images first to get logo format information
      const processedImages = await this.addImagesToPass(tempDir, includeStrips, passData.images, passData);
      // Expose for route to attach debug headers
      this.lastProvenance = processedImages;

      // Generate pass.json with logo format information
      const passJson = this.generatePassJson(passData, passData.fieldConfig, processedImages);
      await fs.promises.writeFile(
        path.join(tempDir, 'pass.json'),
        JSON.stringify(passJson, null, 2)
      );

      // Generate and add stamps
      await this.addStampsToPass(tempDir, passData, processedImages);

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
  generatePassJson(passData, customConfig = null, processedImages = null) {
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
    
    // Debug logging for field configuration
    logger.info('Field configuration:', {
      hasCustomConfig: !!customConfig,
      fieldConfig: fieldConfig ? {
        header: fieldConfig.fields?.header?.length || 0,
        secondary: fieldConfig.fields?.secondary?.length || 0,
        auxiliary: fieldConfig.fields?.auxiliary?.length || 0
      } : null
    });
    
    // Merge colors with field config colors
    const finalColors = { ...fieldConfig.colors, ...colors };

    // Determine if logo text should be hidden based on processed images
    const shouldHideLogoText = processedImages && processedImages.hideLogoText;
    
    logger.info(`Logo format info - Format: ${processedImages?.logoFormat}, Hide logo text: ${shouldHideLogoText}`);
    
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: this.passTypeId,
      serialNumber: serialNumber || uuidv4(),
      teamIdentifier: this.teamId,
      organizationName: tenantName || 'MKTR',
      description: campaignName ? `${campaignName} Loyalty Card` : 'Loyalty Card',
      // Only include logoText if it should not be hidden (wide logo format) and campaignName is not empty
      ...(shouldHideLogoText || !campaignName ? {} : { 
        logoText: campaignName,
        logoTextAlignment: 'PKTextAlignmentLeft'
      }),
      foregroundColor: finalColors.foreground,
      backgroundColor: finalColors.background,
      labelColor: finalColors.label,
      ...(passData.hasExpiryDate && passData.expirationDate ? { expirationDate: new Date(passData.expirationDate).toISOString() } : {}),
      storeCard: {
        headerFields: fieldConfig.fields.header,
        primaryFields: fieldConfig.fields.primary,
        secondaryFields: fieldConfig.fields.secondary,
        auxiliaryFields: fieldConfig.fields.auxiliary,
        backFields: fieldConfig.fields.back
      },
      barcode: {
        message: `PASS_ID:${uuidv4()}:CAMPAIGN_ID:${campaignId}:PARTNER_ID:${partnerId || 'default'}`,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
        altText: passData.qrAltText || 'Loyalty Card QR Code'
      }
    };

    // Add thumbnail if icon is available
    if (images && images.icon) {
      passJson.thumbnail = {
        key: 'thumbnail',
        value: 'icon'
      };
    }

    return passJson;
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
  async addImagesToPass(tempDir, includeStrips = true, uploadedImages = null, passData = null) {
    try {
      let imagePaths;
      
      // Check if we need to skip strip processing (will be handled by addStampsToPass)
      const hasStamps = uploadedImages && uploadedImages.strip && uploadedImages.stampsEarned !== undefined;
      const shouldSkipStrips = hasStamps && includeStrips;
      
      if (uploadedImages && (uploadedImages.logo || uploadedImages.icon || uploadedImages.strip || uploadedImages.stampIcon)) {
        // Process uploaded images first, then use them
        logger.info('Processing uploaded images for pass generation');
        
        if (shouldSkipStrips) {
          logger.info('Skipping strip processing - will be handled by dynamic stamp service');
          // Process everything except strips
          const imagesWithoutStrips = { ...uploadedImages };
          delete imagesWithoutStrips.strip;
          imagePaths = await this.imageProcessor.processUploadedImages(imagesWithoutStrips, false);
        } else {
          imagePaths = await this.imageProcessor.processUploadedImages(uploadedImages, includeStrips);
        }
      } else {
        // Use existing processed images, but skip strips if we're going to generate custom stamps
        const skipStrips = includeStrips && passData && (passData.stampsRequired > 0);
        imagePaths = await this.imageProcessor.getProcessedImagePaths(skipStrips ? false : includeStrips);
      }
      
      // Copy processed images to pass directory
      await this.imageProcessor.copyImagesToPassDir(tempDir, imagePaths);
      
      if (!includeStrips) {
        logger.info('Skipping strip images for clean pass');
      }
      
      // Skip coffee bean texture for clean passes
      logger.info('Skipping coffee bean texture for clean pass');
      
      logger.info('Images added to pass successfully');
      return imagePaths;
    } catch (error) {
      logger.error('Failed to add images to pass:', error);
      // Continue without images - will use defaults
      return null;
    }
  }

  /**
   * Add stamps to pass directory
   */
  async addStampsToPass(tempDir, passData, processedImages = null) {
    try {
      const { stampsEarned = 0, stampsRequired = 10, images: uploadedImages } = passData;
      
      // Skip stamp generation if no stamps required
      if (stampsRequired === 0) {
        logger.info('No stamps required - skipping stamp generation');
        return;
      }

      // Check if user wants clean strip without stamps
      const wantsCleanStrip = (uploadedImages && uploadedImages.strip && !uploadedImages.stampsEarned) || passData.cleanStrip;
      if (wantsCleanStrip) {
        logger.info('User wants clean strip without stamps - using strip as-is');
        
        try {
          if (uploadedImages && uploadedImages.strip) {
            // Save uploaded strip image temporarily
            const tempStripPath = path.join(process.cwd(), 'temp', 'uploaded_strip.png');
            await fs.promises.mkdir(path.dirname(tempStripPath), { recursive: true });
            
            // Extract base64 data
            const base64Data = uploadedImages.strip.replace(/^data:image\/[a-z]+;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');
            await fs.promises.writeFile(tempStripPath, imageBuffer);
            
            // Process the clean strip image to proper dimensions
            const stripDest = path.join(tempDir, 'strip.png');
            const strip2xDest = path.join(tempDir, 'strip@2x.png');
            const strip3xDest = path.join(tempDir, 'strip@3x.png');
            
            // Resize to Apple Wallet store card strip dimensions (EXACT)
            await sharp(tempStripPath)
              .resize(STRIP_W_1X, STRIP_H_1X)
              .png()
              .toFile(stripDest);
              
            await sharp(tempStripPath)
              .resize(STRIP_W_2X, STRIP_H_2X)
              .png()
              .toFile(strip2xDest);
              
            await sharp(tempStripPath)
              .resize(STRIP_W_3X, STRIP_H_3X)
              .png()
              .toFile(strip3xDest);
          } else {
            // Generate clean strip with custom background image or color
            const stripBackgroundColor = passData.colors?.stripBackground || '#F5F5F5';
            logger.info(`Generating clean strip with background color: ${stripBackgroundColor}`);
            
            try {
              const stripDest = path.join(tempDir, 'strip.png');
              const strip2xDest = path.join(tempDir, 'strip@2x.png');
              const strip3xDest = path.join(tempDir, 'strip@3x.png');
              
              // Check if custom strip background image is available
              if (processedImages && processedImages.stripBackground) {
                logger.info('Using custom strip background image');
                await fs.promises.copyFile(processedImages.stripBackground, stripDest);
                await fs.promises.copyFile(processedImages.stripBackground2x, strip2xDest);
                // Generate 3x version from 2x
                await sharp(processedImages.stripBackground2x).resize(STRIP_W_3X, STRIP_H_3X).png().toFile(strip3xDest);
                logger.info('Custom strip background images copied successfully');
              } else {
                // Generate a simple strip with just the background color (Apple store card spec)
                const stripWidth = STRIP_W_1X;
                const stripHeight = STRIP_H_1X;
                
                // Create a simple colored strip
                const stripBuffer = await sharp({
                  create: {
                    width: stripWidth,
                    height: stripHeight,
                    channels: 4,
                    background: stripBackgroundColor
                  }
                })
                .png()
                .toBuffer();
                
                await fs.promises.writeFile(stripDest, stripBuffer);
                await sharp(stripBuffer).resize(STRIP_W_2X, STRIP_H_2X).png().toFile(strip2xDest);
                await sharp(stripBuffer).resize(STRIP_W_3X, STRIP_H_3X).png().toFile(strip3xDest);
                
                logger.info(`Clean strip generated with background color ${stripBackgroundColor}`);
              }
              
            } catch (error) {
              logger.error('Failed to generate clean strip:', error);
              // Fall back to default strip images
              const defaultStripPath = path.join(process.cwd(), 'storage', 'images', 'strips', 'strip.png');
              const defaultStrip2xPath = path.join(process.cwd(), 'storage', 'images', 'strips', 'strip@2x.png');
              
              if (fs.existsSync(defaultStripPath)) {
                const stripDest = path.join(tempDir, 'strip.png');
                const strip2xDest = path.join(tempDir, 'strip@2x.png');
                
                await fs.promises.copyFile(defaultStripPath, stripDest);
                if (fs.existsSync(defaultStrip2xPath)) {
                  await fs.promises.copyFile(defaultStrip2xPath, strip2xDest);
                } else {
                  // Generate @2x from @1x
                  await sharp(defaultStripPath)
                    .resize(750, 288)
                    .png()
                    .toFile(strip2xDest);
                }
                
                // Generate @3x
                const strip3xDest = path.join(tempDir, 'strip@3x.png');
                await sharp(defaultStripPath)
                  .resize(STRIP_W_3X, STRIP_H_3X)
                  .png()
                  .toFile(strip3xDest);
              }
            }
          }
          
          logger.info('Clean strip images created without stamps');
          return;
          
        } catch (error) {
          logger.error('Failed to create clean strip:', error);
          // Fall back to regular stamp generation
        }
      }
      
      // Handle uploaded strip images with dynamic stamp overlay
      if (uploadedImages && uploadedImages.strip) {
        logger.info('User uploaded custom strip image - creating dynamic strip with stamps overlay');
        
        try {
          // Save uploaded strip image temporarily
          const tempStripPath = path.join(process.cwd(), 'temp', 'uploaded_strip.png');
          await fs.promises.mkdir(path.dirname(tempStripPath), { recursive: true });
          
          // Extract base64 data
          const base64Data = uploadedImages.strip.replace(/^data:image\/[a-z]+;base64,/, '');
          const imageBuffer = Buffer.from(base64Data, 'base64');
          await fs.promises.writeFile(tempStripPath, imageBuffer);
          
          // Resolve icon paths (prefer uploaded)
          let iconPath = null;
          let iconRedeemedPath = null;
          if (processedImages && (processedImages.stampIconUnredeemed || processedImages.stampIcon)) {
            iconPath = processedImages.stampIconUnredeemed || processedImages.stampIcon;
            iconRedeemedPath = processedImages.stampIconRedeemed || iconPath;
          } else {
            const coffeeStampPath = path.join(process.cwd(), 'storage', 'images', 'icons', 'coffee.png');
            const testCoffeePath = path.join(process.cwd(), 'storage', 'images', 'icons', 'test-coffee-icon.png');
            try {
              await fs.promises.access(coffeeStampPath);
              iconPath = coffeeStampPath;
              iconRedeemedPath = coffeeStampPath;
            } catch {
              try {
                await fs.promises.access(testCoffeePath);
                iconPath = testCoffeePath;
                iconRedeemedPath = testCoffeePath;
              } catch {
                // Will use circle-based stamps
              }
            }
          }
          
          // Handle custom stamp icon if provided
          let customStampIconPath = null;
          if (uploadedImages.stampIcon) {
            const tempStampIconPath = path.join(process.cwd(), 'temp', 'uploaded_stamp_icon.png');
            await fs.promises.mkdir(path.dirname(tempStampIconPath), { recursive: true });
            
            // Extract base64 data
            const base64Data = uploadedImages.stampIcon.replace(/^data:image\/[a-z]+;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');
            await fs.promises.writeFile(tempStampIconPath, imageBuffer);
            customStampIconPath = tempStampIconPath;
          }
          
          // Create dynamic strip with stamps overlay (full Apple Wallet dimensions)
          const dynamicStrips = await this.dynamicStampService.createDynamicStripWithStamps(
            tempStripPath,
            stampsEarned,
            stampsRequired,
            customStampIconPath || iconPath,
            {
              // Only non-layout flags should be passed; layout is unified in the service
              opacity: 0.4,
              iconRedeemedPath: iconRedeemedPath
            }
          );
          
          // Copy generated strips to pass directory (no scaling)
          const stripDest = path.join(tempDir, 'strip.png');
          const strip2xDest = path.join(tempDir, 'strip@2x.png');
          const strip3xDest = path.join(tempDir, 'strip@3x.png');
          
          logger.info(`Copying dynamic strips to pass directory:`);
          logger.info(`  From: ${dynamicStrips.strip} -> ${stripDest}`);
          logger.info(`  From: ${dynamicStrips.strip2x} -> ${strip2xDest}`);
          logger.info(`  From: ${dynamicStrips.strip3x} -> ${strip3xDest}`);
          
          await fs.promises.copyFile(dynamicStrips.strip, stripDest);
          await fs.promises.copyFile(dynamicStrips.strip2x, strip2xDest);
          await fs.promises.copyFile(dynamicStrips.strip3x, strip3xDest);
          
          // Verify files were copied
          const stripStats = await fs.promises.stat(stripDest);
          const strip2xStats = await fs.promises.stat(strip2xDest);
          const strip3xStats = await fs.promises.stat(strip3xDest);
          
          logger.info(`Dynamic strips copied successfully:`);
          logger.info(`  strip.png: ${stripStats.size} bytes`);
          logger.info(`  strip@2x.png: ${strip2xStats.size} bytes`);
          logger.info(`  strip@3x.png: ${strip3xStats.size} bytes`);
          logger.info(`Dynamic strip with stamps overlay created: ${stampsEarned}/${stampsRequired} stamps`);
          return;
          
        } catch (error) {
          logger.error('Failed to create dynamic strip with stamps overlay:', error);
          // Fall back to regular stamp generation
        }
      }
      
      // Generate strip with custom background color
      const stripBackgroundColor = passData.colors?.stripBackground || '#F5F5F5';
      logger.info(`Generating strip with background color: ${stripBackgroundColor}`);
      
      try {
        // Resolve icon paths (prefer uploaded, include redeemed)
        let iconPath = null;
        let iconRedeemedPath = null;
        if (processedImages && (processedImages.stampIconUnredeemed || processedImages.stampIcon)) {
          iconPath = processedImages.stampIconUnredeemed || processedImages.stampIcon;
          iconRedeemedPath = processedImages.stampIconRedeemed || iconPath;
          logger.info(`Using uploaded stamp icons: unredeemed=${iconPath}, redeemed=${iconRedeemedPath}`);
        } else {
          const coffeeStampPath = path.join(process.cwd(), 'storage', 'images', 'icons', 'coffee.png');
          const testCoffeePath = path.join(process.cwd(), 'storage', 'images', 'icons', 'test-coffee-icon.png');
          try {
            await fs.promises.access(coffeeStampPath);
            iconPath = coffeeStampPath;
            iconRedeemedPath = coffeeStampPath;
          } catch {
            try {
              await fs.promises.access(testCoffeePath);
              iconPath = testCoffeePath;
              iconRedeemedPath = testCoffeePath;
            } catch {}
          }
        }

        // Build a base strip with background color
        const baseStripBuffer = await sharp({
          create: {
            width: STRIP_W_1X,
            height: STRIP_H_1X,
            channels: 4,
            background: stripBackgroundColor
          }
        }).png().toBuffer();
        const baseStripPath = path.join(process.cwd(), 'temp', 'base_strip.png');
        await fs.promises.mkdir(path.dirname(baseStripPath), { recursive: true });
        await fs.promises.writeFile(baseStripPath, baseStripBuffer);

        // Use dynamic service to overlay stamps with separate icons
        const dynamicStrips2 = await this.dynamicStampService.createDynamicStripWithStamps(
          baseStripPath,
          stampsEarned,
          stampsRequired,
          iconPath,
          { iconRedeemedPath }
        );

        // Save generated strips to pass directory
        const stripDest = path.join(tempDir, 'strip.png');
        const strip2xDest = path.join(tempDir, 'strip@2x.png');
        const strip3xDest = path.join(tempDir, 'strip@3x.png');

        await fs.promises.copyFile(dynamicStrips2.strip, stripDest);
        await fs.promises.copyFile(dynamicStrips2.strip2x, strip2xDest);
        await fs.promises.copyFile(dynamicStrips2.strip3x, strip3xDest);

        // Debug logging and duplicate saves
        if (STRIP_DEBUG) {
          const x1 = await fs.promises.readFile(stripDest);
          const x2 = await fs.promises.readFile(strip2xDest);
          const x3 = await fs.promises.readFile(strip3xDest);
          const x1Meta = await sharp(x1).metadata();
          const x2Meta = await sharp(x2).metadata();
          const x3Meta = await sharp(x3).metadata();
          const sha1_1x = crypto.createHash('sha1').update(x1).digest('hex');
          const sha1_2x = crypto.createHash('sha1').update(x2).digest('hex');
          const sha1_3x = crypto.createHash('sha1').update(x3).digest('hex');

          console.log(`STRIP DEBUG (passSigner-dynamicStamp): finalWidth=${x1Meta.width}, finalHeight=${x1Meta.height}`);
          console.log(`STRIP DEBUG (passSigner-dynamicStamp): extract/trim rectangles used: NONE`);
          console.log(`STRIP OK | 1x:${STRIP_W_1X}x${STRIP_H_1X} sha1=${sha1_1x} | 2x:${STRIP_W_2X}x${STRIP_H_2X} sha1=${sha1_2x} | 3x:${STRIP_W_3X}x${STRIP_H_3X} sha1=${sha1_3x} | extract=NONE`);

          // Save debug duplicates next to the pass
          await fs.promises.writeFile(path.join(tempDir, 'strip.debug.1x.png'), x1);
          await fs.promises.writeFile(path.join(tempDir, 'strip.debug.2x.png'), x2);
          await fs.promises.writeFile(path.join(tempDir, 'strip.debug.3x.png'), x3);
        }
        
        logger.info(`Custom strip generated with background color ${stripBackgroundColor}: ${stampsEarned}/${stampsRequired} stamps (dynamic overlay)`);
        return;
        
      } catch (error) {
        logger.error('Failed to generate custom strip:', error);
        // Fall back to existing strip generation methods
      }
      
      // All old fallback methods removed - always use new circular stamp generation
      
      // If we reach here, the new circular stamp generation failed
      // This should not happen with the fixed buildStampStrip function
      logger.error('All stamp generation methods failed - this should not happen');
      logger.warn('Skipping stamp generation due to unexpected error');
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
