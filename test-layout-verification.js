/**
 * Test script to verify pass layout is maintained after refactoring
 * Generates a test pass for visual verification
 */

// Set environment variables
process.env.APPLE_TEAM_ID = '35L9ZSS9F9';
process.env.PASS_TYPE_ID = 'pass.com.mktr.wallet.new';
process.env.APPLE_CERT_PATH = '/Users/shawnlee/Documents/GitHub/passes-mktr/certs/apple/mktr-loyalty.p12';
process.env.APPLE_CERT_PASSWORD = 'changeme';

const PassSigner = require('./src/services/passSigner');
const fs = require('fs');
const path = require('path');

async function generateTestPass() {
  try {
    console.log('🎨 Generating test pass for layout verification...\n');

    const passSigner = new PassSigner();

    // Test data with the same structure as before refactoring
    const passData = {
      campaignId: '550e8400-e29b-41d4-a716-446655440001',
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

    console.log('📋 Pass Data:');
    console.log(`   Campaign: ${passData.campaignName}`);
    console.log(`   Customer: ${passData.customerName}`);
    console.log(`   Stamps: ${passData.stampsEarned}/${passData.stampsRequired}`);
    console.log(`   Colors: ${JSON.stringify(passData.colors)}\n`);

    // Generate the pass using the refactored system
    console.log('🔄 Generating pass with refactored system...');
    const pkpassPath = await passSigner.generatePass(passData);
    
    console.log(`✅ Pass generated successfully!`);
    console.log(`📁 Location: ${pkpassPath}`);
    console.log(`📊 File size: ${(fs.statSync(pkpassPath).size / 1024).toFixed(2)} KB\n`);

    // Extract and show the pass.json content for verification
    const tempDir = path.join(process.cwd(), 'temp_extract');
    await fs.promises.mkdir(tempDir, { recursive: true });
    
    // Extract the .pkpass file to see the contents
    const { execSync } = require('child_process');
    execSync(`cd ${tempDir} && unzip -o "${pkpassPath}"`, { stdio: 'pipe' });
    
    const passJsonPath = path.join(tempDir, 'pass.json');
    const passJson = JSON.parse(fs.readFileSync(passJsonPath, 'utf8'));
    
    console.log('📄 Pass.json Structure:');
    console.log(`   Header Fields: ${passJson.headerFields.length}`);
    console.log(`   Primary Fields: ${passJson.storeCard.primaryFields.length}`);
    console.log(`   Secondary Fields: ${passJson.storeCard.secondaryFields.length}`);
    console.log(`   Auxiliary Fields: ${passJson.storeCard.auxiliaryFields.length}`);
    console.log(`   Back Fields: ${passJson.storeCard.backFields.length}\n`);
    
    console.log('🎯 Field Details:');
    console.log('   Header Fields:');
    passJson.headerFields.forEach(field => {
      console.log(`     - ${field.label}: ${field.value}`);
    });
    
    console.log('   Secondary Fields:');
    passJson.storeCard.secondaryFields.forEach(field => {
      console.log(`     - ${field.label}: ${field.value}`);
    });
    
    console.log('   Back Fields:');
    passJson.storeCard.backFields.forEach(field => {
      console.log(`     - ${field.label}: ${field.value.substring(0, 50)}...`);
    });

    console.log('\n🎉 Layout verification complete!');
    console.log('📱 You can now open the .pkpass file in Apple Wallet to verify the layout is maintained.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
generateTestPass();
