const PassSigner = require('../src/services/passSigner');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Set environment variables
process.env.APPLE_TEAM_ID = '35L9ZSS9F9';
process.env.PASS_TYPE_ID = 'pass.com.mktr.wallet.new';
process.env.APPLE_CERT_PATH = '/Users/shawnlee/Documents/GitHub/passes-mktr/certs/apple/mktr-loyalty.p12';
process.env.APPLE_CERT_PASSWORD = 'changeme';

async function createHiLogoStampGrid(stampsEarned, stampsRequired, backgroundPath) {
  try {
    console.log('📱 Creating Hi logo stamp grid...');
    
    const stampsDir = path.join(process.cwd(), 'storage', 'images', 'stamps');
    await fs.mkdir(stampsDir, { recursive: true });
    
    // Use existing Hi logo stamps
    const redeemedPath = path.join(stampsDir, 'hi-logo-redeemed.png');
    const unredeemedPath = path.join(stampsDir, 'hi-logo-unredeemed.png');
    
    // Check if Hi logo stamps exist
    if (!(await fs.access(redeemedPath).then(() => true).catch(() => false))) {
      throw new Error('Hi logo redeemed stamp not found');
    }
    if (!(await fs.access(unredeemedPath).then(() => true).catch(() => false))) {
      throw new Error('Hi logo unredeemed stamp not found');
    }
    
    const stripWidth = 320;
    const stripHeight = 84;
    const stampsPerRow = 5;
    const rows = Math.ceil(stampsRequired / stampsPerRow);
    
    // Load background image
    const backgroundBuffer = await sharp(backgroundPath)
      .resize(stripWidth, stripHeight)
      .png()
      .toBuffer();

    // Generate stamps
    const stamps = [];
    for (let i = 0; i < stampsRequired; i++) {
      const isRedeemed = i < stampsEarned;
      const stampPath = isRedeemed ? redeemedPath : unredeemedPath;
      stamps.push({ path: stampPath, isRedeemed });
    }
    
    // Composite stamps onto background
    const composites = [];
    
    // Calculate spacing with proper gaps between stamps
    const gap = 6; // Slightly larger gap for better visual separation
    const stampSize = 22; // Slightly smaller for better fit
    const totalStampsWidth = (stampsPerRow * stampSize) + ((stampsPerRow - 1) * gap);
    const startX = 8 + Math.floor((stripWidth - 16 - totalStampsWidth) / 2);
    const startY = 8 + Math.floor((stripHeight - 16 - (rows * stampSize + (rows - 1) * gap)) / 2);
    
    for (let i = 0; i < stamps.length; i++) {
      const stamp = stamps[i];
      const row = Math.floor(i / stampsPerRow);
      const col = i % stampsPerRow;
      
      const x = startX + (col * (stampSize + gap));
      const y = startY + (row * (stampSize + gap));

      composites.push({
        input: stamp.path,
        top: y,
        left: x
      });
    }

    const gridPath = path.join(stampsDir, `hi_logo_stamp_grid_${stampsEarned}_${stampsRequired}.png`);
    
    await sharp(backgroundBuffer)
      .composite(composites)
      .png()
      .toFile(gridPath);

    console.log(`✅ Hi logo stamp grid created: ${stampsEarned}/${stampsRequired} stamps`);
    return gridPath;
    
  } catch (error) {
    console.error('❌ Error creating Hi logo stamp grid:', error);
    throw error;
  }
}

async function generateHiLogoPass() {
  try {
    console.log('📱 Generating pass with Hi logo stamps...');
    
    // Create Hi logo stamp grid first
    const backgroundPath = path.join(process.cwd(), 'storage', 'images', 'strips', 'coffee-bean-texture.png');
    await createHiLogoStampGrid(4, 10, backgroundPath);
    
    const passSigner = new PassSigner();

    const passData = {
      campaignId: '550e8400-e29b-41d4-a716-446655440001',
      campaignName: 'abba java CAFÉ',
      tenantName: 'MKTR Platform',
      customerEmail: 'test@mktr.sg',
      stampsEarned: 4,
      stampsRequired: 10,
      colors: {
        foreground: 'rgb(255, 255, 255)',
        background: 'rgb(139, 69, 19)', // Coffee brown
        label: 'rgb(255, 255, 255)'
      }
    };
    
    console.log('🎨 Hi Logo Design:');
    console.log('- Using existing Hi logo stamps');
    console.log('- Clean stamp grid without overlay obstruction');
    console.log('- Single, clear progress indicator');
    console.log('- Better visual hierarchy');
    console.log('- Improved spacing and contrast');
    
    const pkpassPath = await passSigner.generatePass(passData);
    
    console.log('✅ Hi logo pass generated!');
    console.log(`📱 Pass file: ${pkpassPath}`);
    console.log('');
    console.log('📱 Hi Logo Features:');
    console.log('- Hi logo stamps (using existing PNG files)');
    console.log('- No overlay obstruction of stamps');
    console.log('- Single progress text: "6 stamps until reward"');
    console.log('- Better spacing and visual separation');
    console.log('- Cleaner, more professional layout');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

// Run the generation
generateHiLogoPass();
