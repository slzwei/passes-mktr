# MKTR Passes - Working Configuration

## ✅ VERIFIED WORKING SETUP

This document contains the exact configuration that has been tested and confirmed working for Apple Wallet pass generation.

### Apple Developer Configuration

**Team ID**: `35L9ZSS9F9`
**Pass Type ID**: `pass.com.mktr.wallet.new`
**Organization Name**: `MKTR`
**Domain**: `passes.mktr.sg`

### Certificate Details

**Certificate File**: `mktr-loyalty.p12`
**Location**: `/Users/shawnlee/Documents/GitHub/passes-mktr/certs/apple/mktr-loyalty.p12`
**Password**: `changeme`
**File Size**: 3,343 bytes
**Subject**: `Pass Type ID: pass.com.mktr.wallet.new`
**Issuer**: `Apple Worldwide Developer Relations Certification Authority`

### Environment Variables (WORKING)

```bash
# Apple Wallet Configuration
APPLE_TEAM_ID=35L9ZSS9F9
PASS_TYPE_ID=pass.com.mktr.wallet.new
APPLE_CERT_PATH=/Users/shawnlee/Documents/GitHub/passes-mktr/certs/apple/mktr-loyalty.p12
APPLE_CERT_PASSWORD=changeme

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/passes_mktr
DB_POOL_SIZE=10
DB_TIMEOUT=30

# Web Service Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Security
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
ENCRYPTION_KEY=your_32_character_encryption_key

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=logs/app.log

# File Storage
STORAGE_TYPE=local
STORAGE_PATH=./storage
```

### Required .pkpass File Structure (VERIFIED)

```
pass.json          # Main pass definition (1,387 bytes)
manifest.json      # SHA-1 hashes of all files (420 bytes)
signature          # PKCS#7 detached signature (2,153 bytes)
logo.png           # 29x29px (required)
logo@2x.png        # 58x58px (required)
icon.png           # 29x29px (required)
icon@2x.png        # 58x58px (required)
strip.png          # 320x84px (required)
strip@2x.png       # 640x168px (required)
```

**Total Files**: 9 files
**Total Size**: ~4,374 bytes

### Working Pass Generation

**Status**: ✅ **FULLY FUNCTIONAL**
**Last Generated**: `42f4f5fc-2011-4dc3-bcb7-f53b421c2792.pkpass`
**Test Results**: 
- ✅ Opens on Mac
- ✅ Opens on iPhone
- ✅ Adds to Apple Wallet
- ✅ Displays correctly in Wallet app
- ✅ QR code visible and scannable

### Commands That Work

```bash
# Generate a working pass
npm run pass:generate
# OR
node scripts/create-proper-pass.js

# Test certificate
npm run pass:test-cert
# OR
node scripts/test-cert-robust.js

# Test pass generation
npm run pass:test
# OR
node scripts/test-pass-only.js
```

### Pass.json Structure (WORKING)

```json
{
  "formatVersion": 1,
  "passTypeIdentifier": "pass.com.mktr.wallet.new",
  "serialNumber": "uuid-v4",
  "teamIdentifier": "35L9ZSS9F9",
  "organizationName": "MKTR",
  "description": "Campaign Name Loyalty Card",
  "logoText": "Campaign Name",
  "foregroundColor": "rgb(255, 255, 255)",
  "backgroundColor": "rgb(139, 69, 19)",
  "labelColor": "rgb(255, 255, 255)",
  "storeCard": {
    "primaryFields": [
      {
        "key": "balance",
        "label": "Stamps",
        "value": "3 of 10"
      }
    ],
    "secondaryFields": [
      {
        "key": "campaign",
        "label": "Campaign",
        "value": "Campaign Name"
      }
    ],
    "auxiliaryFields": [
      {
        "key": "nextReward",
        "label": "Next Reward",
        "value": "Free reward at 10 stamps"
      }
    ],
    "backFields": [
      {
        "key": "terms",
        "label": "Terms & Conditions",
        "value": "Valid at participating locations. Not transferable. Expires 1 year from issue date."
      },
      {
        "key": "contact",
        "label": "Contact",
        "value": "customer@email.com"
      }
    ],
    "barcode": {
      "message": "PASS_ID:uuid:CAMPAIGN_ID:uuid",
      "format": "PKBarcodeFormatQR",
      "messageEncoding": "iso-8859-1"
    }
  }
}
```

### Dependencies (WORKING)

```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "morgan": "^1.10.0",
  "winston": "^3.11.0",
  "pg": "^8.11.3",
  "redis": "^4.6.10",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "joi": "^17.11.0",
  "multer": "^1.4.5-lts.1",
  "sharp": "^0.32.6",
  "node-forge": "^1.3.1",
  "apn": "^2.2.0",
  "uuid": "^9.0.1",
  "dotenv": "^16.3.1",
  "express-rate-limit": "^7.1.5",
  "express-validator": "^7.0.1",
  "compression": "^1.7.4",
  "cookie-parser": "^1.4.6",
  "adm-zip": "^0.5.10"
}
```

### Troubleshooting

**If passes don't open:**
1. Ensure all 9 required files are included
2. Check manifest.json has SHA-1 hashes for all files
3. Verify certificate password is correct
4. Ensure Pass Type ID matches certificate
5. Check Team ID matches Apple Developer account

**Certificate Issues:**
- Use `npm run pass:test-cert` to verify certificate
- Ensure certificate is in P12 format
- Verify password is correct
- Check certificate hasn't expired

### Next Steps

1. ✅ Apple Wallet pass generation - WORKING
2. 🔄 WYSIWYG editor for pass design
3. 🔄 Web service API endpoints
4. 🔄 Database setup and migrations
5. 🔄 Partner portal interface
6. 🔄 Redemption flow implementation

**Last Updated**: September 16, 2025
**Status**: Apple Wallet passes fully functional and tested
