/**
 * Preview Generator Service
 * Generates image snapshots of pass designs for campaign list previews
 * Uses html2canvas approach (same as Pass Design Preview) instead of broken Puppeteer
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class PreviewGeneratorService {
  constructor() {
    this.previewsDir = path.join(process.cwd(), 'storage', 'previews');

    // Ensure previews directory exists
    this.ensurePreviewsDir();
  }

  async ensurePreviewsDir() {
    try {
      await fs.mkdir(this.previewsDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create previews directory:', error);
    }
  }

  /**
   * Generate campaign preview by capturing screenshot of rendered pass
   */
  async generateCampaignPreview(campaignId, campaignData) {
    try {
      logger.info('🔄 GENERATING CAMPAIGN PREVIEW', {
        campaignId,
        hasDesign: !!campaignData.design,
        hasDetails: !!campaignData.details,
        designData: campaignData.design ? JSON.stringify(campaignData.design).substring(0, 500) : 'null'
      });

      // Generate pass data for preview
      const passData = this.buildPassDataForPreview(campaignData);

      logger.info('📊 PASS DATA FOR PREVIEW', {
        campaignId,
        passDataColors: passData.colors,
        passDataImages: Object.keys(passData.images || {}),
        passDataFieldConfig: passData.fieldConfig ? 'custom' : 'default'
      });

      // Generate the preview image
      const previewPath = await this.generatePassPreview(passData, campaignId);

      logger.info('✅ GENERATED CAMPAIGN PREVIEW', {
        campaignId,
        previewPath,
        previewSize: await this.getFileSize(previewPath),
        hasDesign: !!campaignData.design,
        hasDetails: !!campaignData.details
      });

      return previewPath;
    } catch (error) {
      logger.error('❌ FAILED TO GENERATE CAMPAIGN PREVIEW', {
        campaignId,
        error: error.message,
        stack: error.stack.substring(0, 300)
      });
      throw error;
    }
  }

  /**
   * Get file size for debugging
   */
  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Build pass data for preview generation
   */
  buildPassDataForPreview(campaignData) {
    const design = campaignData.design || {};
    const details = campaignData.details || {};

    logger.info('🔨 BUILDING PASS DATA FOR PREVIEW', {
      designKeys: Object.keys(design),
      designColors: design.colors,
      designFieldConfig: design.fieldConfig ? 'present' : 'null',
      detailsKeys: Object.keys(details),
      detailsName: details.campaignName || 'no name'
    });

    const passData = {
      passType: 'storeCard',
      colors: design.colors || {
        primary: '#8B5CF6',
        secondary: '#34C759',
        background: '#F2F2F7',
        foreground: '#FFFFFF',
        label: '#FFFFFF'
      },
      images: design.images || {},
      fieldConfig: design.fieldConfig || null,
      campaignDetails: details,
      // Add sample data for preview
      customerName: 'John Doe',
      stampsEarned: 4,
      stampsRequired: 10,
      customerEmail: 'john@example.com',
      progressPercentage: 40,
      startDate: '01 Jan 2024',
      endDate: '31 Dec 2024',
      location: 'Main Store',
      targetAudience: 'All Customers',
      contactEmail: 'support@example.com',
      contactPhone: '+1 234 567 8900',
      contactWebsite: 'https://example.com',
      storeLocatorLink: 'https://example.com/locations',
      rewardBreakdown: 'Earn 1 stamp per $10 spent. Redeem 10 stamps for $5 off.',
      termsAndConditions: 'Valid at participating locations. Not transferable. Expires 1 year from issue date.'
    };

    logger.info('📋 FINAL PASS DATA FOR PREVIEW', {
      colors: passData.colors,
      hasCustomFieldConfig: !!passData.fieldConfig,
      fieldConfigKeys: passData.fieldConfig ? Object.keys(passData.fieldConfig) : 'none'
    });

    return passData;
  }

  /**
   * Generate pass preview directly from pass data (without signing)
   */
  async generatePassPreview(passData, campaignId) {
    try {
      // Generate HTML preview directly from pass data
      const htmlPreview = this.generateHTMLPreview(passData, passData);

      // Save HTML preview temporarily
      const tempHtmlPath = path.join(this.previewsDir, `${campaignId}_temp.html`);
      await fs.writeFile(tempHtmlPath, htmlPreview);

      // Capture screenshot using html2canvas approach
      const previewPath = await this.captureScreenshotWithHtml2Canvas(tempHtmlPath, campaignId);

      // Clean up temporary files
      await fs.unlink(tempHtmlPath);

      return previewPath;
    } catch (error) {
      logger.error('Failed to generate pass preview:', error);
      throw error;
    }
  }


  /**
   * Generate HTML preview from pass data
   */
  generateHTMLPreview(passData, campaignData) {
    const colors = passData.colors || {};
    const stripImage = passData.images?.strip || '/storage/images/processed/default-strip-background.png';

    logger.info('🎨 GENERATING HTML PREVIEW', {
      organizationName: passData.campaignDetails?.campaignName || 'Sample Campaign',
      colors,
      stripImage,
      hasColors: Object.keys(colors).length > 0,
      campaignName: passData.campaignDetails?.campaignName || 'no name'
    });

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pass Preview</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }

        .pass-container {
            width: 320px;
            height: 200px;
            background: ${colors.background || '#8B5CF6'};
            border-radius: 12px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            transform: scale(1.5);
            transform-origin: center;
        }

        .pass-header {
            height: 60px;
            background: linear-gradient(135deg, ${colors.primary || '#007AFF'}, ${colors.secondary || '#34C759'});
            display: flex;
            align-items: center;
            padding: 0 16px;
            position: relative;
        }

        .logo {
            width: 40px;
            height: 40px;
            background: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: ${colors.primary || '#8B5CF6'};
            font-size: 18px;
        }

        .logo-text {
            margin-left: 12px;
            color: white;
            font-size: 16px;
            font-weight: 600;
        }

        .pass-body {
            padding: 16px;
            height: 140px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .primary-field {
            text-align: center;
            margin-bottom: 8px;
        }

        .primary-label {
            color: ${colors.label || '#FFFFFF'};
            font-size: 12px;
            opacity: 0.8;
            margin-bottom: 4px;
        }

        .primary-value {
            color: ${colors.foreground || '#FFFFFF'};
            font-size: 24px;
            font-weight: bold;
        }

        .secondary-fields {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }

        .secondary-field {
            flex: 1;
        }

        .secondary-label {
            color: ${colors.label || '#FFFFFF'};
            font-size: 10px;
            opacity: 0.8;
            margin-bottom: 2px;
        }

        .secondary-value {
            color: ${colors.foreground || '#FFFFFF'};
            font-size: 14px;
            font-weight: 500;
        }

        .auxiliary-field {
            text-align: right;
        }

        .auxiliary-label {
            color: ${colors.label || '#FFFFFF'};
            font-size: 10px;
            opacity: 0.8;
            margin-bottom: 2px;
        }

        .auxiliary-value {
            color: ${colors.foreground || '#FFFFFF'};
            font-size: 16px;
            font-weight: bold;
        }

        .strip-container {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 20px;
            background: url('${stripImage}') no-repeat center;
            background-size: cover;
        }

        .strip-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg,
                rgba(255,255,255,0.8) 0%,
                rgba(255,255,255,0.8) 40%,
                rgba(255,255,255,0.3) 40%,
                rgba(255,255,255,0.3) 100%);
        }
    </style>
