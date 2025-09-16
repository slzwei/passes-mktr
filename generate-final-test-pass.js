/**
 * Generate final test pass with partner ID for verification
 */

// Set environment variables
process.env.APPLE_TEAM_ID = '35L9ZSS9F9';
process.env.PASS_TYPE_ID = 'pass.com.mktr.wallet.new';
process.env.APPLE_CERT_PATH = '/Users/shawnlee/Documents/GitHub/passes-mktr/certs/apple/mktr-loyalty.p12';
process.env.APPLE_CERT_PASSWORD = 'changeme';

const PassSigner = require('./src/services/passSigner');
const fs = require('fs');
const path = require('path');

async function generateFinalTestPass() {
  try {
    console.log('🎯 Generating final test pass with partner ID...\n');

    const passSigner = new PassSigner();

    // Test data with partner ID
    const passData = {
      campaignId: '550e8400-e29b-41d4-a716-446655440001',
      partnerId: '123e4567-e89b-12d3-a456-426614174000', // Sample partner UUID
      customerEmail: 'test@mktr.sg',
      customerName: 'John Doe',
      campaignName: 'Coffee Loyalty',
      tenantName: 'MKTR Platform',
      stampsEarned: 4,
      stampsRequired: 10,
      colors: {
        foreground: 'rgb(255, 255, 255)',
        background: 'rgb(139, 69, 19)',
        label: 'rgb(255, 255, 255)'
      }
    };

    console.log('📋 Pass Configuration:');
    console.log(`   Campaign: ${passData.campaignName}`);
    console.log(`   Customer: ${passData.customerName}`);
    console.log(`   Stamps: ${passData.stampsEarned}/${passData.stampsRequired}`);
    console.log(`   Partner ID: ${passData.partnerId}`);
    console.log(`   Colors: ${JSON.stringify(passData.colors)}\n`);

    // Generate the pass
    console.log('🔄 Generating pass...');
    const pkpassPath = await passSigner.generatePass(passData);
    
    console.log(`✅ Pass generated successfully!`);
    console.log(`📁 Location: ${pkpassPath}`);
    console.log(`📊 File size: ${(fs.statSync(pkpassPath).size / 1024).toFixed(2)} KB\n`);

    // Extract and show QR code details
    const tempDir = path.join(process.cwd(), 'temp_extract');
    await fs.promises.mkdir(tempDir, { recursive: true });
    
    const { execSync } = require('child_process');
    execSync(`cd ${tempDir} && unzip -o "${pkpassPath}"`, { stdio: 'pipe' });
    
    const passJsonPath = path.join(tempDir, 'pass.json');
    const passJson = JSON.parse(fs.readFileSync(passJsonPath, 'utf8'));
    
    console.log('🔍 QR Code Details:');
    console.log(`   Message: ${passJson.barcode.message}`);
    console.log(`   Format: ${passJson.barcode.format}`);
    console.log(`   Encoding: ${passJson.barcode.messageEncoding}\n`);
    
    // Parse QR code components
    const qrMessage = passJson.barcode.message;
    const parts = qrMessage.split(':');
    console.log('📊 QR Code Components:');
    console.log(`   Pass ID: ${parts[1]}`);
    console.log(`   Campaign ID: ${parts[3]}`);
    console.log(`   Partner ID: ${parts[5]}\n`);

    console.log('🎉 Final test pass ready for verification!');
    console.log('📱 You can now open the .pkpass file in Apple Wallet to verify:');
    console.log('   - The pass displays correctly');
    console.log('   - The QR code contains the partner ID');
    console.log('   - The layout is maintained');

    // Clean up
    await fs.promises.rmdir(tempDir, { recursive: true });

  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the generation
generateFinalTestPass();
