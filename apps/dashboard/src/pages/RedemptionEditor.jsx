import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, Save, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate, useParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import campaignsService from '@/services/campaignsService';
import campaignService from '@/services/campaignService';

const RedemptionEditor = () => {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
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

    // New campaign workflow - force save any pending changes
    try {
      setIsSavingDraft(true);
      await campaignService.flushPendingChanges(campaignId);
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

    try {
      // Flush any pending changes before navigation
      await campaignService.flushPendingChanges(campaignId);
      navigate(`/campaigns/${campaignId}/details`);
    } catch (error) {
      console.error('Failed to save changes before navigation:', error);
      // Navigate anyway but warn user
      if (confirm('There was an issue saving your changes. Continue anyway?')) {
        navigate(`/campaigns/${campaignId}/details`);
      }
    }
  };

  const handleNextStep = () => {
    if (campaignId) {
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
            onClick={handleNextStep}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            Next Step
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
