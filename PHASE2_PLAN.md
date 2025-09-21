# Phase 2: Editor as Embedded React Pages

## Branch: `feat/editor-as-package`

This document outlines the implementation plan for integrating the Pass Editor as embedded React components within the dashboard, replacing the current iframe-based approach.

## 🎯 Goals

- Replace iframe integration with native React components
- Create shared `packages/editor-ui` package
- Consolidate Tailwind and shadcn configurations
- Improve performance and user experience
- Maintain modular architecture

## 📋 Implementation Steps

### Step 1: Create Editor UI Package

```bash
mkdir -p packages/editor-ui/src/{components,hooks,services,types}
```

**Package Structure:**

```
packages/editor-ui/
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── src/
│   ├── components/
│   │   ├── DesignEditor.tsx
│   │   ├── PassPreview.tsx
│   │   └── ui/           # Editor-specific UI components
│   ├── hooks/
│   │   ├── usePassDesign.ts
│   │   └── useEditorHistory.ts
│   ├── services/
│   │   ├── previewCapture.ts
│   │   └── layoutCalculator.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts          # Main exports
```

### Step 2: Extract Core Components

**Move from `apps/editor/src/components/` to `packages/editor-ui/src/components/`:**

1. **DesignEditor.tsx**
   - Extract main editor interface
   - Remove app-specific styling
   - Add proper prop interfaces

2. **PassPreview.tsx**
   - Extract preview component
   - Make styling configurable
   - Add responsive design

3. **UI Components**
   - Move editor-specific UI components
   - Ensure they don't conflict with dashboard components
   - Use scoped CSS classes

### Step 3: Consolidate Dependencies

**Root package.json updates:**

```json
{
  "workspaces": ["apps/*", "packages/*"],
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.4.17",
    "lucide-react": "^0.475.0"
  }
}
```

**Resolve version conflicts:**

- Use workspace hoisting for common packages
- Align React versions across all packages
- Consolidate Tailwind configurations

### Step 4: Create Unified Tailwind Config

**Root tailwind.config.js:**

```javascript
module.exports = {
  content: [
    "./apps/dashboard/src/**/*.{js,jsx,ts,tsx}",
    "./packages/editor-ui/src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Shared design tokens
      colors: {
        primary: {
          50: "#f0f9ff",
          500: "#3b82f6",
          600: "#2563eb",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

### Step 5: Update Dashboard Integration

**Create `apps/dashboard/src/pages/Editor.jsx`:**

```jsx
import React from "react";
import { PassEditor } from "@passes-mktr/editor-ui";
import { EditorProvider } from "@/contexts/EditorContext";

export default function Editor() {
  return (
    <EditorProvider>
      <div className="h-full">
        <PassEditor />
      </div>
    </EditorProvider>
  );
}
```

**Update routing in `apps/dashboard/src/pages/index.jsx`:**

```jsx
// Replace EditorHost import with Editor
import Editor from "./Editor";

// Update route
<Route path="/editor" element={<Editor />} />;
```

### Step 6: Handle Styling Conflicts

**Strategy: Scoped CSS Classes**

1. **Prefix editor classes:**

   ```css
   .editor-container {
     /* editor styles */
   }
   .editor-toolbar {
     /* toolbar styles */
   }
   .editor-preview {
     /* preview styles */
   }
   ```

2. **Use CSS modules for editor components:**

   ```tsx
   import styles from './DesignEditor.module.css';

   <div className={styles.editorContainer}>
   ```

3. **Avoid global Tailwind conflicts:**
   - Use specific class names
   - Implement proper CSS specificity
   - Test thoroughly across components

### Step 7: State Management Integration

**Create `apps/dashboard/src/contexts/EditorContext.jsx`:**

```jsx
import React, { createContext, useContext, useReducer } from "react";
import { PassDesign } from "@passes-mktr/editor-ui/types";

const EditorContext = createContext();

export function EditorProvider({ children }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  return (
    <EditorContext.Provider value={{ state, dispatch }}>
      {children}
    </EditorContext.Provider>
  );
}

export const useEditor = () => useContext(EditorContext);
```

### Step 8: Update Build Configuration

**Dashboard vite.config.js:**

```javascript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@passes-mktr/editor-ui": path.resolve(
        __dirname,
        "../packages/editor-ui/src"
      ),
    },
  },
  // ... rest of config
});
```

## ⚠️ Potential Pitfalls & Solutions

### 1. Tailwind Configuration Conflicts

**Problem:** Different Tailwind versions or configurations between packages.

**Solution:**

- Use workspace hoisting for Tailwind
- Create shared Tailwind config at root
- Use CSS layers for proper specificity

### 2. Component Name Conflicts

**Problem:** Duplicate component names between dashboard and editor.

**Solution:**

- Use namespaced imports: `import { EditorButton } from '@passes-mktr/editor-ui'`
- Rename conflicting components
- Use proper TypeScript path mapping

### 3. CSS Scoping Issues

**Problem:** Styles bleeding between dashboard and editor.

**Solution:**

- Use CSS modules for editor components
- Implement proper CSS-in-JS solution
- Use CSS custom properties for theming

### 4. Bundle Size Concerns

**Problem:** Increased bundle size due to shared dependencies.

**Solution:**

- Use proper tree shaking
- Implement code splitting
- Optimize shared dependencies

### 5. Hot Reload Coordination

**Problem:** Hot reload not working properly across packages.

**Solution:**

- Configure Vite to watch package changes
- Use proper workspace linking
- Implement proper file watching

## 🧪 Testing Strategy

### Unit Tests

- Test editor components in isolation
- Mock dashboard context
- Ensure proper prop interfaces

### Integration Tests

- Test editor within dashboard
- Verify state management
- Check styling integration

### E2E Tests

- Test complete editor workflow
- Verify pass generation
- Check responsive design

## 📊 Migration Checklist

- [ ] Create `packages/editor-ui` package
- [ ] Extract core editor components
- [ ] Set up proper TypeScript configuration
- [ ] Consolidate Tailwind configurations
- [ ] Create shared design system
- [ ] Implement scoped CSS strategy
- [ ] Update dashboard integration
- [ ] Create editor context provider
- [ ] Update routing and navigation
- [ ] Test styling isolation
- [ ] Verify performance improvements
- [ ] Update documentation
- [ ] Remove iframe implementation
- [ ] Clean up unused dependencies

## 🚀 Benefits

1. **Performance:** No iframe overhead, faster rendering
2. **UX:** Seamless navigation and interactions
3. **Maintainability:** Single codebase, easier debugging
4. **Styling:** Unified design system, consistent theming
5. **State Management:** Shared state, better data flow
6. **TypeScript:** Better type safety across components
7. **Bundle Optimization:** Shared dependencies, tree shaking

## 🔄 Rollback Plan

If issues arise during migration:

1. Keep iframe implementation as fallback
2. Use feature flags to switch between implementations
3. Maintain separate branches for each approach
4. Implement gradual migration strategy

## 📝 Notes

- This migration should be done incrementally
- Test thoroughly at each step
- Consider user feedback during development
- Document any breaking changes
- Plan for proper release strategy
