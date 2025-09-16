# Apple Wallet PassKit System - Source of Truth

## System Overview (Layman's Terms)

This system allows businesses (tenants) to create digital loyalty card campaigns that partners can distribute to customers. Customers collect these passes in their Apple Wallet, earn stamps through purchases, and redeem them for rewards. Think of it like a digital punch card system that lives in your iPhone's Wallet app.

**Key Players:**
- **Tenants**: Businesses that create campaigns (e.g., coffee shops, restaurants)
- **Partners**: Staff members who issue passes and scan for redemptions
- **Customers**: End users who collect passes and earn stamps

**Core Flow:**
1. Tenant creates a campaign with stamp rules
2. Partner generates a pass for a customer
3. Customer adds pass to Apple Wallet
4. Customer makes purchases, partner scans barcode to add stamps
5. Customer redeems stamps for rewards

## Phase 1 - Foundations

### System Components

**Pass Signer Service**
- Generates .pkpass files with proper Apple Wallet formatting
- Handles pass signing with Apple certificates
- Creates manifest.json with SHA-1 hashes
- Packages all files into .pkpass bundle

**Web Service**
- REST API for tenant and partner management
- Campaign and pass creation endpoints
- Redemption tracking and stamp management
- APNs push notification handling

**Apple Push Notification Service (APNs)**
- Sends updates to customer devices when passes change
- Triggers when stamps are added or redeemed
- Ensures passes stay current in Apple Wallet

**Partner Portal**
- Web interface for partners to issue passes
- Barcode scanning for redemptions
- Campaign management tools

### .pkpass File Structure

A .pkpass file is a ZIP archive containing these required files:

```
pass.json          # Main pass definition (Apple's format)
manifest.json      # SHA-1 hashes of all files
signature          # PKCS#7 detached signature
logo.png           # 29x29px, 2x: 58x58px
logo@2x.png        # 58x58px for Retina displays
icon.png           # 29x29px, 2x: 58x58px  
icon@2x.png        # 58x58px for Retina displays
strip.png          # 320x84px, 2x: 640x168px
strip@2x.png       # 640x168px for Retina displays
```

**pass.json Structure:**
```json
{
  "formatVersion": 1,
  "passTypeIdentifier": "pass.com.tenant.campaign",
  "serialNumber": "unique-pass-id",
  "teamIdentifier": "TEAM123456",
  "organizationName": "Tenant Name",
  "description": "Loyalty Card",
  "logoText": "Campaign Name",
  "foregroundColor": "rgb(255, 255, 255)",
  "backgroundColor": "rgb(60, 65, 76)",
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
        "value": "Coffee Loyalty"
      }
    ],
    "auxiliaryFields": [
      {
        "key": "nextReward",
        "label": "Next Reward",
        "value": "Free Coffee at 10 stamps"
      }
    ],
    "backFields": [
      {
        "key": "terms",
        "label": "Terms & Conditions",
        "value": "Valid at participating locations..."
      }
    ],
    "barcode": {
      "message": "PASS_ID:12345:CAMPAIGN_ID:67890",
      "format": "PKBarcodeFormatQR",
      "messageEncoding": "iso-8859-1"
    }
  }
}
```

### Data Model

