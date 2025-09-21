// previewCapture.ts
// SOLID: Single Responsibility - Capture live preview elements

import { PreviewCapture } from '../types/stripInterfaces';
import html2canvas from 'html2canvas';

export class CanvasPreviewCapture implements PreviewCapture {
  /**
   * Capture strip element using html2canvas
   */
  async captureStripElement(element: HTMLElement): Promise<string> {
    try {
      console.log('📸 Capturing live preview strip...');
      
      // Ensure debug overlays are hidden during capture
      (window as any).__CAPTURE_MODE__ = true;

      // Use html2canvas to capture the strip element
      const canvas = await html2canvas(element, {
        useCORS: true, // Allow cross-origin images
        allowTaint: true, // Allow tainted canvas
        logging: false // Disable console logging
      });
      
      // Convert canvas to base64 data URL
      const dataURL = canvas.toDataURL('image/png');
      console.log('✅ Live preview strip captured successfully');
      console.log('📊 Canvas dimensions:', canvas.width, 'x', canvas.height);
      console.log('📊 Data URL length:', dataURL.length);
      
      // Reset capture flag
      delete (window as any).__CAPTURE_MODE__;

      return dataURL;
    } catch (error) {
      console.error('Error capturing live preview strip:', error);
      throw error;
    }
  }
}