</head>
<body>
    <div class="pass-container">
        <div class="pass-header">
            <div class="logo">M</div>
            <div class="logo-text">${passData.campaignDetails?.campaignName || 'Sample Campaign'}</div>
        </div>

        <div class="pass-body">
            ${this.renderFields(passData, colors)}
        </div>

        <div class="strip-container">
            <div class="strip-overlay"></div>
        </div>
    </div>
</body>
</html>`;

    logger.info('📄 HTML PREVIEW GENERATED', {
      htmlLength: html.length,
      hasColors: Object.keys(colors).length > 0,
      organizationName: passData.campaignDetails?.campaignName || 'Sample Campaign'
    });

    return html;
  }

  /**
   * Render fields for the pass preview
   */
  renderFields(passData, colors) {
    let html = '';

    // Get sample fields for preview
    const sampleFields = this.generateSampleFields(passData);

    // Primary field
    if (sampleFields.primary) {
      html += `
        <div class="primary-field">
          <div class="primary-label">${sampleFields.primary.label || 'Card Balance'}</div>
          <div class="primary-value">${sampleFields.primary.value || '4 / 10'}</div>
        </div>
      `;
    }

    // Secondary fields
    if (sampleFields.secondary && sampleFields.secondary.length > 0) {
      html += '<div class="secondary-fields">';
      sampleFields.secondary.forEach(field => {
        html += `
          <div class="secondary-field">
            <div class="secondary-label">${field.label || 'Points'}</div>
            <div class="secondary-value">${field.value || '1250'}</div>
          </div>
        `;
      });
      html += '</div>';
    }

    // Auxiliary field
    if (sampleFields.auxiliary) {
      html += `
        <div class="auxiliary-field">
          <div class="auxiliary-label">${sampleFields.auxiliary.label || 'Next Reward'}</div>
          <div class="auxiliary-value">${sampleFields.auxiliary.value || '750 pts'}</div>
        </div>
      `;
    }

    return html;
  }

  /**
   * Generate sample fields for preview
   */
  generateSampleFields(passData) {
    const campaignType = passData.campaignDetails?.campaignType || 'redemption';

    return {
      primary: {
        label: 'Stamps Earned',
        value: '4 out of 10'
      },
      secondary: [
        {
          label: 'Points Balance',
          value: '1,250'
        },
        {
          label: 'Member Since',
          value: 'Jan 2024'
        }
      ],
      auxiliary: {
        label: 'Next Reward',
        value: 'Free Coffee'
      }
    };
  }

  /**
   * Capture screenshot using canvas to render the pass design
   */
  async captureScreenshotWithHtml2Canvas(htmlPath, campaignId) {
    try {
      logger.info('📸 CAPTURING PASS PREVIEW WITH CANVAS', { campaignId, htmlPath });

      const previewPath = path.join(this.previewsDir, `${campaignId}.png`);

      // Read the HTML template we generated
      const htmlContent = await fs.readFile(htmlPath, 'utf8');
      logger.info('📄 HTML template loaded', { htmlLength: htmlContent.length });

      // Parse the HTML to extract styles and dimensions
      const { styles, dimensions } = this.parseHTMLTemplate(htmlContent);

      // Create canvas with proper dimensions
      const canvas = require('canvas');
      const { createCanvas } = canvas;

      // Use pass dimensions (375x504 for Apple Wallet cards)
      const width = dimensions.width || 375;
      const height = dimensions.height || 504;

      const canvasElement = createCanvas(width, height);
      const ctx = canvasElement.getContext('2d');

      logger.info('🎨 Creating canvas', { width, height });

      // Apply background
      if (styles.backgroundColor) {
        ctx.fillStyle = styles.backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw header section
      if (styles.header) {
        const headerHeight = styles.header.height || 80;
        const gradient = ctx.createLinearGradient(0, 0, width, headerHeight);

        if (styles.header.gradient) {
          const gradientStops = styles.header.gradient;
          gradientStops.forEach((stop, index) => {
            gradient.addColorStop(index / (gradientStops.length - 1), stop);
          });
        } else {
          gradient.addColorStop(0, styles.header.primary || '#007AFF');
          gradient.addColorStop(1, styles.header.secondary || '#34C759');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, headerHeight);
      }

      // Draw logo text
      if (styles.logoText) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(styles.logoText, width / 2, 30);
      }

      // Draw primary field
      if (styles.primaryField) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(styles.primaryField.value || '4 / 10', width / 2, height / 2);
      }

      // Draw secondary fields
      if (styles.secondaryFields && styles.secondaryFields.length > 0) {
        ctx.fillStyle = 'white';
        ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'left';

        const secondaryY = height / 2 + 40;
        styles.secondaryFields.forEach((field, index) => {
          // Use actual field labels if available, otherwise use defaults
          const label = field.label || (index === 0 ? 'Card Holder' : 'Points');
          const value = field.value || (index === 0 ? 'John Doe' : '1,250');
          ctx.fillText(`${label}: ${value}`, 20, secondaryY + index * 20);
        });
      }

      // Draw auxiliary field
      if (styles.auxiliaryField) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(styles.auxiliaryField.value || 'Free Coffee', width - 20, height - 20);
      }

      // Add a subtle border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, width - 2, height - 2);

      // Save as PNG with high quality
      const buffer = canvasElement.toBuffer('image/png', { quality: 0.9 });
      await fs.writeFile(previewPath, buffer);

      logger.info('✅ PASS PREVIEW GENERATED', {
        campaignId,
        previewPath,
        fileSize: buffer.length,
        dimensions: `${width}x${height}`
      });

      return previewPath;
    } catch (error) {
      logger.error('❌ Failed to capture pass preview:', error);
      throw error;
    }
  }

  /**
   * Parse HTML template to extract styles and dimensions
   */
  parseHTMLTemplate(htmlContent) {
    const styles = {};
    const dimensions = {};

    try {
      // Extract background color
      const bgMatch = htmlContent.match(/background:\s*([^;]+)/);
      if (bgMatch) {
        styles.backgroundColor = bgMatch[1];
      }

      // Extract header gradient colors
      const headerMatch = htmlContent.match(/background:\s*linear-gradient\([^,]+,\s*([^,]+),\s*([^)]+)\)/);
      if (headerMatch) {
        styles.header = {
          gradient: [headerMatch[1], headerMatch[2]]
        };
      }

      // Extract logo text
      const logoMatch = htmlContent.match(/<div class="logo-text">([^<]+)</);
      if (logoMatch) {
        styles.logoText = logoMatch[1];
      }

      // Extract primary field value
      const primaryMatch = htmlContent.match(/<div class="primary-value">([^<]+)</);
      if (primaryMatch) {
        styles.primaryField = { value: primaryMatch[1] };
      }

      // Extract secondary fields (with labels)
      const secondaryMatches = htmlContent.match(/<div class="secondary-label">([^<]+)</g);
      const secondaryValueMatches = htmlContent.match(/<div class="secondary-value">([^<]+)</g);
      if (secondaryMatches && secondaryValueMatches) {
        styles.secondaryFields = secondaryMatches.map((labelMatch, index) => {
          const label = labelMatch.match(/<div class="secondary-label">([^<]+)</)?.[1] || '';
          const value = secondaryValueMatches[index]?.match(/<div class="secondary-value">([^<]+)</)?.[1] || '';
          return { label, value };
        });
      }

      // Extract auxiliary field value
      const auxMatch = htmlContent.match(/<div class="auxiliary-value">([^<]+)</);
      if (auxMatch) {
        styles.auxiliaryField = { value: auxMatch[1] };
      }

      // Extract dimensions from style attributes
      const widthMatch = htmlContent.match(/width:\s*(\d+)px/);
      const heightMatch = htmlContent.match(/height:\s*(\d+)px/);
      if (widthMatch) dimensions.width = parseInt(widthMatch[1]);
      if (heightMatch) dimensions.height = parseInt(heightMatch[1]);

    } catch (error) {
      logger.warn('Failed to parse HTML template styles:', error);
    }

    return { styles, dimensions };
  }

  /**
   * Check if preview exists
   */
  async previewExists(campaignId) {
    try {
      const previewPath = this.getPreviewPath(campaignId);
      await fs.access(previewPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if preview was generated by frontend (live preview capture)
   * Frontend previews are typically larger than server-generated ones
   */
  async isFrontendPreview(campaignId) {
    try {
      const previewPath = this.getPreviewPath(campaignId);
      const stats = await fs.stat(previewPath);
      
      // Frontend previews are typically much larger (80KB+) than server-generated ones (12KB)
      // This is because frontend captures are full resolution screenshots
      const isFrontendSize = stats.size > 50000; // 50KB threshold
      
      logger.info('🔍 CHECKING PREVIEW TYPE', {
        campaignId,
        fileSize: stats.size,
        isFrontendPreview: isFrontendSize,
        lastModified: stats.mtime
      });
      
      return isFrontendSize;
    } catch {
      return false;
    }
  }

  /**
   * Get preview path
   */
  getPreviewPath(campaignId) {
    return path.join(this.previewsDir, `${campaignId}.png`);
  }

  /**
   * Get preview URL for serving
   */
  getPreviewUrl(campaignId) {
    return `/storage/previews/${campaignId}.png`;
  }

  /**
   * Clean up old previews
   */
  async cleanupOldPreviews(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    try {
      const files = await fs.readdir(this.previewsDir);
      const now = Date.now();
      
      for (const file of files) {
        if (file.endsWith('.png')) {
          const filePath = path.join(this.previewsDir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
            logger.info('Cleaned up old preview', { file });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup old previews:', error);
    }
  }
}

module.exports = PreviewGeneratorService;