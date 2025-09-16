/**
 * Test script for refactored pass generation
 * Tests the new configuration service and generates a test pass
 */

// Set environment variables
process.env.APPLE_TEAM_ID = '35L9ZSS9F9';
process.env.PASS_TYPE_ID = 'pass.com.mktr.wallet.new';
process.env.APPLE_CERT_PATH = '/Users/shawnlee/Documents/GitHub/passes-mktr/certs/apple/mktr-loyalty.p12';
process.env.APPLE_CERT_PASSWORD = 'changeme';

const PassSigner = require('./src/services/passSigner');
const PassConfigService = require('./src/services/passConfigService');
const fs = require('fs');
const path = require('path');

async function testRefactoredPass() {
  try {
    console.log('🧪 Testing refactored pass generation...\n');

    // Initialize services
    const passSigner = new PassSigner();
    const configService = new PassConfigService();

    // Test data
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

    console.log('📋 Test Data:');
    console.log(`   Campaign: ${passData.campaignName}`);
    console.log(`   Customer: ${passData.customerName}`);
    console.log(`   Stamps: ${passData.stampsEarned}/${passData.stampsRequired}`);
    console.log(`   Colors: ${JSON.stringify(passData.colors)}\n`);

    // Test 1: Default configuration
    console.log('1️⃣ Testing default configuration...');
    const defaultConfig = configService.getLoyaltyCardConfig(passData);
    console.log('   ✅ Default config generated');
    console.log(`   Header fields: ${defaultConfig.fields.header.length}`);
    console.log(`   Secondary fields: ${defaultConfig.fields.secondary.length}`);
    console.log(`   Back fields: ${defaultConfig.fields.back.length}\n`);

    // Test 2: Configuration validation
    console.log('2️⃣ Testing configuration validation...');
    const validation = configService.validateConfig(defaultConfig);
    console.log(`   Validation result: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
    if (!validation.isValid) {
      console.log(`   Errors: ${validation.errors.join(', ')}`);
    }
    console.log('');

    // Test 3: Generate preview (unsigned pass)
    console.log('3️⃣ Generating preview pass...');
    const previewDir = await passSigner.generatePreview(passData);
    console.log(`   ✅ Preview generated in: ${previewDir}`);
    
    // Check preview files
    const previewFiles = fs.readdirSync(previewDir);
    console.log(`   Files created: ${previewFiles.join(', ')}\n`);

    // Test 4: Generate full signed pass
    console.log('4️⃣ Generating full signed pass...');
    const pkpassPath = await passSigner.generatePass(passData);
    console.log(`   ✅ Signed pass generated: ${pkpassPath}\n`);

    // Test 5: Custom configuration
    console.log('5️⃣ Testing custom configuration...');
    const customConfig = {
      colors: {
        foreground: 'rgb(0, 0, 0)',
        background: 'rgb(255, 255, 255)',
        label: 'rgb(100, 100, 100)'
      },
      fields: {
        header: [
          {
            key: 'campaign',
            label: 'Campaign',
            value: passData.campaignName,
            textAlignment: 'PKTextAlignmentCenter'
          }
        ],
        primary: [
          {
            key: 'balance',
            label: 'Stamps',
            value: `${passData.stampsEarned} of ${passData.stampsRequired}`,
            textAlignment: 'PKTextAlignmentCenter'
          }
        ],
        secondary: [
          {
            key: 'customerInfo',
            label: 'Card Holder',
            value: passData.customerName,
            textAlignment: 'PKTextAlignmentLeft'
          }
        ],
        auxiliary: [],
        back: [
          {
            key: 'terms',
            label: 'Terms & Conditions',
            value: 'Valid at participating locations. Not transferable. Expires 1 year from issue date.',
            textAlignment: 'PKTextAlignmentLeft'
          },
          {
            key: 'contact',
            label: 'Contact',
            value: passData.customerEmail,
            textAlignment: 'PKTextAlignmentLeft'
          }
        ]
      }
    };

    const customPassPath = await passSigner.generatePass(passData, customConfig);
    console.log(`   ✅ Custom pass generated: ${customPassPath}\n`);

    // Test 6: Field templates
    console.log('6️⃣ Testing field templates...');
    const templates = configService.getAllFieldTemplates();
    console.log(`   Available templates:`);
    Object.keys(templates).forEach(fieldType => {
      const fieldTemplates = Object.keys(templates[fieldType]);
      console.log(`     ${fieldType}: ${fieldTemplates.join(', ')}`);
    });
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📁 Generated files:');
    console.log(`   Preview: ${previewDir}`);
    console.log(`   Default pass: ${pkpassPath}`);
    console.log(`   Custom pass: ${customPassPath}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testRefactoredPass();
