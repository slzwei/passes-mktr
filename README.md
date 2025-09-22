# 🗄️ PostgreSQL Database Implementation

## Overview

This application has been upgraded from a file-based storage system to a robust PostgreSQL database architecture following SOLID principles. The system now supports concurrent users, ACID transactions, and proper data relationships.

## 🎯 Architecture

### SOLID Principles Implemented

- **S**ingle Responsibility: Each service handles one specific domain
- **O**pen-Closed: Services are extensible without modification
- **L**iskov Substitution: Models implement consistent interfaces
- **I**nterface Segregation: Clean separation of concerns
- **D**ependency Inversion: Services depend on abstractions

### Database Models

```
📊 Core Tables
├── campaigns (id, name, type, tenant_id, status, is_active, created_at, updated_at)
├── campaign_designs (id, campaign_id, design_data, created_at)
├── campaign_details (id, campaign_id, details_data, created_at)
└── campaign_previews (id, campaign_id, preview_path, created_at)

🔍 Analytics Tables
├── analytics_events (id, campaign_id, event_type, event_data, created_at)
└── templates (id, name, template_data, tenant_id, created_at)

👥 Multi-tenant Support
└── tenants (id, name, settings, created_at)
```

## 🚀 Quick Start

### Prerequisites

- Docker Desktop (for local PostgreSQL)
- Node.js 18+ and npm

### 1. Start PostgreSQL Database

```bash
# Navigate to project root
cd /Users/shawnlee/Documents/passes-mktr/passes-mktr

# Start PostgreSQL container
docker-compose up -d

# Check status
docker ps | grep postgres
```

**Expected Output:**

```
f327732ad5ca   postgres:15   "docker-entrypoint.s…"   Up (healthy)   0.0.0.0:5433->5432/tcp   passes-mktr-db
```

### 2. Start Application

```bash
# Install dependencies (if needed)
npm install

# Start server with database connection
npm start
```

**Expected Logs:**

```
info: ✅ Database connection established
info: Persistence service initialized with database
info: Loaded 2 campaigns from database
```

### 3. Test Database Connection

```bash
# Check API is responding
curl 'http://localhost:3000/api/campaigns?tenantId=tenant-1' | jq '.success'

# Should return: true

# Check campaign count
curl 'http://localhost:3000/api/campaigns?tenantId=tenant-1' | jq '.data | length'

# Should return: 2 (or number of campaigns)
```

## 🐳 Docker Configuration

### docker-compose.yml

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15
    container_name: passes-mktr-db
    environment:
      POSTGRES_DB: passes_mktr_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password123
    ports:
      - "5433:5432" # External:5433 -> Container:5432
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d passes_mktr_dev"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### Database Configuration

**Environment Variables (.env):**

```bash
DATABASE_URL=postgresql://postgres:password123@localhost:5433/passes_mktr_dev
DB_POOL_SIZE=10
DB_TIMEOUT=30
```

**Connection Details:**

- **Host**: localhost
- **Port**: 5433 (external), 5432 (internal)
- **Database**: passes_mktr_dev
- **Username**: postgres
- **Password**: password123

## 🏗️ Database Schema

### Core Tables

#### `campaigns`

- **id**: UUID (Primary Key)
- **name**: VARCHAR(255) - Campaign name
- **description**: TEXT - Campaign description
- **type**: ENUM ('redemption', 'points', 'milestone')
- **tenant_id**: UUID (Foreign Key to tenants)
- **status**: ENUM ('draft', 'active', 'paused', 'archived')
- **is_active**: BOOLEAN
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

#### `campaign_designs`

- **id**: UUID (Primary Key)
- **campaign_id**: UUID (Foreign Key to campaigns)
- **design_data**: JSONB - Apple Wallet pass design
- **created_at**: TIMESTAMP

#### `campaign_details`

- **id**: UUID (Primary Key)
- **campaign_id**: UUID (Foreign Key to campaigns)
- **details_data**: JSONB - Campaign metadata
- **created_at**: TIMESTAMP

#### `campaign_previews`

- **id**: UUID (Primary Key)
- **campaign_id**: UUID (Foreign Key to campaigns)
- **preview_path**: VARCHAR(500) - File path to preview image
- **created_at**: TIMESTAMP

### Analytics Tables

#### `analytics_events`

- **id**: UUID (Primary Key)
- **campaign_id**: UUID (Foreign Key to campaigns)
- **event_type**: VARCHAR(100) - Event type (view, redeem, etc.)
- **event_data**: JSONB - Event metadata
- **created_at**: TIMESTAMP (indexed for queries)

#### `templates`

- **id**: UUID (Primary Key)
- **name**: VARCHAR(255) - Template name
- **template_data**: JSONB - Template configuration
- **tenant_id**: UUID (Foreign Key to tenants)
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

## 🔧 Service Architecture

### Database Service Layer

**Models (Single Responsibility):**

- `CampaignModel` - Campaign CRUD operations
- `CampaignDesignModel` - Design data management
- `CampaignDetailsModel` - Details data management
- `TemplateModel` - Template operations
- `AnalyticsModel` - Analytics and reporting

**Service Layer (Dependency Inversion):**

