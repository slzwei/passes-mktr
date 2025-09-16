# Pass Generation Scripts

This directory contains the core pass generation scripts for the MKTR platform.

## Available Scripts

### Core Pass Generators
```bash
# Generate improved coffee pass (CURRENT WORKING VERSION)
node scripts/generate-improved-coffee-pass.js

# Generate pass with SVG stamp strip (RECOMMENDED)
node scripts/generate-pass-with-svg-stamps.js

# Generate pass with Hi logo stamps
node scripts/generate-hi-logo-pass.js
```

### Database Setup
```bash
# Create database tables
node scripts/setup-database.js
```

## Usage Examples

### Complete Test Flow
```bash
# 1. Setup database
./scripts/setup-database.js

# 2. Seed test data
./scripts/seed-database.js

# 3. Generate test pass
./scripts/generate-sample-pass.js --campaign-id test-campaign

# 4. Test pass signing
./scripts/test-pass-signing.js

# 5. Test APNs push
./scripts/test-apns-push.js --device-token test-device-token
```

### Development Workflow
```bash
# Start development server
npm run dev

# In another terminal, run tests
./scripts/test-pass-signing.js
./scripts/test-apns-push.js --device-token your-device-token
```

## Script Requirements

All scripts require:
- Node.js 18+
- Valid environment configuration
- Database connection (for database scripts)
- Apple certificates (for signing/push scripts)

## Error Handling

Scripts include comprehensive error handling:
- Configuration validation
- Certificate validation
- Database connection checks
- APNs connection verification
- Detailed error messages with troubleshooting tips

## Logging

All scripts log their operations:
- Success/failure status
- Processing time
- Error details
- Debug information (when verbose mode enabled)

## Security Notes

- Test scripts use development certificates only
- Never use production certificates in test scripts
- Scripts validate environment before execution
- Sensitive data is masked in logs
