export interface HelpSection {
  id: string;
  title: string;
  content: string;
  subsections?: HelpSection[];
}

export class HelpService {
  private static instance: HelpService;

  constructor() {}

  static getInstance(): HelpService {
    if (!HelpService.instance) {
      HelpService.instance = new HelpService();
    }
    return HelpService.instance;
  }

  // Get all help sections
  getHelpSections(): HelpSection[] {
    return [
      {
        id: 'getting-started',
        title: 'Getting Started',
        content: 'Learn the basics of creating Apple Wallet passes with our WYSIWYG editor.',
        subsections: [
          {
            id: 'creating-template',
            title: 'Creating a Template',
            content: 'To create a new pass template, click the "New Template" button or use Ctrl+N. You can then customize the fields, colors, and images to match your brand.'
          },
          {
            id: 'adding-fields',
            title: 'Adding Fields',
            content: 'Use the sidebar to add fields to your pass. Each field type has specific limits: Header (2), Primary (2), Secondary (4), Auxiliary (4), and Back (unlimited).'
          },
          {
            id: 'customizing-colors',
            title: 'Customizing Colors',
            content: 'Use the Properties panel to customize colors. You can choose from preset themes or create custom color combinations. Ensure good contrast for accessibility.'
          }
        ]
      },
      {
        id: 'field-types',
        title: 'Field Types',
        content: 'Understanding the different field types and their purposes in Apple Wallet passes.',
        subsections: [
          {
            id: 'header-fields',
            title: 'Header Fields',
            content: 'Header fields appear at the top of the pass, below the logo. Maximum 2 fields. Use for important information like the pass title or company name.'
          },
          {
            id: 'primary-fields',
            title: 'Primary Fields',
            content: 'Primary fields are the main content of the pass. Maximum 2 fields. Use for key information like points balance or membership tier.'
          },
          {
            id: 'secondary-fields',
            title: 'Secondary Fields',
            content: 'Secondary fields provide additional details. Maximum 4 fields. Use for information like expiry date or next reward.'
          },
          {
            id: 'auxiliary-fields',
            title: 'Auxiliary Fields',
            content: 'Auxiliary fields show supplementary information. Maximum 4 fields. Use for details like store location or contact info.'
          },
          {
            id: 'back-fields',
            title: 'Back Fields',
            content: 'Back fields appear on the back of the pass when flipped. No limit. Use for terms and conditions or additional details.'
          }
        ]
      },
      {
        id: 'keyboard-shortcuts',
        title: 'Keyboard Shortcuts',
        content: 'Speed up your workflow with these keyboard shortcuts.',
        subsections: [
          {
            id: 'general-shortcuts',
            title: 'General Shortcuts',
            content: 'Ctrl+S: Save template\nCtrl+N: New template\nCtrl+O: Open template\nCtrl+E: Export pass\nCtrl+P: Preview pass\nCtrl+F: Find\nCtrl+H: Help\nEscape: Clear selection\nDelete: Delete selected field\nEnter: Edit selected field'
          },
          {
            id: 'editing-shortcuts',
            title: 'Editing Shortcuts',
            content: 'Ctrl+Z: Undo\nCtrl+Y: Redo\nCtrl+Shift+Z: Redo\nTab: Next field\nShift+Tab: Previous field\nEnter: Save field changes\nEscape: Cancel editing'
          },
          {
            id: 'preview-shortcuts',
            title: 'Preview Shortcuts',
            content: 'Ctrl+=: Zoom in\nCtrl+-: Zoom out\nCtrl+0: Reset zoom\nCtrl+R: Refresh preview\nCtrl+1: iPhone view\nCtrl+2: Apple Watch view'
          }
        ]
      },
      {
        id: 'validation',
        title: 'Validation & Requirements',
        content: 'Understanding Apple Wallet pass requirements and validation rules.',
        subsections: [
          {
            id: 'required-fields',
            title: 'Required Fields',
            content: 'Logo and icon images are required for all Apple Wallet passes. The template must have a valid name and type. At least one primary field is recommended for proper display.'
          },
          {
            id: 'field-limits',
            title: 'Field Limits',
            content: 'Respect the field limits for each type. Exceeding limits will cause validation errors. Header: 2, Primary: 2, Secondary: 4, Auxiliary: 4, Back: unlimited.'
          },
          {
            id: 'color-requirements',
            title: 'Color Requirements',
            content: 'All three color types (foreground, background, label) are required. Ensure good contrast between foreground and background colors for accessibility.'
          },
          {
            id: 'image-requirements',
            title: 'Image Requirements',
            content: 'Images must be in PNG format. Logo and icon should be 29x29 pixels. Strip image should be 320x84 pixels. Maximum file size is 5MB per image.'
          }
        ]
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        content: 'Common issues and solutions.',
        subsections: [
          {
            id: 'preview-not-loading',
            title: 'Preview Not Loading',
            content: 'Check your internet connection and ensure the backend server is running. Try refreshing the preview or restarting the application.'
          },
          {
            id: 'validation-errors',
            title: 'Validation Errors',
            content: 'Fix validation errors by addressing the issues shown in the Properties panel. Common issues include missing required fields or invalid color formats.'
          },
          {
            id: 'image-upload-issues',
            title: 'Image Upload Issues',
            content: 'Ensure images are in PNG format and under 5MB. Check that the image dimensions match the requirements for each image type.'
          },
          {
            id: 'performance-issues',
            title: 'Performance Issues',
            content: 'Large templates or many fields may cause performance issues. Try reducing the number of fields or optimizing images.'
          }
        ]
      },
      {
        id: 'best-practices',
        title: 'Best Practices',
        content: 'Tips for creating effective Apple Wallet passes.',
        subsections: [
          {
            id: 'design-principles',
            title: 'Design Principles',
            content: 'Keep designs simple and clean. Use high contrast colors. Ensure text is readable at small sizes. Test on actual devices when possible.'
          },
          {
            id: 'content-guidelines',
            title: 'Content Guidelines',
            content: 'Use clear, concise text. Avoid jargon. Make important information prominent. Use dynamic content with {{variable}} placeholders.'
          },
          {
            id: 'accessibility',
            title: 'Accessibility',
            content: 'Ensure sufficient color contrast. Use descriptive field labels. Test with screen readers. Follow Apple\'s accessibility guidelines.'
          },
          {
            id: 'testing',
            title: 'Testing',
            content: 'Test passes on multiple devices and iOS versions. Verify all dynamic content works correctly. Check image quality and text readability.'
          }
        ]
      }
    ];
  }