**Tenants Table**
```sql
id (UUID, PK)
name (VARCHAR)
apple_team_id (VARCHAR)
pass_type_id (VARCHAR)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**Campaigns Table**
```sql
id (UUID, PK)
tenant_id (UUID, FK)
name (VARCHAR)
description (TEXT)
stamps_required (INTEGER)
reward_description (TEXT)
is_active (BOOLEAN)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**Passes Table**
```sql
id (UUID, PK)
campaign_id (UUID, FK)
serial_number (VARCHAR, UNIQUE)
customer_email (VARCHAR)
stamps_earned (INTEGER, DEFAULT 0)
is_redeemed (BOOLEAN, DEFAULT FALSE)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**Devices Table**
```sql
id (UUID, PK)
pass_id (UUID, FK)
device_token (VARCHAR)
push_token (VARCHAR)
created_at (TIMESTAMP)
```

**Redemptions Table**
```sql
id (UUID, PK)
pass_id (UUID, FK)
partner_id (UUID, FK)
stamps_added (INTEGER)
redemption_type (ENUM: 'stamp', 'reward')
created_at (TIMESTAMP)
```

### Required Images

All images must be PNG format with specific dimensions:

- **logo.png**: 29x29px (standard), 58x58px (@2x)
- **icon.png**: 29x29px (standard), 58x58px (@2x)  
- **strip.png**: 320x84px (standard), 640x168px (@2x)

Images should be optimized for Apple Wallet display and follow Apple's design guidelines.

### Manual Step: Apple Pass Type ID Setup

**Prerequisites:**
- Apple Developer Account ($99/year)
- Access to Apple Developer Portal

**Steps:**
1. Log into Apple Developer Portal
2. Navigate to Certificates, Identifiers & Profiles
3. Create new Pass Type ID:
   - Identifier: `pass.com.yourcompany.loyalty`
   - Description: "Loyalty Card Passes"
4. Generate Pass Type ID Certificate:
   - Download certificate (.cer file)
   - Convert to .p12 format with password
   - Store securely for pass signing
5. Note your Team Identifier (10-character string)

**Security Notes:**
- Store certificates in secure environment variables
- Never commit certificates to version control
- Implement certificate rotation procedures

### Phase 1 Acceptance Checklist

- [ ] Source of truth document created and structured
- [ ] System components clearly defined
- [ ] .pkpass file structure documented with examples
- [ ] Data model designed with all required tables
- [ ] Image requirements specified
- [ ] Apple Pass Type ID setup process documented
- [ ] Manual steps clearly marked
- [ ] Phase 1 acceptance checklist complete

## Phase 2 - Web Service & Signing

*[To be completed]*

## Phase 3 - Multi-tenant & Campaigns

*[To be completed]*

## Phase 4 - Partner Tools & Redemption Flow

*[To be completed]*

## Phase 5 - Polish & Operations

*[To be completed]*

## Platform Configuration

### Apple Developer Account (VERIFIED WORKING)
- **Team ID**: `35L9ZSS9F9`
- **Domain**: `passes.mktr.sg`
- **Pass Type ID**: `pass.com.mktr.wallet.new` ✅ **WORKING**
- **Organization Name**: `MKTR`
- **Certificate Path**: `/Users/shawnlee/Documents/GitHub/passes-mktr/certs/apple/mktr-loyalty.p12`
- **Certificate Password**: `changeme`

### Technical Stack Decision
**Chosen Stack**: Node.js + Express + PostgreSQL + Redis
- **Scalability**: Handles 50+ tenants easily
- **Apple PassKit**: Excellent Node.js libraries available
- **Deployment**: Simple with Docker + cloud providers
- **Documentation**: Extensive online resources
- **Error Handling**: Mature ecosystem with proven solutions

### WYSIWYG Editor Integration
- Tenants will design their own pass appearance
- Platform provides the editor interface
- Real-time preview of pass designs
- Apple Wallet compliance validation

## ✅ WORKING CONFIGURATION (VERIFIED)

### Apple PassKit Setup (CONFIRMED WORKING)
- **Pass Type ID**: `pass.com.mktr.wallet.new`
- **Team ID**: `35L9ZSS9F9`
- **Certificate**: `mktr-loyalty.p12` (3,343 bytes)
- **Certificate Password**: `changeme`
- **Certificate Subject**: `Pass Type ID: pass.com.mktr.wallet.new`
- **Certificate Issuer**: `Apple Worldwide Developer Relations Certification Authority`

### Required .pkpass File Structure (VERIFIED)
```
pass.json          # Main pass definition
manifest.json      # SHA-1 hashes of all files
signature          # PKCS#7 detached signature
logo.png           # 29x29px (required)
logo@2x.png        # 58x58px (required)
icon.png           # 29x29px (required)
icon@2x.png        # 58x58px (required)
strip.png          # 320x84px (required)
strip@2x.png       # 640x168px (required)
```

### Working Pass Generation
- **Status**: ✅ **FULLY FUNCTIONAL**
- **Last Generated**: `42f4f5fc-2011-4dc3-bcb7-f53b421c2792.pkpass`
- **File Size**: 4,374 bytes
- **Files Included**: 9 files (all required)
- **Apple Wallet**: ✅ **OPENS AND WORKS**

### Environment Variables (WORKING)
```bash
APPLE_TEAM_ID=35L9ZSS9F9
PASS_TYPE_ID=pass.com.mktr.wallet.new
APPLE_CERT_PATH=/Users/shawnlee/Documents/GitHub/passes-mktr/certs/apple/mktr-loyalty.p12
APPLE_CERT_PASSWORD=changeme
```

## Logging Plan

### Request/Response Logging
- All API endpoints log request ID, timestamp, user ID, endpoint
- Response status codes and processing time
- Error details with stack traces

### Pass Operations
- Pass creation with campaign ID and serial number
- Pass signing success/failure with certificate details
- Pass updates and APNs push notifications

### Redemption Tracking
- Barcode scans with pass ID and partner ID
- Stamp additions with before/after counts
- Reward redemptions with validation results

### Security Events
- Certificate validation failures
- Invalid pass attempts
- Unauthorized access attempts

## Next Steps

1. Complete Phase 1 acceptance checklist
2. Set up repository structure with required directories
3. Create configuration templates
4. Begin Phase 2 implementation planning