- `DatabaseService` - Coordinates all database operations
- `PersistenceService` - Handles data persistence abstraction

### API Integration

**Routes Updated:**

- `GET /api/campaigns` - Loads from PostgreSQL
- `POST /api/campaigns/:id/autosave/*` - Saves to PostgreSQL
- `DELETE /api/campaigns/:id` - Deletes from PostgreSQL
- `GET /api/campaigns/:id/design` - Loads from PostgreSQL

## 🔄 Migration from File-Based Storage

### Migration Script

**Location:** `database/migrate.js`

**Features:**

- Migrates JSON campaign files to PostgreSQL
- Preserves design and details data
- Handles data integrity and relationships
- Provides rollback capabilities

**Usage:**

```bash
node database/migrate.js
```

### Data Flow

**Before (File-Based):**

```
JSON Files → File I/O → Memory → File I/O → JSON Files
```

**After (PostgreSQL):**

```
Database → ACID Transactions → Memory → Database → ACID Transactions
```

## 🛠️ Management Commands

### Database Operations

```bash
# Check database status
docker-compose ps

# View database logs
docker-compose logs postgres

# Connect to database directly
docker exec -it passes-mktr-db psql -U postgres -d passes_mktr_dev

# Backup database
docker exec passes-mktr-db pg_dump -U postgres passes_mktr_dev > backup.sql

# Restore database
docker exec -i passes-mktr-db psql -U postgres passes_mktr_dev < backup.sql
```

### Application Testing

```bash
# Test API endpoints
curl 'http://localhost:3000/api/campaigns?tenantId=tenant-1'

# Test campaign deletion
curl -X DELETE 'http://localhost:3000/api/campaigns/{campaign-id}'

# Test autosave functionality
curl -X POST 'http://localhost:3000/api/campaigns/{campaign-id}/autosave/design' \
  -H 'Content-Type: application/json' \
  -d '{"design": {...}}'
```

## 🔍 Troubleshooting

### Common Issues

**1. Port 5432 Already in Use**

```bash
# Check what's using the port
lsof -i :5432

# Solution: Use different port in docker-compose.yml
ports:
  - "5433:5432"
```

**2. Docker Daemon Not Running**

```bash
# Start Docker Desktop
open /Applications/Docker.app

# Check Docker status
docker --version
```

**3. Database Connection Failed**

```bash
# Check PostgreSQL container
docker ps | grep postgres

# Check container logs
docker-compose logs postgres

# Test connection manually
docker exec passes-mktr-db pg_isready -U postgres
```

**4. Campaigns Not Loading**

```bash
# Check server logs
npm start 2>&1 | grep -E "(database|campaign|error)"

# Verify database has data
docker exec passes-mktr-db psql -U postgres passes_mktr_dev -c "SELECT COUNT(*) FROM campaigns;"
```

### Performance Monitoring

**Database Health Check:**

```bash
# Check connection and performance
curl 'http://localhost:3000/health' 2>/dev/null | jq '.database'
```

**Query Performance:**

```bash
# Enable query logging (add to .env)
LOG_LEVEL=debug
LOG_FORMAT=json
```

## 🚀 Deployment

### Render PostgreSQL

1. **Create Database:**
   - Go to [render.com](https://render.com)
   - Create new PostgreSQL database
   - Note the External Database URL

2. **Update Environment:**

   ```bash
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   ```

3. **Deploy Application:**
   - Connect to Render PostgreSQL
   - Deploy with same docker-compose.yml

### Environment Variables

**Development (.env):**

```bash
DATABASE_URL=postgresql://postgres:password123@localhost:5433/passes_mktr_dev
```

**Production (.env.production):**

```bash
DATABASE_URL=postgresql://user:password@render-host:5432/dbname
```

## 📈 Benefits

### Scalability

- ✅ **Concurrent Users**: Multiple users can edit simultaneously
- ✅ **Horizontal Scaling**: Ready for load balancing
- ✅ **Database Replication**: Built-in PostgreSQL features

### Data Integrity

- ✅ **ACID Transactions**: Guaranteed data consistency
- ✅ **Foreign Key Constraints**: Proper relationships
- ✅ **Atomic Operations**: All-or-nothing transactions

### Performance

- ✅ **Fast Queries**: Optimized indexes and queries
- ✅ **Connection Pooling**: Efficient database connections
- ✅ **Query Optimization**: PostgreSQL query planner

### Analytics

- ✅ **Real-time Events**: Track user interactions
- ✅ **Campaign Performance**: Detailed analytics
- ✅ **Data Aggregation**: Complex reporting queries

## 🔒 Security

### Database Security

- ✅ **Connection Encryption**: SSL/TLS support
- ✅ **Access Control**: Role-based permissions
- ✅ **Data Validation**: Input sanitization

### Application Security

- ✅ **SQL Injection Protection**: Parameterized queries
- ✅ **XSS Prevention**: Data sanitization
- ✅ **CSRF Protection**: Token-based requests

## 📚 Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Render PostgreSQL Guide](https://render.com/docs/postgresql)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/ddl.html)

---

**🎯 The system is now production-ready with PostgreSQL database and SOLID architecture!**
