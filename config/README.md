# Configuration Guide

## Required Environment Variables

### Database Configuration
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/passes_mktr
DB_POOL_SIZE=10
DB_TIMEOUT=30
```

### Apple Wallet Configuration
```bash
# Apple Developer Team ID (10-character string)
APPLE_TEAM_ID=TEAM123456

# Pass Type ID (reverse domain format)
PASS_TYPE_ID=pass.com.yourcompany.loyalty

# Path to Apple certificate files (P12 format)
APPLE_CERT_PATH=/path/to/certificate.p12
APPLE_CERT_PASSWORD=your_certificate_password

# Apple Push Notification Service
APNS_KEY_ID=your_apns_key_id
APNS_TEAM_ID=your_team_id
APNS_BUNDLE_ID=com.yourcompany.passes
APNS_ENVIRONMENT=sandbox  # or 'production'
```

### Web Service Configuration
```bash
# Server settings
PORT=3000
HOST=0.0.0.0
NODE_ENV=development  # or 'production'

# CORS settings
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### Security Configuration
```bash
# JWT settings
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Encryption keys
ENCRYPTION_KEY=your_32_character_encryption_key

# API keys
API_KEY_HEADER=X-API-Key
```

### Logging Configuration
```bash
LOG_LEVEL=info  # debug, info, warn, error
LOG_FORMAT=json  # json or pretty
LOG_FILE=logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5
```

### External Services
```bash
# Redis for caching (optional)
REDIS_URL=redis://localhost:6379

# Email service (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# File storage (for pass images)
STORAGE_TYPE=local  # or 's3'
STORAGE_PATH=/path/to/storage
# If using S3:
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

## Configuration Files

### Development (.env.development)
```bash
NODE_ENV=development
LOG_LEVEL=debug
DATABASE_URL=postgresql://localhost:5432/passes_mktr_dev
APNS_ENVIRONMENT=sandbox
```

### Production (.env.production)
```bash
NODE_ENV=production
LOG_LEVEL=info
DATABASE_URL=postgresql://prod-db:5432/passes_mktr
APNS_ENVIRONMENT=production
```

### Testing (.env.test)
```bash
NODE_ENV=test
LOG_LEVEL=error
DATABASE_URL=postgresql://localhost:5432/passes_mktr_test
APNS_ENVIRONMENT=sandbox
```

## Security Notes

### Certificate Management
- Store Apple certificates in secure environment variables
- Use a secrets management service in production
- Never commit certificates to version control
- Implement certificate rotation procedures

### Database Security
- Use connection pooling
- Enable SSL connections in production
- Use read replicas for analytics queries
- Implement proper backup encryption

### API Security
- Use HTTPS in production
- Implement proper CORS policies
- Use rate limiting to prevent abuse
- Validate all input data
- Log all security events

## Validation

The application validates all required environment variables on startup:

```bash
# Check configuration
npm run config:validate

# Test database connection
npm run db:test

# Test Apple certificate
npm run apple:test-cert

# Test APNs connection
npm run apns:test
```

## Environment-Specific Notes

### Development
- Uses local database
- Sandbox APNs environment
- Debug logging enabled
- Hot reloading enabled

### Staging
- Uses staging database
- Sandbox APNs environment
- Info logging level
- Production-like configuration

### Production
- Uses production database
- Production APNs environment
- Error logging only
- Full security measures enabled
