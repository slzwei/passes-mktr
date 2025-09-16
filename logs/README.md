# Logging System

## Log Structure

All logs follow a consistent JSON format with these standard fields:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO|WARN|ERROR|DEBUG",
  "request_id": "uuid-v4",
  "service": "pass-signer|web-service|apns",
  "action": "pass_created|stamp_added|push_sent",
  "tenant_id": "uuid-v4",
  "campaign_id": "uuid-v4",
  "pass_id": "uuid-v4",
  "message": "Human readable description",
  "data": { /* Additional context */ }
}
```

## Log Categories

### API Requests
- **Level**: INFO
- **Action**: `api_request`
- **Data**: `{ "method": "POST", "endpoint": "/api/passes", "status_code": 201, "duration_ms": 150 }`

### Pass Operations
- **Level**: INFO
- **Action**: `pass_created|pass_updated|pass_signed`
- **Data**: `{ "serial_number": "PASS-123", "campaign_id": "uuid", "stamps": 3 }`

### Redemptions
- **Level**: INFO
- **Action**: `stamp_added|reward_redeemed`
- **Data**: `{ "pass_id": "uuid", "partner_id": "uuid", "stamps_added": 1, "total_stamps": 4 }`

### APNs Push
- **Level**: INFO
- **Action**: `push_sent|push_failed`
- **Data**: `{ "device_token": "abc123", "pass_id": "uuid", "success": true }`

### Security Events
- **Level**: WARN/ERROR
- **Action**: `invalid_certificate|unauthorized_access|barcode_scan_failed`
- **Data**: `{ "error": "Certificate expired", "ip_address": "192.168.1.1" }`

## Viewing Logs

### Real-time Monitoring
```bash
# Follow all logs
tail -f logs/app.log | jq '.'

# Filter by service
tail -f logs/app.log | jq 'select(.service == "pass-signer")'

# Filter by action
tail -f logs/app.log | jq 'select(.action == "pass_created")'

# Filter by tenant
tail -f logs/app.log | jq 'select(.tenant_id == "tenant-uuid")'
```

### Historical Analysis
```bash
# Find all pass creations for a campaign
grep "pass_created" logs/app.log | jq 'select(.campaign_id == "campaign-uuid")'

# Find failed APNs pushes
grep "push_failed" logs/app.log | jq '.'

# Find security events
grep -E "(WARN|ERROR)" logs/app.log | jq 'select(.action | contains("security"))'
```

### Performance Analysis
```bash
# Find slow API requests
grep "api_request" logs/app.log | jq 'select(.data.duration_ms > 1000)'

# Find pass signing performance
grep "pass_signed" logs/app.log | jq 'select(.data.duration_ms > 500)'
```

## Log Rotation

Logs are automatically rotated daily with the following retention:
- **Daily logs**: 30 days
- **Compressed logs**: 90 days
- **Critical errors**: 1 year

## Monitoring Integration

Logs are automatically sent to monitoring systems for:
- Error rate tracking
- Performance metrics
- Security event alerting
- Business metrics (passes created, redemptions)
