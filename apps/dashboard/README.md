# Dashboard Application

The dashboard provides the main interface for managing Apple Wallet passes and integrates the WYSIWYG editor via iframe.

## Quick Start

1. **Set up environment:**

   ```bash
   # Create environment file
   echo "VITE_EDITOR_URL=http://localhost:5174" > .env.local
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Start development server:**

   ```bash
   pnpm dev
   ```

4. **Access the dashboard:**
   - Dashboard: http://localhost:5173
   - Editor integration: http://localhost:5173/editor

## Configuration

### Environment Variables

Create `.env.local` in this directory:

```bash
# Required: URL of the editor service
VITE_EDITOR_URL=http://localhost:5174
```

### Important Notes

- **The editor server must be running at the specified URL**
- **The backend API server must be running for pass generation**
- The iframe integration requires both services to be active

## Iframe Integration

The editor is integrated via iframe in `src/pages/EditorHost.jsx` with the following sandbox permissions:

- `allow-scripts` - JavaScript execution
- `allow-same-origin` - Same-origin requests
- `allow-forms` - Form submissions
- `allow-downloads` - File downloads
- `allow-popups` - Popup windows
- `allow-modals` - Modal dialogs

## Troubleshooting

### Editor not loading

1. Verify editor is running: `curl http://localhost:5174`
2. Check `VITE_EDITOR_URL` in `.env.local`
3. Look for CORS errors in browser console
4. Ensure no ad blockers are interfering

### Pass generation failing

1. Verify backend is running: `curl http://localhost:3000/health`
2. Check backend server logs for errors
3. Ensure Apple certificates are configured
