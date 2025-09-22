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

  /**
   * Capture any element using html2canvas
   */
  async captureElement(element: HTMLElement): Promise<string> {
    try {
      console.log('📸 Starting element capture...');
      console.log('🎯 Element to capture:', element.className, element.style.cssText);

      if (!element) {
        throw new Error('Element to capture is not available');
      }

      // Force a reflow to ensure all styles are applied
      void element.offsetHeight;

      const rect = element.getBoundingClientRect();
      console.log('📊 Element dimensions:', rect.width, 'x', rect.height);

      // Check if element is visible and has dimensions
      if (rect.width === 0 || rect.height === 0) {
        console.warn('⚠️ Element has zero dimensions, trying to capture parent');
        const parent = element.parentElement;
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          console.log('📊 Parent dimensions:', parentRect.width, 'x', parentRect.height);
          if (parentRect.width > 0 && parentRect.height > 0) {
            element = parent;
          }
        }
      }

      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        background: null as unknown as string,
        width: rect.width,
        height: rect.height,
        // scale intentionally omitted due to type mismatch; defaults are fine
        // scroll positions omitted to avoid TS option mismatch in current version
      });

      console.log('📷 Canvas captured:', canvas.width, 'x', canvas.height);

      const dataURL = canvas.toDataURL('image/png', 0.8); // 80% quality
      console.log('✅ Element captured successfully, data URL length:', dataURL.length);

      return dataURL;
    } catch (error) {
      console.error('❌ Error capturing element:', error);
      throw error;
    }
  }
}
