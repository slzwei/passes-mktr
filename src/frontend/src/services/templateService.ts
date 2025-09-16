import { PassTemplate } from '../types/passTypes';

export class TemplateService {
  private static instance: TemplateService;
  private templates: PassTemplate[] = [];
  private currentTemplate: PassTemplate | null = null;

  constructor() {
    this.loadTemplatesFromStorage();
  }

  static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  // Load templates from localStorage
  private loadTemplatesFromStorage(): void {
    try {
      const stored = localStorage.getItem('passTemplates');
      if (stored) {
        this.templates = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading templates from storage:', error);
      this.templates = [];
    }
  }

  // Save templates to localStorage
  private saveTemplatesToStorage(): void {
    try {
      localStorage.setItem('passTemplates', JSON.stringify(this.templates));
    } catch (error) {
      console.error('Error saving templates to storage:', error);
    }
  }

  // Get all templates
  getTemplates(): PassTemplate[] {
    return [...this.templates];
  }

  // Get template by ID
  getTemplate(id: string): PassTemplate | null {
    return this.templates.find(t => t.id === id) || null;
  }

  // Save template
  saveTemplate(template: PassTemplate): string {
    const existingIndex = this.templates.findIndex(t => t.id === template.id);
    
    if (existingIndex >= 0) {
      // Update existing template
      this.templates[existingIndex] = { ...template };
    } else {
      // Create new template
      const newTemplate = {
        ...template,
        id: template.id || this.generateId()
      };
      this.templates.push(newTemplate);
    }

    this.saveTemplatesToStorage();
    return template.id;
  }

  // Delete template
  deleteTemplate(id: string): boolean {
    const index = this.templates.findIndex(t => t.id === id);
    if (index >= 0) {
      this.templates.splice(index, 1);
      this.saveTemplatesToStorage();
      return true;
    }
    return false;
  }

  // Duplicate template
  duplicateTemplate(id: string): PassTemplate | null {
    const template = this.getTemplate(id);
    if (template) {
      const duplicated = {
        ...template,
        id: this.generateId(),
        name: `${template.name} (Copy)`
      };
      this.templates.push(duplicated);
      this.saveTemplatesToStorage();
      return duplicated;
    }
    return null;
  }

  // Set current template
  setCurrentTemplate(template: PassTemplate | null): void {
    this.currentTemplate = template;
  }

  // Get current template
  getCurrentTemplate(): PassTemplate | null {
    return this.currentTemplate;
  }

  // Create new template
  createNewTemplate(): PassTemplate {
    const newTemplate: PassTemplate = {
      id: this.generateId(),
      name: 'New Pass Template',
      type: 'redemption',
      fields: {
        header: [],
        primary: [],
        secondary: [],
        auxiliary: [],
        back: []
      },
      colors: {
        foreground: 'rgb(255, 255, 255)',
        background: 'rgb(60, 65, 76)',
        label: 'rgb(255, 255, 255)'
      },
      images: {
        logo: null,
        icon: null,
        strip: null
      }
    };

    this.templates.push(newTemplate);
    this.saveTemplatesToStorage();
    return newTemplate;
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Export template as JSON
  exportTemplate(id: string): string | null {
    const template = this.getTemplate(id);
    return template ? JSON.stringify(template, null, 2) : null;
  }

  // Import template from JSON
  importTemplate(jsonString: string): PassTemplate | null {
    try {
      const template = JSON.parse(jsonString) as PassTemplate;
      
      // Validate template structure
      if (!template.name || !template.type || !template.fields || !template.colors) {
        throw new Error('Invalid template format');
      }

      // Generate new ID to avoid conflicts
      template.id = this.generateId();
      
      this.templates.push(template);
      this.saveTemplatesToStorage();
      return template;
    } catch (error) {
      console.error('Error importing template:', error);
      return null;
    }
  }

  // Get template statistics
  getTemplateStats(): { total: number; byType: Record<string, number> } {
    const stats = {
      total: this.templates.length,
      byType: {} as Record<string, number>
    };

    this.templates.forEach(template => {
      stats.byType[template.type] = (stats.byType[template.type] || 0) + 1;
    });

    return stats;
  }
}

export default TemplateService.getInstance();
