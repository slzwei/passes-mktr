import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, Save, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate, useParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import campaignsService from '@/services/campaignsService';
import campaignService from '@/services/campaignService';

console.log('🚀 Services imported:', { campaignsService, campaignService });

console.log('🚀 RedemptionEditor component loaded!');

const RedemptionEditor = () => {
  console.log('🚀 RedemptionEditor function called!');
  const navigate = useNavigate();
  const { campaignId } = useParams();
  console.log('🚀 RedemptionEditor campaignId:', campaignId);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isNextStepLoading, setIsNextStepLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [designData, setDesignData] = useState(null);

  const editorBase = (import.meta.env.VITE_EDITOR_URL || 'http://localhost:3000/editor/').replace(/(?<!\/)$/, '/');
  const editorUrl = `${editorBase}?passType=redemption${campaignId ? `&campaignId=${campaignId}` : ''}`;
  
  // Check if we're in development and editor might not be running
  const isDevelopment = import.meta.env.DEV;

  // Load campaign data on mount
  useEffect(() => {
    if (campaignId) {
      loadCampaignData();
    }
  }, [campaignId]);

  const loadCampaignData = async () => {
    try {
      setIsLoading(true);
      
      // Load campaign and design data
      const [campaignData, designData] = await Promise.all([
        campaignService.getCampaign(campaignId),
        campaignService.getCampaignDesign(campaignId)
      ]);
      
      setCampaign(campaignData);
      setDesignData(designData);
      
      // Check for crash recovery cache
      if (campaignService.hasCrashRecoveryCache(campaignId)) {
        console.warn('Found crash recovery cache for campaign:', campaignId);
        // Could show a UI notification here
      }
      
    } catch (error) {
      console.error('Failed to load campaign data:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle design changes from the iframe
  useEffect(() => {
    const handleMessage = (event) => {
      const allowedOrigin = new URL(editorBase).origin;
      if (event.origin !== allowedOrigin) {
        return;
      }

      if (event.data.type === 'DESIGN_CHANGED' && campaignId) {
        const { design } = event.data;
        
        // Update local state
        setDesignData(prev => ({ ...prev, design }));
        
        // Persist to server (debounced)
        campaignService.updateCampaignDesign(campaignId, design);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [campaignId]);

  // Test Next Step button functionality
  useEffect(() => {
    console.log('🔍 useEffect triggered - isLoading:', isLoading, 'campaignId:', campaignId);
    if (!isLoading && campaignId) {
      // Add a test button click after a delay to verify functionality
      setTimeout(() => {
        console.log('🔍 Looking for Next Step button in DOM...');
        const nextStepButton = document.getElementById('next-step-button');
        console.log('🔍 Next Step button element:', nextStepButton);
        
        // Also check for all buttons
        const allButtons = document.querySelectorAll('button');
        console.log('🔍 All buttons found:', allButtons.length);
        allButtons.forEach((btn, index) => {
          console.log(`🔍 Button ${index}:`, btn.textContent, btn.className);
        });
        
        if (nextStepButton) {
          console.log('✅ Next Step button found in DOM');
          // Test if the button is clickable
          console.log('🔍 Button disabled state:', nextStepButton.disabled);
          console.log('🔍 Button className:', nextStepButton.className);
          
          // Test clicking the button programmatically
          console.log('🧪 Testing programmatic button click...');
          try {
            nextStepButton.click();
            console.log('✅ Programmatic button click executed');
          } catch (error) {
            console.error('❌ Programmatic button click failed:', error);
          }
        } else {
          console.warn('⚠️ Next Step button not found in DOM');
          console.log('🔍 Available elements with IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        }
      }, 2000);
    } else {
      console.log('🔍 Not searching for button yet - isLoading:', isLoading, 'campaignId:', campaignId);
    }
  }, [isLoading, campaignId]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setIsLoading(true);
    setHasError(false);
  };

  const generateAndSavePreview = async () => {
    try {
      console.log('🔄 Generating preview for campaign:', campaignId);
      
      // Get the current design data
      const currentDesign = designData?.design || {};
      
      // Request a snapshot from the editor iframe
      const iframe = document.querySelector('iframe[title="Redemption Card Editor"]');
      console.log('🔍 Looking for iframe...', iframe);
      if (iframe && iframe.contentWindow) {
        console.log('📱 Found editor iframe, requesting snapshot...');
        console.log('📱 Iframe contentWindow:', iframe.contentWindow);
        
        const snapshot = await new Promise((resolve) => {
          const handler = (event) => {
            console.log('📨 Received message from iframe:', event.data);
            if (!event.data || typeof event.data !== 'object') return;
            if (event.data.type === 'SNAPSHOT_READY') {
              window.removeEventListener('message', handler);
              console.log('✅ Snapshot received from iframe');
              resolve(event.data.image);
            } else if (event.data.type === 'SNAPSHOT_ERROR') {
              window.removeEventListener('message', handler);
              console.warn('❌ Snapshot error from iframe');
              resolve(null);
            }
          };
          window.addEventListener('message', handler);
          console.log('📤 Sending REQUEST_SNAPSHOT to iframe...');
          iframe.contentWindow.postMessage({ type: 'REQUEST_SNAPSHOT' }, '*');
          setTimeout(() => { 
            window.removeEventListener('message', handler); 
            console.warn('⏰ Snapshot request timeout');
            resolve(null); 
          }, 5000); // Increased timeout to 5 seconds
        });

        if (snapshot) {
          console.log('📸 Snapshot captured, uploading to server...');
          
          // Upload the preview to the server
          const response = await fetch(`/api/campaigns/${campaignId}/preview`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              previewData: snapshot
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log('✅ Preview saved successfully:', result);
            return result;
          } else {
            console.error('❌ Failed to save preview:', response.status, response.statusText);
            throw new Error(`Failed to save preview: ${response.status} ${response.statusText}`);
          }
        } else {
          console.warn('⚠️ No snapshot captured from editor');
          throw new Error('No snapshot captured from editor');
        }
      } else {
        console.warn('⚠️ Editor iframe not found');
        throw new Error('Editor iframe not found');
      }
    } catch (error) {
      console.error('❌ Failed to generate preview:', error);
      throw error;
    }
  };

  const handleSaveDraft = async () => {
    if (!campaignId) {
      // Legacy behavior for non-campaign workflow
      try {
        setIsSavingDraft(true);
        
        const draftData = {
          passType: 'redemption',
          cardType: 'redemption',
          backgroundColor: '#8B5CF6',
          foregroundColor: '#FFFFFF',
          labelColor: '#FFFFFF',
          stripBackgroundColor: '#F5F5F5',
          logoText: 'REDEMPTION',
          stampsEarned: 4,
          totalStamps: 10,
          secondaryFields: [
            { label: 'Card Holder', value: 'John Doe' },
            { label: 'Redeemed', value: '4 out of 10' }
          ],
          auxiliaryField: {
            label: 'Next Reward',
            value: 'Free coffee at 10 stamps'
          },
          timestamp: new Date().toISOString(),
          version: '1.0'
        };
        
        await campaignsService.saveDraft(draftData);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        
      } catch (error) {
        console.error('Failed to save draft:', error);
        alert('Failed to save draft. Please try again.');
      } finally {
        setIsSavingDraft(false);
      }
      return;
    }

    // New campaign workflow - save design and generate preview
    try {
      setIsSavingDraft(true);
      
      // First, flush any pending design changes
      await campaignService.flushPendingChanges(campaignId);
      
      // Then generate and save preview PNG
      await generateAndSavePreview();
      
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Failed to save draft:', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleContinueToDetails = async () => {
    if (!campaignId) {
      // Legacy behavior
      navigate(createPageUrl("CampaignDetails"));
      return;
    }

    setIsNextStepLoading(true);
    try {
      console.log('🚀 Starting Next Step process for campaign:', campaignId);
      
      // Step 1: Flush any pending changes before navigation
      console.log('💾 Step 1: Flushing pending changes...');
      try {
        await campaignService.flushPendingChanges(campaignId);
        console.log('✅ Step 1: Pending changes flushed successfully');
      } catch (error) {
        console.error('❌ Step 1 failed:', error);
        throw error;
      }
      
      // Step 2: Try to generate and save preview PNG
      console.log('📸 Step 2: Generating and saving preview...');
      try {
        await generateAndSavePreview();
        console.log('✅ Step 2: Preview generated and saved successfully');
      } catch (error) {
        console.error('❌ Step 2 failed (preview generation):', error);
        // Try a fallback: save a simple placeholder preview
        console.log('🔄 Trying fallback preview generation...');
        try {
          const fallbackResponse = await fetch(`/api/campaigns/${campaignId}/preview`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              previewData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            })
          });
          if (fallbackResponse.ok) {
            console.log('✅ Fallback preview saved successfully');
          } else {
            console.log('⚠️ Fallback preview also failed, continuing...');
          }
        } catch (fallbackError) {
          console.log('⚠️ Fallback preview failed:', fallbackError);
        }
        // Don't throw error here, continue with navigation
        console.log('⚠️ Continuing without preview generation...');
      }
      
      // Step 3: Try to capture snapshots for details page
      console.log('🖼️ Step 3: Capturing snapshots for details page...');
      try {
        const iframe = document.querySelector('iframe[title="Redemption Card Editor"]');
        if (iframe && iframe.contentWindow) {
          const capture = async (type) => new Promise((resolve) => {
            const handler = (event) => {
              if (!event.data || typeof event.data !== 'object') return;
              if (event.data.type === `${type}_READY`) {
                window.removeEventListener('message', handler);
                try { sessionStorage.setItem(`campaign:${campaignId}:${type === 'STRIP' ? 'stripImage' : 'snapshot'}`, event.data.image); } catch {}
                console.log(`✅ ${type} captured and stored in sessionStorage`);
                resolve(true);
              } else if (event.data.type === `${type}_ERROR`) {
                window.removeEventListener('message', handler);
                console.warn(`⚠️ ${type} capture failed`);
                resolve(false);
              }
            };
            window.addEventListener('message', handler);
            iframe.contentWindow.postMessage({ type: `REQUEST_${type}` }, '*');
            setTimeout(() => { 
              window.removeEventListener('message', handler); 
              console.warn(`⏰ ${type} capture timeout`);
              resolve(false); 
            }, 2000);
          });
          await capture('SNAPSHOT');
          await capture('STRIP');
          console.log('✅ Step 3: Snapshots captured successfully');
        } else {
          console.warn('⚠️ Step 3: Editor iframe not found, skipping snapshot capture');
        }
      } catch (error) {
        console.warn('⚠️ Step 3 failed (snapshot capture):', error);
        // Don't throw error here, continue with navigation
      }
      
      // Step 4: Navigate to details page
      console.log('🧭 Step 4: Navigating to details page...');
      navigate(`/campaigns/${campaignId}/details`);
      
    } catch (error) {
      console.error('❌ Critical error in Next Step process:', error);
      // Show user-friendly error message
      alert(`Failed to save changes before navigation: ${error.message}. Click OK to continue anyway.`);
      navigate(`/campaigns/${campaignId}/details`);
    } finally {
      setIsNextStepLoading(false);
    }
  };

  const handleNextStep = () => {
    console.log('🔘 Next Step button clicked!');
    if (campaignId) {
      console.log('📋 Campaign ID found, calling handleContinueToDetails...');
      handleContinueToDetails();
    } else {
      // Legacy behavior
      const campaignData = {
        passType: 'redemption',
        cardType: 'redemption'
      };
      
      navigate('/campaigndetails', { 
        state: campaignData 
      });
    }
  };

  useEffect(() => {
    // Reset loading state when URL changes
    setIsLoading(true);
    setHasError(false);
  }, [editorUrl]);

  console.log('🔍 RedemptionEditor rendering - isLoading:', isLoading, 'hasError:', hasError, 'campaignId:', campaignId);
  
  // Simple test to see if component is rendering
  if (campaignId === 'campaign-1758536445764') {
    console.log('🎯 TEST: Component is rendering for the correct campaign!');
  }
  
  return (
    <div className="h-full flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Header with back button and action buttons */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl('CreateCampaign'))}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Redemption Card Editor</h1>
            <p className="text-sm text-gray-600">Design your single-use redemption card</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Success Message */}
          {showSuccessMessage && (
            <div className="text-sm text-green-600 font-medium">
              Draft saved successfully!
            </div>
          )}
          
          {/* Save Draft Button */}
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSavingDraft ? 'Saving...' : 'Save Draft'}
          </Button>

          {/* Next Step Button */}
          <Button
            onClick={(e) => {
              console.log('🔘 Next Step button clicked via onClick handler!', e);
              handleNextStep();
            }}
            disabled={isNextStepLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            id="next-step-button"
            style={{ zIndex: 20 }}
          >
            {isNextStepLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                Next Step
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Redemption Card Editor...</p>
            </div>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="max-w-md mx-auto p-6">
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="space-y-4">
                    <p className="font-medium">Failed to load Redemption Card Editor</p>
                    <p className="text-sm">
                      The editor service at <code className="bg-red-100 px-1 rounded">{editorUrl}</code> is not responding.
                    </p>
                    <div className="text-xs text-red-600 space-y-1">
                      <p>• Make sure the editor is running: <code>cd apps/editor && npm start</code></p>
                      <p>• Or run the full project: <code>npm run dev</code> from root</p>
                      <p>• Check that VITE_EDITOR_URL is set correctly</p>
                      <p>• Verify there are no CORS issues</p>
                    </div>
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        className="flex items-center space-x-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Retry</span>
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}

        <iframe
          key={retryCount} // Force reload on retry
          src={editorUrl}
          className="w-full h-full border-0"
          title="Redemption Card Editor"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          // Allow all necessary permissions for editor functionality
          sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-modals"
          allow="clipboard-write"
          referrerPolicy="no-referrer"
          loading="eager"
        />
      </div>
    </div>
  );
};

export default RedemptionEditor;
