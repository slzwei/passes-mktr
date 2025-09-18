/**
 * Preview Matching Pass Generator
 * Generates passes that match the live preview in the editor exactly
 */

const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const logger = require('../utils/logger');

class PreviewMatchingPassGenerator {
  constructor() {
    this.passTypeId = 'pass.com.mktr.wallet.new';
    this.teamId = '35L9ZSS9F9';
  }

  /**
   * Get logo text based on pass type
   */
  getLogoTextForPassType(passType) {
    const logoTextMap = {
      'redemption': 'REDEMPTION CARD',
      'points': 'POINTS CARD', 
      'rewards': 'REWARDS CARD',
      'loyalty': 'LOYALTY CARD'
    };
    
    return logoTextMap[passType] || 'LOYALTY CARD';
  }

  /**
   * Generate pass.json that matches the live preview exactly
   */
  generatePreviewMatchingPassJson(template, previewData) {
    const passType = template.type || 'loyalty';
    const logoText = this.getLogoTextForPassType(passType);
    
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: this.passTypeId,
      serialNumber: uuidv4(),
      teamIdentifier: this.teamId,
      organizationName: previewData.tenantName,
      description: `${previewData.campaignName} ${logoText.replace(' CARD', '')}`,
      logoText: logoText,
      logoTextAlignment: 'PKTextAlignmentLeft',
      foregroundColor: template.colors.foreground,
      backgroundColor: template.colors.background,
      labelColor: template.colors.label,
      headerFields: [
        {
          key: 'campaign',
          label: 'Campaign',
          value: previewData.campaignName,
          textAlignment: 'PKTextAlignmentCenter'
        }
      ],
      storeCard: {
        // No primary fields - the stamps are handled by the strip image
        primaryFields: [],
        secondaryFields: [
          {
            key: 'customerInfo',
            label: 'Card Holder',
            value: previewData.customerName,
            textAlignment: 'PKTextAlignmentLeft'
          },
          {
            key: 'redemptionCounter',
            label: 'Progress',
            value: `${previewData.stampsEarned} stamps earned`,
            textAlignment: 'PKTextAlignmentRight'
          }
        ],
        auxiliaryFields: [
          {
            key: 'nextReward',
            label: 'Next Reward',
            value: `Free coffee at ${previewData.stampsRequired} stamps`,
            textAlignment: 'PKTextAlignmentCenter'
          }
        ],
        backFields: [
          {
            key: 'terms',
            label: 'Terms & Conditions',
            value: 'Valid at participating locations. Not transferable.',
            textAlignment: 'PKTextAlignmentLeft'
          },
          {
            key: 'contact',
            label: 'Contact',
            value: `${previewData.tenantName} - ${previewData.customerEmail}`,
            textAlignment: 'PKTextAlignmentLeft'
          },
          {
            key: 'instructions',
            label: 'Instructions',
            value: 'Show this pass to earn stamps on purchases.',
            textAlignment: 'PKTextAlignmentLeft'
          }
        ],
        barcode: {
          message: `PASS_ID:${uuidv4()}:CAMPAIGN_ID:${previewData.campaignId || '550e8400-e29b-41d4-a716-446655440001'}`,
          format: 'PKBarcodeFormatQR',
          messageEncoding: 'iso-8859-1',
          altText: 'Loyalty Card QR Code'
        }
      }
    };

