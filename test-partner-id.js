/**
 * Test script for partner ID in QR code
 * Tests the updated QR code generation with partner ID
 */

// Set environment variables
process.env.APPLE_TEAM_ID = '35L9ZSS9F9';
process.env.PASS_TYPE_ID = 'pass.com.mktr.wallet.new';
process.env.APPLE_CERT_PATH = '/Users/shawnlee/Documents/GitHub/passes-mktr/certs/apple/mktr-loyalty.p12';
process.env.APPLE_CERT_PASSWORD = 'changeme';

const PassSigner = require('./src/services/passSigner');
const fs = require('fs');
const path = require('path');

async function testPartnerIdInQR() {
  try {
    console.log('🔍 Testing Partner ID in QR Code...\n');

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

    console.log('📋 Test Data:');
    console.log(`   Campaign ID: ${passData.campaignId}`);
    console.log(`   Partner ID: ${passData.partnerId}`);
    console.log(`   Customer: ${passData.customerName}`);
    console.log(`   Stamps: ${passData.stampsEarned}/${passData.stampsRequired}\n`);

    // Test 1: Generate pass with partner ID
    console.log('1️⃣ Generating pass with partner ID...');
    const pkpassPath = await passSigner.generatePass(passData);
    console.log(`   ✅ Pass generated: ${pkpassPath}\n`);

    // Test 2: Extract and verify QR code content
    console.log('2️⃣ Extracting QR code content...');
    const tempDir = path.join(process.cwd(), 'temp_extract');
    await fs.promises.mkdir(tempDir, { recursive: true });
    
    // Extract the .pkpass file
    const { execSync } = require('child_process');
    execSync(`cd ${tempDir} && unzip -o "${pkpassPath}"`, { stdio: 'pipe' });
    
    const passJsonPath = path.join(tempDir, 'pass.json');
    const passJson = JSON.parse(fs.readFileSync(passJsonPath, 'utf8'));
    
    console.log('   QR Code Message:');
    console.log(`   ${passJson.barcode.message}\n`);
    
    // Verify QR code format
    const qrMessage = passJson.barcode.message;
    const expectedFormat = /^PASS_ID:[a-f0-9-]+:CAMPAIGN_ID:[a-f0-9-]+:PARTNER_ID:[a-f0-9-]+$/;
    
    if (expectedFormat.test(qrMessage)) {
      console.log('   ✅ QR code format is correct');
      
      // Parse the QR code components
      const parts = qrMessage.split(':');
      const passId = parts[1];
      const campaignId = parts[3];
      const partnerId = parts[5];
      
      console.log(`   Pass ID: ${passId}`);
      console.log(`   Campaign ID: ${campaignId}`);
      console.log(`   Partner ID: ${partnerId}\n`);
      
      // Verify partner ID matches
      if (partnerId === passData.partnerId) {
        console.log('   ✅ Partner ID matches input');
      } else {
        console.log('   ❌ Partner ID mismatch');
      }
    } else {
      console.log('   ❌ QR code format is incorrect');
    }

    // Test 3: Generate pass without partner ID (should use 'default')
    console.log('3️⃣ Testing pass without partner ID...');
    const passDataNoPartner = { ...passData };
    delete passDataNoPartner.partnerId;
    
    const pkpassPathNoPartner = await passSigner.generatePass(passDataNoPartner);
    console.log(`   ✅ Pass generated: ${pkpassPathNoPartner}\n`);
    
    // Extract and verify QR code for no partner case
    execSync(`cd ${tempDir} && unzip -o "${pkpassPathNoPartner}"`, { stdio: 'pipe' });
    const passJsonNoPartner = JSON.parse(fs.readFileSync(passJsonPath, 'utf8'));
    
    console.log('   QR Code Message (no partner):');
    console.log(`   ${passJsonNoPartner.barcode.message}\n`);
    
    if (passJsonNoPartner.barcode.message.includes(':PARTNER_ID:default')) {
      console.log('   ✅ Default partner ID used correctly');
    } else {
      console.log('   ❌ Default partner ID not used');
    }

    // Test 4: Test validation with invalid partner ID
    console.log('4️⃣ Testing validation with invalid partner ID...');
    const invalidPassData = { ...passData, partnerId: 'invalid-uuid' };
    
    try {
      passSigner.validatePassData(invalidPassData);
      console.log('   ❌ Validation should have failed');
    } catch (error) {
      console.log(`   ✅ Validation correctly rejected invalid partner ID: ${error.message}`);
    }

    console.log('\n🎉 Partner ID testing completed successfully!');
    console.log('\n📁 Generated files:');
    console.log(`   With Partner ID: ${pkpassPath}`);
    console.log(`   Without Partner ID: ${pkpassPathNoPartner}`);

    // Clean up
    await fs.promises.rmdir(tempDir, { recursive: true });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testPartnerIdInQR();
