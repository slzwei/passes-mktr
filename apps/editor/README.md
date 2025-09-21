# Editor Application

The WYSIWYG editor for designing Apple Wallet passes. Can run standalone or be integrated into the dashboard via iframe.

## Quick Start

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Start development server:**

   ```bash
   pnpm dev
   ```

3. **Access the editor:**
   - Standalone: http://localhost:5174
   - Integrated: http://localhost:5173/editor (via dashboard)

## Features

- **Real-time preview** of Apple Wallet passes
- **Multiple card types**: Redemption, Points, Milestone
- **Visual editing** with drag-and-drop interface
- **Toast notifications** instead of browser alerts
- **Pass generation** with download functionality
- **Undo/redo** with keyboard shortcuts

## Configuration

### Port Configuration

The editor runs on port 5174 by default. To change:

```json
{
  "scripts": {
    "dev": "PORT=5175 react-scripts start"
  }
}
```

Remember to update `VITE_EDITOR_URL` in the dashboard configuration.

## Integration Notes

### Iframe Compatibility

The editor is designed to work within iframe sandboxes with these permissions:

- JavaScript execution and form handling
- File downloads for .pkpass generation
- Modal dialogs and popups for user feedback
- Same-origin requests to backend API

### Toast System

Alert dialogs have been replaced with a toast notification system:

- Success messages for pass generation
- Error messages with detailed information
- Info messages for user actions
- Auto-dismissing with manual close option

### Backend Communication

The editor communicates with the backend server for:

- Pass generation (`POST /api/passes/generate-working`)
- Asset serving (`GET /storage/...`)
- Static file access for default assets

## Development

### File Structure

```
src/
├── components/
│   ├── DesignEditor.tsx      # Main editor interface
│   ├── PassPreview.tsx       # Live preview component
│   └── ui/
│       ├── Toast.tsx         # Toast notification component
│       └── ToastContainer.tsx # Toast management
├── services/
│   └── previewCapture.ts     # Canvas capture for pass generation
├── types/
│   └── index.ts              # TypeScript definitions
└── App.tsx                   # Main application component
```

### Key Components

- **App.tsx**: Main application with state management and toast system
- **DesignEditor**: Form controls for pass customization
- **PassPreview**: Real-time preview of the pass design
- **ToastContainer**: User-friendly notifications

## Troubleshooting

### Pass generation fails

1. Check backend server is running on port 3000
2. Verify `/storage/images/processed/` directory exists
3. Check Apple certificate configuration
4. Look for detailed error messages in toast notifications

### Preview not updating

1. Ensure all form controls are properly bound
2. Check for JavaScript errors in browser console
3. Verify state management is working correctly

### Toast notifications not showing

1. Check ToastContainer is properly rendered
2. Verify toast state management functions
3. Look for CSS conflicts with toast positioning