    return passJson;
  }

  /**
   * Generate strip image with stamps matching the PrimaryFieldStamps component
   */
  async generateStripWithStamps(stampsEarned, stampsRequired, stripBackground, milestones = []) {
    const { createCanvas, loadImage } = require('canvas');
    
    // Strip dimensions (Apple Wallet standard)
    const stripWidth = 320;
    const stripHeight = 128; // Increased height to accommodate stamp grid
    
    const canvas = createCanvas(stripWidth, stripHeight);
    const ctx = canvas.getContext('2d');
    
    // Fill background
    ctx.fillStyle = stripBackground;
    ctx.fillRect(0, 0, stripWidth, stripHeight);
    
    // Calculate stamp grid layout (matching PrimaryFieldStamps component)
    const count = stampsRequired;
    let rows, cols;
    
    if (count <= 5) rows = 1;
    else if (count <= 10) rows = 2;
    else if (count <= 20) rows = 3;
    else if (count <= 30) rows = 4;
    else rows = 5;
    
    cols = Math.min(10, Math.ceil(count / rows));
    
    // Calculate stamp size
    const gapPx = 4;
    const padding = 12;
    const totalGapX = gapPx * (cols - 1);
    const totalGapY = gapPx * (rows - 1);
    const availableWidth = stripWidth - (padding * 2) - totalGapX;
    const availableHeight = stripHeight - (padding * 2) - totalGapY;
    const cellWidth = availableWidth / cols;
    const cellHeight = availableHeight / rows;
    const stampSize = Math.floor(Math.min(cellWidth, cellHeight));
    
    // Center the grid
    const startX = (stripWidth - (cols * stampSize + totalGapX)) / 2;
    const startY = (stripHeight - (rows * stampSize + totalGapY)) / 2;
    
    // Draw stamps
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = startX + col * (stampSize + gapPx);
      const y = startY + row * (stampSize + gapPx);
      
      const isRedeemed = i < stampsEarned;
      const isMilestone = milestones.includes(i + 1);
      const isSpecial = isMilestone;
      
      // Draw stamp circle
      ctx.beginPath();
      ctx.arc(x + stampSize/2, y + stampSize/2, stampSize/2 - 2, 0, 2 * Math.PI);
      
      if (isRedeemed) {
        // Filled white circle for earned stamps
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw checkmark
        ctx.strokeStyle = '#DC143C';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + stampSize/2 - stampSize/4, y + stampSize/2);
        ctx.lineTo(x + stampSize/2 - stampSize/8, y + stampSize/2 + stampSize/4);
        ctx.lineTo(x + stampSize/2 + stampSize/4, y + stampSize/2 - stampSize/4);
        ctx.stroke();
      } else if (isSpecial) {
        // Dashed gold circle for milestone stamps
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Fill with light gold
        ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.fill();
        
        // Draw star
        ctx.fillStyle = '#FFD700';
        ctx.font = `${stampSize * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', x + stampSize/2, y + stampSize/2);
      } else {
        // Empty circle for unearned stamps
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Fill with light background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fill();
        
        // Draw empty circle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x + stampSize/2, y + stampSize/2, stampSize/4, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
    
    return canvas.toBuffer('image/png');
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
   * Generate the complete pass matching the live preview
   */
  async generatePass(template, previewData, customStripImage = null) {
    try {
      logger.info('Generating pass that matches live preview exactly...');
      
      // Create temp directory
      const tempDir = path.join(__dirname, '../../temp_preview_match');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      let stripBuffer;
      
      if (customStripImage) {
        // Use the custom strip image from frontend
        logger.info('Using custom strip image from frontend...');
        
        // Convert base64 data URL to buffer
        const base64Data = customStripImage.replace(/^data:image\/png;base64,/, '');
        stripBuffer = Buffer.from(base64Data, 'base64');
      } else {
        // Generate strip image with stamps (fallback)
        logger.info('Creating strip image with stamp grid...');
        stripBuffer = await this.generateStripWithStamps(
          previewData.stampsEarned,
          previewData.stampsRequired,
          template.colors.stripBackground,
          template.rewards?.milestones || [8, 10]
        );
      }
      
      // Save strip images
      fs.writeFileSync(path.join(tempDir, 'strip.png'), stripBuffer);
      fs.writeFileSync(path.join(tempDir, 'strip@2x.png'), stripBuffer); // Same for now
      
      // Generate pass.json
      logger.info('Creating pass.json...');
      const passJson = this.generatePreviewMatchingPassJson(template, previewData);
      fs.writeFileSync(path.join(tempDir, 'pass.json'), JSON.stringify(passJson, null, 2));
      
      // Copy required images (using existing ones)
      const requiredImages = ['icon.png', 'icon@2x.png', 'logo.png', 'logo@2x.png'];
      for (const imageName of requiredImages) {
        const sourcePath = path.join(__dirname, '../../pass-assets', imageName);
        const destPath = path.join(tempDir, imageName);
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, destPath);
        }
      }
      
      // Generate manifest
      logger.info('Creating manifest.json...');
      const manifest = await this.generateManifest(tempDir);
      fs.writeFileSync(path.join(tempDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
      
      // Generate signature (placeholder for now)
      logger.info('Creating signature...');
      fs.writeFileSync(path.join(tempDir, 'signature'), 'PLACEHOLDER_SIGNATURE');
      
      // Create .pkpass file
      logger.info('Creating .pkpass file...');
      const { execSync } = require('child_process');
      const outputPath = path.join(__dirname, '../../preview-matching-pass.pkpass');
      
      try {
        execSync(`cd "${tempDir}" && zip -r "${outputPath}" .`, { stdio: 'inherit' });
        logger.info('Preview-matching pass generated successfully!');
        logger.info(`Pass file: ${outputPath}`);
        
        // Clean up temp directory
        fs.rmSync(tempDir, { recursive: true, force: true });
        
        return outputPath;
        
      } catch (error) {
        logger.error('Error creating .pkpass file:', error.message);
        throw error;
      }
      
    } catch (error) {
      logger.error('Error generating preview-matching pass:', error.message);
      throw error;
    }
  }
}

module.exports = PreviewMatchingPassGenerator;
