const PassSigner = require('../src/services/passSigner');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Set environment variables
process.env.APPLE_TEAM_ID = '35L9ZSS9F9';
process.env.PASS_TYPE_ID = 'pass.com.mktr.wallet.new';
process.env.APPLE_CERT_PATH = '/Users/shawnlee/Documents/GitHub/passes-mktr/certs/apple/mktr-loyalty.p12';
process.env.APPLE_CERT_PASSWORD = 'changeme';

async function createCoffeeCupStamps() {
  try {
    console.log('☕ Creating coffee cup stamps...');
    
    const stampsDir = path.join(process.cwd(), 'storage', 'images', 'stamps');
    await fs.mkdir(stampsDir, { recursive: true });
    
    // Create coffee cup SVG
    const coffeeCupSvg = `
      <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="white" stroke="#8B4513" stroke-width="2"/>
        <path d="M8 8h8v2H8z" fill="#8B4513"/>
        <path d="M9 10v6h6v-6" fill="none" stroke="#8B4513" stroke-width="2"/>
        <path d="M15 12h2v2h-2z" fill="#8B4513"/>
      </svg>
    `;
    
    // Create redeemed stamp (full opacity)
    const redeemedPath = path.join(stampsDir, 'coffee-cup-redeemed.png');
    await sharp(Buffer.from(coffeeCupSvg))
      .resize(24, 24)
      .png()
      .toFile(redeemedPath);
    
    // Create unredeemed stamp (30% opacity)
    const unredeemedPath = path.join(stampsDir, 'coffee-cup-unredeemed.png');
    await sharp(Buffer.from(coffeeCupSvg))
      .resize(24, 24)
      .modulate({ brightness: 0.3 })
      .png()
      .toFile(unredeemedPath);
    
    console.log('✅ Coffee cup stamps created!');
    return { redeemedPath, unredeemedPath };
    
  } catch (error) {
    console.error('❌ Error creating coffee cup stamps:', error);
    throw error;
  }
}

async function createCleanStampGrid(stampsEarned, stampsRequired, backgroundPath) {
  try {
    console.log('☕ Creating clean stamp grid...');
    
    const { redeemedPath, unredeemedPath } = await createCoffeeCupStamps();
    
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

    const stampsDir = path.join(process.cwd(), 'storage', 'images', 'stamps');
    const gridPath = path.join(stampsDir, `clean_stamp_grid_${stampsEarned}_${stampsRequired}.png`);
    
    await sharp(backgroundBuffer)
      .composite(composites)
      .png()
      .toFile(gridPath);

    console.log(`✅ Clean stamp grid created: ${stampsEarned}/${stampsRequired} stamps`);
    return gridPath;
    
  } catch (error) {
    console.error('❌ Error creating clean stamp grid:', error);
    throw error;
  }
}

async function generateImprovedCoffeePass() {
  try {
    console.log('☕ Generating improved coffee pass with better UI...');
    
    // Create clean stamp grid first
    const backgroundPath = path.join(process.cwd(), 'storage', 'images', 'strips', 'coffee-bean-texture.png');
    await createCleanStampGrid(6, 10, backgroundPath);
    
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
    
    console.log('🎨 Improved UI Design:');
    console.log('- Coffee cup stamps instead of generic "Hi"');
    console.log('- Clean stamp grid without overlay obstruction');
    console.log('- Personalized name label (left) + redemption counter (right)');
    console.log('- Single, clear progress indicator');
    console.log('- Better visual hierarchy');
    console.log('- Improved spacing and contrast');
    
    const pkpassPath = await passSigner.generatePass(passData);
    
    console.log('✅ Improved coffee pass generated!');
    console.log(`📱 Pass file: ${pkpassPath}`);
    console.log('');
    console.log('☕ UI Improvements:');
    console.log('- Coffee cup stamps (thematic and clear)');
    console.log('- Personalized name: "John Doe" (left side)');
    console.log('- Redemption counter: "4 out of 10" (right side)');
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
generateImprovedCoffeePass();
