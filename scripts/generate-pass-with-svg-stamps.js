const PassSigner = require('../src/services/passSigner');
const { buildStampStrip } = require('../src/services/stampStrip');
const fs = require('fs').promises;
const path = require('path');

// Set environment variables
process.env.APPLE_TEAM_ID = '35L9ZSS9F9';
process.env.PASS_TYPE_ID = 'pass.com.mktr.wallet.new';
process.env.APPLE_CERT_PATH = '/Users/shawnlee/Documents/GitHub/passes-mktr/certs/apple/mktr-loyalty.p12';
process.env.APPLE_CERT_PASSWORD = 'changeme';

async function createSvgStampStrip(stampsEarned, stampsRequired) {
  try {
    console.log('🎨 Creating SVG stamp strip...');
    
    const stampsDir = path.join(process.cwd(), 'storage', 'images', 'stamps');
    await fs.mkdir(stampsDir, { recursive: true });
    
    // Calculate rows and columns for the stamps
    const cols = 5;
    const rows = Math.ceil(stampsRequired / cols);
    
    // Generate stamp strip with SVG and icons
    const iconPath = path.join(process.cwd(), 'storage', 'images', 'icons', 'icon.png');
    const { x1, x2, x3, size } = await buildStampStrip({
      width: 320,         // Apple Wallet strip width
      rows: rows,
      cols: cols,
      outerPad: 16,
      gap: 8,             // Reduced gap for tighter spacing between rows
      cornerRadius: 14,
      panelFill: '#F5D56B',    // soft yellow background
      circleFill: '#FFFFFF',
      circleStroke: '#C8B36A', // warm neutral stroke
      circleStrokePx: 3,
      iconPath: iconPath,      // Use the test icon
      stampsEarned: stampsEarned,
      stampsRequired: stampsRequired
    });
    
    // Save the stamp strip images
    const stripPath = path.join(stampsDir, `svg_stamp_strip_${stampsEarned}_${stampsRequired}.png`);
    const strip2xPath = path.join(stampsDir, `svg_stamp_strip_${stampsEarned}_${stampsRequired}@2x.png`);
    const strip3xPath = path.join(stampsDir, `svg_stamp_strip_${stampsEarned}_${stampsRequired}@3x.png`);
    
    await fs.writeFile(stripPath, x1);
    await fs.writeFile(strip2xPath, x2);
    await fs.writeFile(strip3xPath, x3);
    
    console.log(`✅ SVG stamp strip created: ${stampsEarned}/${stampsRequired} stamps`);
    console.log(`   Size: ${size.w}x${size.h}px`);
    console.log(`   Files: ${stripPath}, ${strip2xPath}, ${strip3xPath}`);
    
    return { stripPath, strip2xPath, strip3xPath };
    
  } catch (error) {
    console.error('❌ Error creating SVG stamp strip:', error);
    throw error;
  }
}

async function generatePassWithSvgStamps() {
  try {
    console.log('📱 Generating pass with SVG stamp strip...');
    
    // Create SVG stamp strip
    const { stripPath, strip2xPath } = await createSvgStampStrip(6, 10);
    
    const passSigner = new PassSigner();

    const passData = {
      campaignId: '550e8400-e29b-41d4-a716-446655440001',
      campaignName: 'abba java CAFÉ',
      tenantName: 'MKTR Platform',
      customerEmail: 'test@mktr.sg',
      customerName: 'John Doe',
      stampsEarned: 6,
      stampsRequired: 10,
      colors: {
        foreground: 'rgb(255, 255, 255)',
        background: 'rgb(139, 69, 19)', // Coffee brown
        label: 'rgb(255, 255, 255)'
      }
    };
    
    console.log('🎨 SVG Stamp Strip Design:');
    console.log('- Clean SVG-generated stamp strip');
    console.log('- Rounded panel with shadow');
    console.log('- 10 empty circles (2 rows × 5 columns)');
    console.log('- Soft yellow background with warm stroke');
    console.log('- Professional appearance');
    
    const pkpassPath = await passSigner.generatePass(passData);
    
    console.log('✅ Pass with SVG stamp strip generated!');
    console.log(`📱 Pass file: ${pkpassPath}`);
    console.log('');
    console.log('📱 SVG Stamp Strip Features:');
    console.log('- Vector-based stamp strip generation');
    console.log('- Clean, professional appearance');
    console.log('- Proper Apple Wallet dimensions (320px width)');
    console.log('- Multiple resolution support (@1x, @2x, @3x)');
    console.log('- Rounded corners and subtle shadow');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

// Run the generation
generatePassWithSvgStamps();
