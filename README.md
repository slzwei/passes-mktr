# Passes MKTR - Apple Wallet PassKit Platform

A comprehensive platform for creating, managing, and distributing Apple Wallet passes with an integrated dashboard and WYSIWYG editor.

## 🏗️ Architecture

This repository uses a monorepo structure with workspaces to manage multiple applications:

- **Dashboard** (`apps/dashboard`) - Base44-powered React dashboard for pass management
- **Editor** (`apps/editor`) - WYSIWYG editor for designing Apple Wallet passes
- **Backend** (`src/`) - Node.js/Express API server for pass generation and management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Apple Developer certificates (for pass signing)

### Installation

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd passes-mktr
   pnpm install
   ```

2. **Set up environment variables:**

   ```bash
   # Copy example environment file
   cp env.example .env

   # Edit .env with your configuration
   # Required: Database, Redis, Apple certificates
   ```

3. **Set up dashboard environment:**

   ```bash
   # Create dashboard environment file
   echo "VITE_EDITOR_URL=http://localhost:5174" > apps/dashboard/.env.local
   ```

4. **Start development servers:**

   ```bash
   # IMPORTANT: Both servers must be running for proper integration

   # Start backend API server (required for pass generation)
   pnpm start  # Runs on http://localhost:3000

   # Start dashboard (in new terminal)
   pnpm dev:dashboard  # Runs on http://localhost:5173

   # Start editor server (in new terminal)
   pnpm dev:editor     # Runs on http://localhost:5174
   ```

5. **Access the applications:**
   - **Dashboard**: http://localhost:5173
   - **Editor (standalone)**: http://localhost:5174
   - **Editor in Dashboard**: http://localhost:5173/editor (integrated iframe)
   - **API Server**: http://localhost:3000

## 📁 Project Structure

```
passes-mktr/
├── apps/
│   ├── dashboard/          # Base44 React dashboard
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── EditorHost.jsx  # Iframe wrapper for editor
│   │   │   │   └── ...
│   │   │   └── ...
│   │   ├── .env.local      # VITE_EDITOR_URL=http://localhost:5174
│   │   └── package.json
│   └── editor/             # WYSIWYG pass editor
│       ├── src/
│       │   ├── components/
│       │   │   ├── DesignEditor.tsx
│       │   │   ├── PassPreview.tsx
│       │   │   └── ...
│       │   └── ...
│       └── package.json
├── src/                    # Backend API server
│   ├── routes/
│   ├── services/
│   └── server.js
├── package.json            # Root workspace configuration
└── README.md
```

## 🛠️ Development

### Available Scripts

| Script               | Description                                  |
| -------------------- | -------------------------------------------- |
| `pnpm dev:all`       | Start both dashboard and editor concurrently |
| `pnpm dev:dashboard` | Start dashboard only (port 5173)             |
| `pnpm dev:editor`    | Start editor only (port 5174)                |
| `pnpm start`         | Start backend API server                     |
| `pnpm dev`           | Start backend in development mode            |

### Workspace Management

This project uses pnpm workspaces. Each app in `apps/` is a separate workspace:

```bash
# Install dependencies for specific workspace
pnpm --filter dashboard install
pnpm --filter editor install

# Run scripts in specific workspace
pnpm --filter dashboard dev
pnpm --filter editor build
```

## 🔧 Configuration

### Required Configuration

**Dashboard Environment (apps/dashboard/.env.local):**

```bash
# Required: URL of the editor service for iframe integration
VITE_EDITOR_URL=http://localhost:5174
```

**Backend Server:**

The backend server automatically creates required directories and assets on startup:

- `storage/` - Main storage directory
- `storage/images/processed/` - Processed images for passes
- `storage/tmp/` - Temporary files during generation
- `storage/passes/` - Generated .pkpass files

Default assets are copied from `pass-assets/` if missing:

- `default-strip-background.png` (and @2x, @3x variants)
- `icon.png` (and @2x, @3x variants)

**Port Configuration:**

| Service     | Port | Purpose                       | Configuration                   |
| ----------- | ---- | ----------------------------- | ------------------------------- |
| Backend API | 3000 | Pass generation, file serving | `PORT` env var                  |
| Dashboard   | 5173 | Main dashboard UI             | `apps/dashboard/vite.config.js` |
| Editor      | 5174 | WYSIWYG editor                | `apps/editor/package.json`      |

**Critical Requirements:**

1. **Both dashboard (5173) and editor (5174) must be running**
2. **Backend server must be running for pass generation**
3. **VITE_EDITOR_URL must match the editor server URL**
4. **Storage directories are auto-created but Apple certificates must be manually configured**

## 🚀 Deployment

### Production Build

1. **Build all applications:**

   ```bash
   pnpm --filter dashboard build
   pnpm --filter editor build
   ```

2. **Set production environment variables:**
   ```bash
   # Dashboard production .env
   VITE_EDITOR_URL=https://your-editor-domain.com
   ```

### Deployment Strategy

**Option 1: Separate Deployments (Recommended)**

- Deploy dashboard to one domain (e.g., `app.passes-mktr.com`)
- Deploy editor to another domain (e.g., `editor.passes-mktr.com`)
- Update `VITE_EDITOR_URL` in dashboard to point to editor domain

**Option 2: Same Domain**

- Serve dashboard from root (`/`)
- Serve editor from subpath (`/editor`)
- Configure reverse proxy to route requests appropriately

### Environment Variables

| Variable          | Description                          | Required | Example                                    |
| ----------------- | ------------------------------------ | -------- | ------------------------------------------ |
| `VITE_EDITOR_URL` | URL of the editor service for iframe | Yes      | `http://localhost:5174`                    |
| `PORT`            | Backend API server port              | No       | `3000` (default)                           |
| `DATABASE_URL`    | PostgreSQL connection string         | No\*     | `postgresql://user:pass@localhost:5432/db` |
| `REDIS_URL`       | Redis connection string              | No\*     | `redis://localhost:6379`                   |
| `APPLE_CERT_PATH` | Path to Apple certificate            | Yes      | `./certs/apple/cert.pem`                   |
| `APPLE_KEY_PATH`  | Path to Apple private key            | Yes      | `./certs/apple/key.pem`                    |

