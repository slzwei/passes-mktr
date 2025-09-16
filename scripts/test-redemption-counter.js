const { buildRedemptionCounter } = require('../src/services/redemptionCounterService');
const fs = require('fs').promises;
const path = require('path');

async function testRedemptionCounter() {
  try {
    console.log('🧪 Testing redemption counter service...');
    
    const { x1, x2, x3, size } = await buildRedemptionCounter({
      redeemed: 4,
      total: 10,
      width: 120,
      height: 40,
      fontSize: 14,
      fontColor: '#666666',
      bgColor: 'transparent'
    });
    
    // Save test images
    const testDir = path.join(process.cwd(), 'temp_check');
    await fs.mkdir(testDir, { recursive: true });
    
    await fs.writeFile(path.join(testDir, 'redemption-counter-test.png'), x1);
    await fs.writeFile(path.join(testDir, 'redemption-counter-test@2x.png'), x2);
    await fs.writeFile(path.join(testDir, 'redemption-counter-test@3x.png'), x3);
    
    console.log('✅ Redemption counter service working!');
    console.log(`📏 Size: ${size.w}x${size.h}px`);
    console.log(`📁 Test images saved to temp_check/`);
    console.log(`- redemption-counter-test.png (${x1.length} bytes)`);
    console.log(`- redemption-counter-test@2x.png (${x2.length} bytes)`);
    console.log(`- redemption-counter-test@3x.png (${x3.length} bytes)`);
    console.log(`📊 Display: "4 out of 10"`);
    
  } catch (error) {
    console.error('❌ Redemption counter service test failed:', error);
  }
}

testRedemptionCounter();
