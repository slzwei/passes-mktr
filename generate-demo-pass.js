const PassSigner = require('./src/services/passSigner');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Set environment variables
process.env.APPLE_TEAM_ID = '35L9ZSS9F9';
process.env.PASS_TYPE_ID = 'pass.com.mktr.wallet.new';
process.env.APPLE_CERT_PATH = '/Users/shawnlee/Documents/GitHub/passes-mktr/certs/apple/mktr-loyalty.p12';
process.env.APPLE_CERT_PASSWORD = 'changeme';

async function createStarStamps() {
  try {
    console.log('⭐ Creating star stamps with circular mask...');
    
    const stampsDir = path.join(process.cwd(), 'storage', 'images', 'stamps');
    await fs.mkdir(stampsDir, { recursive: true });
    
    // Create star SVG with circular background
    const starSvg = `
      <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <!-- Circular stamp background -->
        <circle cx="16" cy="16" r="15" fill="white" stroke="#FFD700" stroke-width="2"/>
        <!-- Star icon -->
        <path d="M16 6l2.5 5.1L24 12l-4.5 4.4L20.5 22l-4.5-2.4L11.5 22l1-5.6L8 12l5.5-.9L16 6z" 
              fill="#FFD700"/>
      </svg>
    `;
    
    // Create redeemed stamp (full opacity)
    const redeemedPath = path.join(stampsDir, 'star-redeemed.png');
    await sharp(Buffer.from(starSvg))
      .resize(32, 32)
      .png()
      .toFile(redeemedPath);
    
    // Create unredeemed stamp (30% opacity)
    const unredeemedPath = path.join(stampsDir, 'star-unredeemed.png');
    await sharp(Buffer.from(starSvg))
      .resize(32, 32)
      .modulate({ brightness: 0.3 })
      .png()
      .toFile(unredeemedPath);
    
    console.log('✅ Star stamps with circular mask created!');
    return { redeemedPath, unredeemedPath };
    
  } catch (error) {
    console.error('❌ Error creating star stamps:', error);
    throw error;
  }
}

async function createStarStampGrid(stampsEarned, stampsRequired, backgroundPath) {
  try {
    console.log('⭐ Creating star stamp grid...');
    
    const { redeemedPath, unredeemedPath } = await createStarStamps();
    
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
    const gap = 4;
    const stampSize = 28; // Larger size for circular stamps
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

    const stampsDir = path.join(process.cwd(), 'storage', 'images', 'stamps');
    const gridPath = path.join(stampsDir, `star_stamp_grid_${stampsEarned}_${stampsRequired}.png`);
    
    await sharp(backgroundBuffer)
      .composite(composites)
      .png()
      .toFile(gridPath);

    console.log(`✅ Star stamp grid created: ${stampsEarned}/${stampsRequired} stamps`);
    return gridPath;
    
  } catch (error) {
    console.error('❌ Error creating star stamp grid:', error);
    throw error;
  }
}

async function generateDemoPass() {
  try {
    console.log('🎯 Generating demo pass with star stamps...');
    
    // Create star stamp grid first
    const backgroundPath = path.join(process.cwd(), 'storage', 'images', 'strips', 'coffee-bean-texture.png');
    await createStarStampGrid(7, 10, backgroundPath);
    
    const passSigner = new PassSigner();

    const passData = {
      campaignId: '550e8400-e29b-41d4-a716-446655440001',
      campaignName: 'Stellar Coffee Co.',
      tenantName: 'MKTR Platform',
      customerEmail: 'demo@mktr.sg',
      customerName: 'Alex Johnson',
      stampsEarned: 7,
      stampsRequired: 10,
      colors: {
        foreground: 'rgb(255, 255, 255)',
        background: 'rgb(25, 25, 112)', // Midnight blue
        label: 'rgb(255, 255, 255)'
      }
    };
    
    console.log('🎨 Demo Pass Design:');
    console.log('- Circular star stamps with golden borders');
    console.log('- Midnight blue background for elegance');
    console.log('- Customer name: "Alex Johnson"');
    console.log('- Progress: 7 out of 10 stars earned');
    console.log('- Clean, professional layout');
    console.log('- Ready for Apple Wallet');
    
    const pkpassPath = await passSigner.generatePass(passData);
    
    console.log('✅ Demo pass generated successfully!');
    console.log(`📱 Pass file: ${pkpassPath}`);
    console.log('');
    console.log('⭐ Demo Pass Features:');
    console.log('- Circular star stamps with golden borders (7/10 earned)');
    console.log('- Premium midnight blue color scheme');
    console.log('- Personalized for Alex Johnson');
    console.log('- Stellar Coffee Co. branding');
    console.log('- QR code for redemption');
    console.log('- Apple Wallet compatible');
    console.log('');
    console.log('📱 To test:');
    console.log('1. Open the .pkpass file on your Mac');
    console.log('2. It will open in Wallet app');
    console.log('3. Add to your iPhone for testing');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

// Run the generation
generateDemoPass();