\*Database and Redis are optional for development - the server will use mock data if not configured.

## 🐛 Troubleshooting

### Common Issues

**1. Editor not loading in iframe**

- ✅ **Check that editor is running on port 5174**
- ✅ **Verify `VITE_EDITOR_URL` is set correctly in `apps/dashboard/.env.local`**
- Check browser console for CORS errors
- Iframe sandbox now includes: `allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-modals`

**2. Pass generation fails with 500 error**

- ✅ **Ensure backend server is running on port 3000**
- ✅ **Storage directories are auto-created on server startup**
- ✅ **Default assets are auto-copied from `pass-assets/` folder**
- Check Apple Developer certificates are properly configured
- Verify `/storage/images/processed/default-strip-background.png` exists and is accessible

**3. "Generate" button shows sandbox alert error**

- ✅ **Fixed: Alert() calls replaced with toast notifications**
- ✅ **Iframe sandbox permissions updated to allow modals**
- Clear browser cache and reload

**4. Static assets not loading (404 on /storage/...)**

- ✅ **Backend now serves storage with absolute paths**
- ✅ **Storage middleware configured with `fallthrough: false`**
- Check server logs for file access errors
- Verify file permissions in storage directory

**5. Port conflicts**

- Dashboard: Change port in `apps/dashboard/vite.config.js`
- Editor: Change PORT in `apps/editor/package.json`
- Backend: Set `PORT` environment variable
- Update `VITE_EDITOR_URL` accordingly

**6. Build failures**

- Clear node_modules: `rm -rf node_modules apps/*/node_modules`
- Reinstall: `pnpm install`
- Check for TypeScript errors in editor

### Debug Mode

Enable debug logging by setting environment variables:

```bash
DEBUG=passes-mktr:* pnpm dev:all
```

## 📚 API Documentation

The backend API provides endpoints for:

- **Pass generation** (`POST /api/passes/generate-working`) - Generates .pkpass files with enhanced error handling
- **Static assets** (`GET /storage/*`) - Serves pass assets with absolute path resolution
- **Pass validation** (`POST /api/passes/validate`)
- **Template management** (`GET /api/templates`)
- **Analytics** (`GET /api/analytics`)

**Key API Features:**

- ✅ **Auto-creation of required storage directories**
- ✅ **Robust error handling with specific error messages**
- ✅ **Default asset bootstrapping on startup**
- ✅ **Enhanced logging for debugging pass generation issues**

See `src/routes/` for detailed endpoint documentation.

## 🔒 Security

- All passes are signed with Apple certificates
- API endpoints are rate-limited
- CORS is configured for production domains
- Environment variables are properly scoped

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both dashboard and editor
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

## Phase 2 – Editor as Embedded React Pages

This section outlines the plan for tighter integration by embedding the editor as React components instead of using iframes.

### Overview

The current iframe-based approach provides good isolation but has limitations:

- Limited communication between dashboard and editor
- Duplicate dependencies and build processes
- Potential styling conflicts
- Performance overhead

### Implementation Plan

#### 1. Extract Editor UI Components

Create a new package `packages/editor-ui` containing:

- Core editor components (`DesignEditor`, `PassPreview`)
- Shared types and utilities
- Editor-specific hooks and services
- Minimal styling (CSS-in-JS or scoped CSS)

#### 2. Consolidate Dependencies

- Move shared dependencies to root `package.json`
- Use workspace hoisting for common packages
- Resolve version conflicts between dashboard and editor

#### 3. Integrate with Dashboard

- Create `apps/dashboard/src/pages/Editor.jsx` (not iframe)
- Import and use `<PassEditor />` component
- Handle editor state in dashboard context
- Implement proper routing and navigation

#### 4. Styling Strategy

**Option A: Scoped CSS**

- Use CSS modules or styled-components
- Prefix all editor styles with `.editor-`
- Avoid global Tailwind conflicts

**Option B: Unified Tailwind**

- Merge Tailwind configs
- Use consistent design tokens
- Resolve class name conflicts

#### 5. State Management

- Lift editor state to dashboard level
- Use React Context for shared state
- Implement proper data flow between components

### Potential Pitfalls

1. **Tailwind Conflicts**
   - Different Tailwind versions
   - Conflicting utility classes
   - CSS specificity issues

2. **Component Name Conflicts**
   - Duplicate component names
   - Import path confusion
   - Bundle size increase

3. **Build Complexity**
   - Shared vs. separate builds
   - Hot reload coordination
   - TypeScript path mapping

4. **Styling Isolation**
   - CSS bleeding between apps
   - Theme consistency
   - Responsive design conflicts

### Migration Steps

1. Create `packages/editor-ui` package
2. Extract core editor components
3. Set up proper TypeScript paths
4. Create shared design system
5. Integrate with dashboard
6. Remove iframe implementation
7. Update routing and navigation
8. Test thoroughly

### Benefits of Phase 2

- Better performance (no iframe overhead)
- Seamless user experience
- Shared state management
- Unified styling system
- Easier maintenance
- Better TypeScript support

This approach will provide a more integrated experience while maintaining the modular architecture of the monorepo.
