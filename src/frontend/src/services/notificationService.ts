import { NotificationProps } from '../components/common/Notification';

export class NotificationService {
  private static instance: NotificationService;
  private notifications: NotificationProps[] = [];
  private listeners: Set<(notifications: NotificationProps[]) => void> = new Set();

  constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Subscribe to notification changes
  subscribe(listener: (notifications: NotificationProps[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  private notify(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  // Add a notification
  add(notification: Omit<NotificationProps, 'id' | 'onClose'>): string {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const newNotification: NotificationProps = {
      ...notification,
      id,
      onClose: (id: string) => this.remove(id)
    };

    this.notifications.push(newNotification);
    this.notify();
    return id;
  }

  // Remove a notification
  remove(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notify();
  }

  // Clear all notifications
  clear(): void {
    this.notifications = [];
    this.notify();
  }

  // Get all notifications
  getNotifications(): NotificationProps[] {
    return [...this.notifications];
  }

  // Success notification
  success(title: string, message: string, duration?: number): string {
    return this.add({
      type: 'success',
      title,
      message,
      duration
    });
  }

  // Error notification
  error(title: string, message: string, duration?: number): string {
    return this.add({
      type: 'error',
      title,
      message,
      duration
    });
  }

  // Warning notification
  warning(title: string, message: string, duration?: number): string {
    return this.add({
      type: 'warning',
      title,
      message,
      duration
    });
  }

  // Info notification
  info(title: string, message: string, duration?: number): string {
    return this.add({
      type: 'info',
      title,
      message,
      duration
    });
  }

  // Template saved notification
  templateSaved(templateName: string): string {
    return this.success(
      'Template Saved',
      `"${templateName}" has been saved successfully.`,
      3000
    );
  }

  // Template loaded notification
  templateLoaded(templateName: string): string {
    return this.success(
      'Template Loaded',
      `"${templateName}" has been loaded successfully.`,
      3000
    );
  }

  // Template deleted notification
  templateDeleted(templateName: string): string {
    return this.info(
      'Template Deleted',
      `"${templateName}" has been deleted.`,
      3000
    );
  }

  // Pass exported notification
  passExported(): string {
    return this.success(
      'Pass Exported',
      'Your Apple Wallet pass has been exported successfully.',
      3000
    );
  }

  // Validation error notification
  validationError(errors: string[]): string {
    return this.error(
      'Validation Error',
      `Please fix the following issues: ${errors.join(', ')}`,
      5000
    );
  }

  // Connection error notification
  connectionError(): string {
    return this.error(
      'Connection Error',
      'Unable to connect to the server. Please check your connection.',
      5000
    );
  }

  // Preview generated notification
  previewGenerated(): string {
    return this.success(
      'Preview Generated',
      'Your pass preview has been updated.',
      2000
    );
  }

  // Field added notification
  fieldAdded(fieldType: string): string {
    return this.success(
      'Field Added',
      `New ${fieldType} field has been added.`,
      2000
    );
  }

  // Field deleted notification
  fieldDeleted(fieldType: string): string {
    return this.info(
      'Field Deleted',
      `${fieldType} field has been removed.`,
      2000
    );
  }

  // Image uploaded notification
  imageUploaded(imageType: string): string {
    return this.success(
      'Image Uploaded',
      `${imageType} image has been uploaded successfully.`,
      2000
    );
  }

  // Image upload error notification
  imageUploadError(error: string): string {
    return this.error(
      'Upload Error',
      `Failed to upload image: ${error}`,
      4000
    );
  }

  // Color updated notification
  colorUpdated(colorType: string): string {
    return this.success(
      'Color Updated',
      `${colorType} color has been updated.`,
      2000
    );
  }

  // Undo notification
  undo(action: string): string {
    return this.info(
      'Undo',
      `"${action}" has been undone.`,
      2000
    );
  }

  // Redo notification
  redo(action: string): string {
    return this.info(
      'Redo',
      `"${action}" has been redone.`,
      2000
    );
  }

  // Copy notification
  copied(item: string): string {
    return this.success(
      'Copied',
      `${item} has been copied to clipboard.`,
      2000
    );
  }

  // Paste notification
  pasted(item: string): string {
    return this.success(
      'Pasted',
      `${item} has been pasted.`,
      2000
    );
  }

  // Template created notification
  templateCreated(templateName: string): string {
    return this.success(
      'Template Created',
      `"${templateName}" has been created successfully.`,
      3000
    );
  }

  // Template duplicated notification
  templateDuplicated(templateName: string): string {
    return this.success(
      'Template Duplicated',
      `"${templateName}" has been duplicated.`,
      3000
    );
  }

  // Template exported notification
  templateExported(templateName: string): string {
    return this.success(
      'Template Exported',
      `"${templateName}" has been exported successfully.`,
      3000
    );
  }

  // Template imported notification
  templateImported(templateName: string): string {
    return this.success(
      'Template Imported',
      `"${templateName}" has been imported successfully.`,
      3000
    );
  }

  // Templates deleted notification
  templatesDeleted(count: number): string {
    return this.info(
      'Templates Deleted',
      `${count} template${count > 1 ? 's' : ''} deleted successfully.`,
      3000
    );
  }
}

export default NotificationService.getInstance();
