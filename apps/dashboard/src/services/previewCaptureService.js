/**
 * Preview Capture Service for Dashboard
 * Uses html2canvas to capture pass previews (same as Pass Design Preview)
 */

import html2canvas from 'html2canvas';

class PreviewCaptureService {
  constructor() {
    this.isCapturing = false;
  }

  /**
   * Capture a pass preview element using html2canvas
   * Same approach as Pass Design Preview
   */
  async capturePassPreview(element) {
    try {
      if (this.isCapturing) {
        console.log('⚠️ Already capturing, skipping...');
        return null;
      }

      this.isCapturing = true;
      console.log('📸 Capturing pass preview with html2canvas...');

      // Ensure debug overlays are hidden during capture
      window.__CAPTURE_MODE__ = true;

      // Use html2canvas to capture the element
      const canvas = await html2canvas(element, {
        useCORS: true, // Allow cross-origin images
        allowTaint: true, // Allow tainted canvas
        logging: false, // Disable console logging
        scale: 2, // Higher resolution
        backgroundColor: null // Transparent background
      });

      // Convert canvas to base64 data URL
      const dataURL = canvas.toDataURL('image/png');
      console.log('✅ Pass preview captured successfully');
      console.log('📊 Canvas dimensions:', canvas.width, 'x', canvas.height);
      console.log('📊 Data URL length:', dataURL.length);

      // Reset capture flag
      delete window.__CAPTURE_MODE__;
      this.isCapturing = false;

      return dataURL;
    } catch (error) {
      console.error('❌ Error capturing pass preview:', error);
      this.isCapturing = false;
      delete window.__CAPTURE_MODE__;
      throw error;
    }
  }

  /**
   * Capture preview and send to backend
   */
  async captureAndSavePreview(campaignId, element) {
    try {
      const dataURL = await this.capturePassPreview(element);
      if (!dataURL) return null;

      // Send to backend
      const response = await fetch(`/api/campaigns/${campaignId}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          previewData: dataURL,
          campaignId: campaignId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save preview: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Preview saved to backend:', result);
      return result.previewUrl;
    } catch (error) {
      console.error('❌ Failed to capture and save preview:', error);
      throw error;
    }
  }
}

export default new PreviewCaptureService();
