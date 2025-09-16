import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

export class KeyboardShortcutsService {
  private static instance: KeyboardShortcutsService;
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    this.setupGlobalShortcuts();
  }

  static getInstance(): KeyboardShortcutsService {
    if (!KeyboardShortcutsService.instance) {
      KeyboardShortcutsService.instance = new KeyboardShortcutsService();
    }
    return KeyboardShortcutsService.instance;
  }

  // Register a keyboard shortcut
  registerShortcut(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  // Unregister a keyboard shortcut
  unregisterShortcut(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.delete(key);
  }

  // Enable/disable shortcuts
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Get all registered shortcuts
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  // Get shortcut key string
  private getShortcutKey(shortcut: KeyboardShortcut): string {
    const modifiers = [];
    if (shortcut.ctrlKey) modifiers.push('ctrl');
    if (shortcut.shiftKey) modifiers.push('shift');
    if (shortcut.altKey) modifiers.push('alt');
    if (shortcut.metaKey) modifiers.push('meta');
    
    return [...modifiers, shortcut.key].join('+');
  }

  // Setup global keyboard event listener
  private setupGlobalShortcuts(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  // Handle keydown events
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    const key = event.key.toLowerCase();
    const modifiers = [];
    
    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.shiftKey) modifiers.push('shift');
    if (event.altKey) modifiers.push('alt');
    if (event.metaKey) modifiers.push('meta');
    
    const shortcutKey = [...modifiers, key].join('+');
    const shortcut = this.shortcuts.get(shortcutKey);

    if (shortcut) {
      if (shortcut.preventDefault !== false) {
        event.preventDefault();
      }
      shortcut.action();
    }
  }

  // Common editor shortcuts
  getEditorShortcuts(): KeyboardShortcut[] {
    return [
      {
        key: 's',
        ctrlKey: true,
        action: () => console.log('Save template'),
        description: 'Save template',
        preventDefault: true
      },
      {
        key: 'z',
        ctrlKey: true,
        action: () => console.log('Undo'),
        description: 'Undo last action',
        preventDefault: true
      },
      {
        key: 'y',
        ctrlKey: true,
        action: () => console.log('Redo'),
        description: 'Redo last action',
        preventDefault: true
      },
      {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        action: () => console.log('Redo'),
        description: 'Redo last action',
        preventDefault: true
      },
      {
        key: 'n',
        ctrlKey: true,
        action: () => console.log('New template'),
        description: 'Create new template',
        preventDefault: true
      },
      {
        key: 'o',
        ctrlKey: true,
        action: () => console.log('Open template'),
        description: 'Open template',
        preventDefault: true
      },
      {
        key: 'e',
        ctrlKey: true,
        action: () => console.log('Export pass'),
        description: 'Export pass',
        preventDefault: true
      },
      {
        key: 'p',
        ctrlKey: true,
        action: () => console.log('Preview pass'),
        description: 'Preview pass',
        preventDefault: true
      },
      {
        key: 'f',
        ctrlKey: true,
        action: () => console.log('Find'),
        description: 'Find in template',
        preventDefault: true
      },
      {
        key: 'h',
        ctrlKey: true,
        action: () => console.log('Help'),
        description: 'Show help',
        preventDefault: true
      },
      {
        key: 'Escape',
        action: () => console.log('Clear selection'),
        description: 'Clear selection',
        preventDefault: true
      },
      {
        key: 'Delete',
        action: () => console.log('Delete selected'),
        description: 'Delete selected field',
        preventDefault: true
      },
      {
        key: 'Enter',
        action: () => console.log('Edit field'),
        description: 'Edit selected field',
        preventDefault: true
      }
    ];
  }

  // Field editor shortcuts
  getFieldEditorShortcuts(): KeyboardShortcut[] {
    return [
      {
        key: 'Enter',
        action: () => console.log('Save field'),
        description: 'Save field changes',
        preventDefault: true
      },
      {
        key: 'Escape',
        action: () => console.log('Cancel edit'),
        description: 'Cancel field editing',
        preventDefault: true
      },
      {
        key: 'Tab',
        action: () => console.log('Next field'),
        description: 'Move to next field',
        preventDefault: false
      },
      {
        key: 'Tab',
        shiftKey: true,
        action: () => console.log('Previous field'),
        description: 'Move to previous field',
        preventDefault: false
      }
    ];
  }

  // Preview shortcuts
  getPreviewShortcuts(): KeyboardShortcut[] {
    return [
      {
        key: '=',
        ctrlKey: true,
        action: () => console.log('Zoom in'),
        description: 'Zoom in',
        preventDefault: true
      },
      {
        key: '-',
        ctrlKey: true,
        action: () => console.log('Zoom out'),
        description: 'Zoom out',
        preventDefault: true
      },
      {
        key: '0',
        ctrlKey: true,
        action: () => console.log('Reset zoom'),
        description: 'Reset zoom',
        preventDefault: true
      },
      {
        key: 'r',
        ctrlKey: true,
        action: () => console.log('Refresh preview'),
        description: 'Refresh preview',
        preventDefault: true
      },
      {
        key: '1',
        ctrlKey: true,
        action: () => console.log('iPhone view'),
        description: 'Switch to iPhone view',
        preventDefault: true
      },
      {
        key: '2',
        ctrlKey: true,
        action: () => console.log('Watch view'),
        description: 'Switch to Apple Watch view',
        preventDefault: true
      }
    ];
  }
}