  // Get help section by ID
  getHelpSection(id: string): HelpSection | null {
    const sections = this.getHelpSections();
    return this.findSectionById(sections, id);
  }

  // Find section by ID recursively
  private findSectionById(sections: HelpSection[], id: string): HelpSection | null {
    for (const section of sections) {
      if (section.id === id) {
        return section;
      }
      if (section.subsections) {
        const found = this.findSectionById(section.subsections, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Get search results
  searchHelp(query: string): HelpSection[] {
    const sections = this.getHelpSections();
    const results: HelpSection[] = [];
    
    this.searchSections(sections, query.toLowerCase(), results);
    return results;
  }

  // Search sections recursively
  private searchSections(sections: HelpSection[], query: string, results: HelpSection[]): void {
    for (const section of sections) {
      if (section.title.toLowerCase().includes(query) || 
          section.content.toLowerCase().includes(query)) {
        results.push(section);
      }
      if (section.subsections) {
        this.searchSections(section.subsections, query, results);
      }
    }
  }

  // Get quick tips
  getQuickTips(): string[] {
    return [
      'Use Ctrl+N to create a new template quickly',
      'Double-click any field to edit it inline',
      'Use the Properties panel to customize colors and images',
      'Press Ctrl+P to preview your pass in real-time',
      'Use Ctrl+Z to undo changes and Ctrl+Y to redo',
      'Add dynamic content using {{variable}} placeholders',
      'Test your pass on different devices for best results',
      'Keep field labels short and descriptive',
      'Use high contrast colors for better readability',
      'Save your work frequently with Ctrl+S'
    ];
  }

  // Get keyboard shortcuts reference
  getKeyboardShortcuts(): { category: string; shortcuts: { key: string; description: string }[] }[] {
    return [
      {
        category: 'General',
        shortcuts: [
          { key: 'Ctrl+S', description: 'Save template' },
          { key: 'Ctrl+N', description: 'New template' },
          { key: 'Ctrl+O', description: 'Open template' },
          { key: 'Ctrl+E', description: 'Export pass' },
          { key: 'Ctrl+P', description: 'Preview pass' },
          { key: 'Ctrl+F', description: 'Find' },
          { key: 'Ctrl+H', description: 'Help' },
          { key: 'Escape', description: 'Clear selection' },
          { key: 'Delete', description: 'Delete selected field' },
          { key: 'Enter', description: 'Edit selected field' }
        ]
      },
      {
        category: 'Editing',
        shortcuts: [
          { key: 'Ctrl+Z', description: 'Undo' },
          { key: 'Ctrl+Y', description: 'Redo' },
          { key: 'Ctrl+Shift+Z', description: 'Redo' },
          { key: 'Tab', description: 'Next field' },
          { key: 'Shift+Tab', description: 'Previous field' },
          { key: 'Enter', description: 'Save field changes' },
          { key: 'Escape', description: 'Cancel editing' }
        ]
      },
      {
        category: 'Preview',
        shortcuts: [
          { key: 'Ctrl+=', description: 'Zoom in' },
          { key: 'Ctrl+-', description: 'Zoom out' },
          { key: 'Ctrl+0', description: 'Reset zoom' },
          { key: 'Ctrl+R', description: 'Refresh preview' },
          { key: 'Ctrl+1', description: 'iPhone view' },
          { key: 'Ctrl+2', description: 'Apple Watch view' }
        ]
      }
    ];
  }
}

export default HelpService.getInstance();
