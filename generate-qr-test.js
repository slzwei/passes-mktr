const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');

async function generateQRTest() {
  try {
    console.log('🔍 Generating QR code test...');
    
    // The message from the latest pass
    const message = 'PASS_ID:b3a3218a-a27c-472a-a616-16c5eeb8c585:CAMPAIGN_ID:550e8400-e29b-41d4-a716-446655440001';
    
    // Generate QR code as PNG
    const qrCodeDataURL = await QRCode.toDataURL(message, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Convert data URL to buffer
    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Save QR code image
    const qrPath = path.join(process.cwd(), 'qr-code-test.png');
    await fs.writeFile(qrPath, buffer);
    
    console.log('✅ QR code generated successfully!');
    console.log(`📱 QR Code saved to: ${qrPath}`);
    console.log(`📝 Message: ${message}`);
    console.log('');
    console.log('This QR code contains the same data as your Apple Wallet pass.');
    console.log('The QR code in Apple Wallet will look similar to this.');
    
  } catch (error) {
    console.error('❌ Error generating QR code:', error);
  }
}

generateQRTest();
