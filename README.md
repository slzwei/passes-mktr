# MKTR Passes - Apple Wallet PassKit Platform

A complete Apple Wallet PassKit platform that allows tenants to create loyalty card campaigns, partners to issue passes to customers, and customers to collect and redeem stamps.

## ✅ STATUS: APPLE WALLET PASSES WORKING

**Apple Wallet pass generation is fully functional and tested!**
- ✅ Real .pkpass files generated
- ✅ Opens on Mac and iPhone
- ✅ Adds to Apple Wallet
- ✅ Proper Apple signatures
- ✅ All required files included
- ✅ **NEW**: SVG-based stamp strips with circular masks
- ✅ **NEW**: Perfect 2×5 grid layout with test icons
- ✅ **NEW**: Configurable icon size control

**Latest Working Pass**: `3c4a9bcb-d484-4415-bff5-b9bba77fdd90.pkpass`
**Features**: SVG stamp strip with circular test icons (4/10 earned)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Apple Developer Account
- Apple Pass Type ID certificate

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd passes-mktr
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb passes_mktr

   # Run migrations
   npm run db:migrate
   ```

4. **Set up Apple certificates**
   - Follow the manual steps in `docs/source-of-truth.md`
   - Place your .p12 certificate in the configured path
   - Update environment variables

5. **Start the server**
   ```bash
   npm run dev
   ```

## 📱 Apple Wallet Setup

### Apple Wallet Setup (VERIFIED WORKING)

1. **Pass Type ID**: `pass.com.mktr.wallet.new` ✅ **CONFIRMED WORKING**
2. **Team ID**: `35L9ZSS9F9` ✅ **CONFIRMED WORKING**
3. **Certificate**: `mktr-loyalty.p12` ✅ **CONFIRMED WORKING**
4. **Certificate Password**: `changeme` ✅ **CONFIRMED WORKING**

**Configure Environment**
```bash
APPLE_TEAM_ID=35L9ZSS9F9
PASS_TYPE_ID=pass.com.mktr.wallet.new
APPLE_CERT_PATH=/Users/shawnlee/Documents/GitHub/passes-mktr/certs/apple/mktr-loyalty.p12
APPLE_CERT_PASSWORD=changeme
```

**✅ Apple Wallet passes are fully functional and tested!**

## 🧪 Testing

### Generate Sample Pass
```bash
# Generate pass with SVG stamp strip (RECOMMENDED)
node scripts/generate-pass-with-svg-stamps.js

# Generate basic pass
npm run pass:generate
# OR
node scripts/create-proper-pass.js

# Generate pass with Hi logo stamps
node scripts/generate-hi-logo-pass.js

# Generate clean pass without stamps
node scripts/generate-clean-pass-no-stamps.js
```

This creates a test .pkpass file that you can:
- ✅ Open on an iOS device (VERIFIED WORKING)
- ✅ Add to Apple Wallet (VERIFIED WORKING)
- ✅ Test barcode scanning (VERIFIED WORKING)
- ✅ **NEW**: View circular stamp icons in 2×5 grid
- ✅ **NEW**: See earned vs unearned stamps with opacity

**Latest Working Pass**: `3c4a9bcb-d484-4415-bff5-b9bba77fdd90.pkpass`
**Features**: SVG stamp strip with circular test icons (4/10 earned)

### Test API Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Generate pass
curl -X POST http://localhost:3000/api/passes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "550e8400-e29b-41d4-a716-446655440001",
    "customerEmail": "test@example.com",
    "campaignName": "Coffee Loyalty",
    "tenantName": "MKTR Platform"
  }'
```

## 🏗️ Architecture

### System Components

- **Pass Signer Service**: Generates .pkpass files with Apple Wallet formatting
- **Web API**: REST endpoints for tenant and campaign management
- **Database**: PostgreSQL for data persistence
- **Redis**: Caching and session management
- **APNs**: Push notifications for pass updates

### Data Model

- **Tenants**: Platform customers who create campaigns
- **Campaigns**: Loyalty programs with stamp requirements
- **Passes**: Individual customer passes with stamp tracking
- **Partners**: Staff members who issue passes and scan redemptions
- **Devices**: APNs registration for push notifications
- **Redemptions**: Complete audit trail of all transactions

## 📚 API Documentation

### Pass Generation
```http
POST /api/passes/generate
Content-Type: application/json

{
  "campaignId": "uuid",
  "customerEmail": "customer@example.com",
  "campaignName": "Coffee Loyalty",
  "tenantName": "MKTR Platform",
  "stampsRequired": 10,
  "stampsEarned": 0,
  "colors": {
    "foreground": "rgb(255, 255, 255)",
    "background": "rgb(139, 69, 19)"
  }
}
```

### Pass Download
```http
GET /api/passes/{id}/download
# Returns .pkpass file
```

### Device Registration
```http
POST /api/passes/{id}/register-device
Content-Type: application/json

{
  "deviceToken": "device_token_here",
  "pushToken": "push_token_here"
}
```

## 🎨 WYSIWYG Editor

The platform includes a visual pass designer that allows tenants to:
- Customize pass appearance
- Set colors and branding
- Upload logos and images
- Preview passes in real-time
- Validate Apple Wallet compliance

## 🎯 Stamp Strip Configuration

### Icon Size Control

The stamp strip uses a configurable icon size multiplier in `src/services/stampStrip.js`:

```javascript
const diameter = Math.floor(Math.min(cellW, cellH) * 0.95);
```

**Key Parameters:**
- **`0.95`** - Default icon size multiplier (95% of available cell space)
- **Increase value** (e.g., `0.98`) - Makes stamps bigger
- **Decrease value** (e.g., `0.85`) - Makes stamps smaller
- **Range**: 0.1 to 1.0 (10% to 100% of cell size)

**Why this approach?**
- Apple Wallet strip height is fixed at 84px (@1x) / 168px (@2x)
- Cannot change the overall strip height
- Icon size multiplier allows fine-tuning stamp appearance
- Maintains proper spacing and visual balance

**Example Adjustments:**
```javascript
// Larger stamps (98% of cell space)
const diameter = Math.floor(Math.min(cellW, cellH) * 0.98);

// Smaller stamps (85% of cell space)  
const diameter = Math.floor(Math.min(cellW, cellH) * 0.85);

// Maximum size (100% of cell space)
const diameter = Math.floor(Math.min(cellW, cellH) * 1.0);
```

## 🔒 Security

- All passes are cryptographically signed
- API endpoints are rate-limited
- Input validation on all endpoints
- Secure certificate storage
- Audit logging for all operations

## 📊 Monitoring

- Comprehensive logging with Winston
- Request/response tracking
- Pass operation monitoring
- APNs delivery tracking
- Security event logging

## 🚀 Deployment

### Production Checklist

- [ ] Apple certificates configured
- [ ] Database migrations run
- [ ] Environment variables set
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup strategy implemented

### Docker Support

```bash
# Build image
docker build -t passes-mktr .

# Run container
docker run -p 3000:3000 --env-file .env passes-mktr
```

## 📖 Documentation

- `docs/source-of-truth.md` - Complete system specification
- `docs/checklists/` - Phase-specific implementation checklists
- `config/README.md` - Configuration guide
- `logs/README.md` - Logging system documentation

## 🤝 Contributing

1. Follow the established code style
2. Add tests for new features
3. Update documentation
4. Ensure Apple Wallet compliance

## 📄 License

MIT License - see LICENSE file for details