// React hook for keyboard shortcuts
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], deps: any[] = []) {
  const service = KeyboardShortcutsService.getInstance();

  useEffect(() => {
    shortcuts.forEach(shortcut => {
      service.registerShortcut(shortcut);
    });

    return () => {
      shortcuts.forEach(shortcut => {
        service.unregisterShortcut(shortcut);
      });
    };
  }, deps);
}

// React hook for editor shortcuts
export function useEditorShortcuts(handlers: {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onNew?: () => void;
  onOpen?: () => void;
  onExport?: () => void;
  onPreview?: () => void;
  onFind?: () => void;
  onHelp?: () => void;
  onClearSelection?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 's',
      ctrlKey: true,
      action: handlers.onSave || (() => {}),
      description: 'Save template',
      preventDefault: true
    },
    {
      key: 'z',
      ctrlKey: true,
      action: handlers.onUndo || (() => {}),
      description: 'Undo last action',
      preventDefault: true
    },
    {
      key: 'y',
      ctrlKey: true,
      action: handlers.onRedo || (() => {}),
      description: 'Redo last action',
      preventDefault: true
    },
    {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      action: handlers.onRedo || (() => {}),
      description: 'Redo last action',
      preventDefault: true
    },
    {
      key: 'n',
      ctrlKey: true,
      action: handlers.onNew || (() => {}),
      description: 'Create new template',
      preventDefault: true
    },
    {
      key: 'o',
      ctrlKey: true,
      action: handlers.onOpen || (() => {}),
      description: 'Open template',
      preventDefault: true
    },
    {
      key: 'e',
      ctrlKey: true,
      action: handlers.onExport || (() => {}),
      description: 'Export pass',
      preventDefault: true
    },
    {
      key: 'p',
      ctrlKey: true,
      action: handlers.onPreview || (() => {}),
      description: 'Preview pass',
      preventDefault: true
    },
    {
      key: 'f',
      ctrlKey: true,
      action: handlers.onFind || (() => {}),
      description: 'Find in template',
      preventDefault: true
    },
    {
      key: 'h',
      ctrlKey: true,
      action: handlers.onHelp || (() => {}),
      description: 'Show help',
      preventDefault: true
    },
    {
      key: 'Escape',
      action: handlers.onClearSelection || (() => {}),
      description: 'Clear selection',
      preventDefault: true
    },
    {
      key: 'Delete',
      action: handlers.onDelete || (() => {}),
      description: 'Delete selected field',
      preventDefault: true
    },
    {
      key: 'Enter',
      action: handlers.onEdit || (() => {}),
      description: 'Edit selected field',
      preventDefault: true
    }
  ];

  useKeyboardShortcuts(shortcuts, [handlers]);
}

export default KeyboardShortcutsService.getInstance();
