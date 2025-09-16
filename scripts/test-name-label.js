const { buildNameLabel } = require('../src/services/nameLabelService');
const fs = require('fs').promises;
const path = require('path');

async function testNameLabel() {
  try {
    console.log('🧪 Testing name label service...');
    
    const { x1, x2, x3, size } = await buildNameLabel({
      name: 'John Doe',
      width: 320,
      height: 40,
      fontSize: 18,
      fontColor: '#333333',
      align: 'center',
      bgColor: 'transparent'
    });
    
    // Save test images
    const testDir = path.join(process.cwd(), 'temp_check');
    await fs.mkdir(testDir, { recursive: true });
    
    await fs.writeFile(path.join(testDir, 'name-label-test.png'), x1);
    await fs.writeFile(path.join(testDir, 'name-label-test@2x.png'), x2);
    await fs.writeFile(path.join(testDir, 'name-label-test@3x.png'), x3);
    
    console.log('✅ Name label service working!');
    console.log(`📏 Size: ${size.w}x${size.h}px`);
    console.log(`📁 Test images saved to temp_check/`);
    console.log(`- name-label-test.png (${x1.length} bytes)`);
    console.log(`- name-label-test@2x.png (${x2.length} bytes)`);
    console.log(`- name-label-test@3x.png (${x3.length} bytes)`);
    
  } catch (error) {
    console.error('❌ Name label service test failed:', error);
  }
}

testNameLabel();
