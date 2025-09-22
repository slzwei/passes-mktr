import React, { useState, useCallback, useEffect } from 'react';
import PassPreview from './components/PassPreview';
import DesignEditor from './components/DesignEditor';
import ToastContainer, { ToastData } from './components/ui/ToastContainer';
import { PassDesign, CardType } from './types';
import './App.css';
import { CanvasPreviewCapture } from './services/previewCapture';
import { enhancedAutoSaveService } from './services/enhancedAutoSave';
import { RotateCcw, Undo2, Redo2, CreditCard, Star, Target, Wifi, WifiOff, Save, Check } from 'lucide-react';

function App() {
  // Get pass type and campaign ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const passTypeFromUrl = urlParams.get('passType') as CardType;
  const campaignId = urlParams.get('campaignId');
  
  const defaultExp = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  })();
  
  const getDefaultDesign = (cardType: CardType = 'redemption'): PassDesign => {
    // Define pass type-specific templates that match the CreateCampaign previews
    const templates = {
      redemption: {
        backgroundColor: '#8B5CF6', // Purple-500
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
        numberOfMilestones: 2,
        milestonePositions: [5, 10],
        pointsBalance: 1250,
        pointsEarned: 1250,
        pointsRequired: 2000,
        pointsPerTransaction: 50,
        nextRewardPoints: 2000,
      },
      milestone: {
        backgroundColor: '#3B82F6', // Blue-500
        logoText: 'MILESTONE',
        stampsEarned: 4,
        totalStamps: 10,
        secondaryFields: [
          { label: 'Card Holder', value: 'John Doe' },
          { label: 'Next Reward', value: 'Free coffee at 5 stamps' }
        ],
        auxiliaryField: {
          label: 'Next Reward',
          value: ''
        },
        numberOfMilestones: 2,
        milestonePositions: [5, 10],
        pointsBalance: 1250,
        pointsEarned: 1250,
        pointsRequired: 2000,
        pointsPerTransaction: 50,
        nextRewardPoints: 2000,
      },
      points: {
        backgroundColor: '#F97316', // Orange-500
        logoText: 'POINTS',
        stampsEarned: 4,
        totalStamps: 10,
        secondaryFields: [
          { label: 'Card Holder', value: 'John Doe' },
          { label: 'Next Reward', value: 'at 2,000 points' }
        ],
        auxiliaryField: {
          label: 'Next Reward',
          value: 'Next Reward at 2,000 points'
        },
        numberOfMilestones: 2,
        milestonePositions: [5, 10],
        pointsBalance: 1250,
        pointsEarned: 1250,
        pointsRequired: 2000,
        pointsPerTransaction: 50,
        nextRewardPoints: 2000,
      }
    };

    const template = templates[cardType] || templates.redemption;

    return {
      cardType,
      backgroundColor: template.backgroundColor,
      foregroundColor: '#FFFFFF',
      labelColor: '#FFFFFF',
      stripBackgroundColor: '#F5F5F5',
      logoText: template.logoText,
      logoImage: null,
      logoFormat: 'square',
      hideLogoText: false,
      removePlaceholderLogo: false,
      secondaryFields: template.secondaryFields,
      auxiliaryField: template.auxiliaryField,
      // Redemption Card Fields
      stampsEarned: template.stampsEarned,
      totalStamps: template.totalStamps,
      // Milestone Card Fields
      numberOfMilestones: template.numberOfMilestones,
      milestonePositions: template.milestonePositions,
      // Points Card Fields
      pointsBalance: template.pointsBalance,
      pointsEarned: template.pointsEarned,
      pointsRequired: template.pointsRequired,
      pointsPerTransaction: template.pointsPerTransaction,
      nextRewardPoints: template.nextRewardPoints,
      // Legacy Milestone Card Fields (keeping for compatibility)
      milestoneLevels: [
        { level: 1, name: 'Bronze', pointsRequired: 500, reward: '10% off' },
        { level: 2, name: 'Silver', pointsRequired: 1000, reward: '15% off' },
        { level: 3, name: 'Gold', pointsRequired: 2000, reward: '20% off' },
        { level: 4, name: 'Platinum', pointsRequired: 5000, reward: 'Free coffee' }
      ],
      currentMilestone: 2,
      nextMilestonePoints: 2000,
      logoSize: 38,
      cardWidth: 375,
      cardHeight: 504,
      stripHeight: 144,
      headerHeight: 80,
      secondaryHeight: 100,
      auxiliaryHeight: 80,
      barcodeHeight: 100,
      qrAltText: '',
      expirationDate: defaultExp,
      hasExpiryDate: false,
      suppressStripShine: true,
      stripBackgroundImage: '/storage/images/processed/default-strip-background.png',
      stripBackgroundOpacity: 0.8,
      // Stamp Icons
      stampIconUnredeemed: null,
      stampIconRedeemed: null,
      stampIconMilestone: null,
      useSameStampIcon: true,
      useMilestoneOverlay: true,
      // Stamp Colors - Default to background color
      stampUnredeemedColor: '#e5e7eb', // Light grey for unredeemed stamps
      stampEarnedColor: undefined, // Will use background color
      stampMilestoneColor: undefined, // Will use background color
      stampMilestoneCircleColor: undefined // Will use background color
    };
  };

  const [passDesign, setPassDesign] = useState<PassDesign>(getDefaultDesign(passTypeFromUrl || 'redemption'));
  const [designHistory, setDesignHistory] = useState<PassDesign[]>([getDefaultDesign(passTypeFromUrl || 'redemption')]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showEditor, setShowEditor] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [saveStatus, setSaveStatus] = useState<{
    saving: boolean;
    saved: boolean;
    error: boolean;
    message: string;
  }>({ saving: false, saved: false, error: false, message: '' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [autoSaveStats, setAutoSaveStats] = useState(enhancedAutoSaveService.getStats());
  const previewContainerRef = React.useRef<HTMLDivElement | null>(null);

  // Setup enhanced auto-save event listeners
  React.useEffect(() => {
    const handleShowSaveIndicator = (event: CustomEvent) => {
      const { campaignId, message, type } = event.detail;
      if (campaignId === campaignId) {
        setSaveStatus({
          saving: type === 'info',
          saved: type === 'success',
          error: type === 'error',
          message: message || ''
        });
      }
    };

    const handleHideSaveIndicator = (event: CustomEvent) => {
      const { campaignId: eventCampaignId } = event.detail;
      if (eventCampaignId === campaignId) {
        setSaveStatus(prev => ({
          ...prev,
          saving: false,
          saved: true,
          message: 'Changes saved'
        }));

        // Hide "saved" indicator after 2 seconds
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, saved: false, message: '' }));
        }, 2000);
      }
    };

    const handleOnlineStatus = () => setIsOnline(true);
    const handleOfflineStatus = () => setIsOnline(false);

    // Update auto-save stats periodically
    const statsInterval = setInterval(() => {
      setAutoSaveStats(enhancedAutoSaveService.getStats());
    }, 5000);

    window.addEventListener('show-save-indicator', handleShowSaveIndicator as EventListener);
    window.addEventListener('hide-save-indicator', handleHideSaveIndicator as EventListener);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);

    return () => {
      window.removeEventListener('show-save-indicator', handleShowSaveIndicator as EventListener);
      window.removeEventListener('hide-save-indicator', handleHideSaveIndicator as EventListener);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
      clearInterval(statsInterval);
    };
  }, [campaignId]);

  // Listen for snapshot requests from parent (dashboard)
  React.useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      try {
        if (!event.data || typeof event.data !== 'object') return;

        if (event.data.type === 'TRIGGER_PREVIEW_CAPTURE') {
          console.log('🖼️ Received trigger preview capture message');
          if (!campaignId) {
            console.error('❌ No campaign ID available for preview capture');
            return;
          }

          // Find the pass preview element and capture it
          let target = (previewContainerRef.current?.querySelector('.relative.rounded-2xl.shadow-2xl.overflow-hidden.flex.flex-col') as HTMLElement | null);

          // Fallback selectors if the first one doesn't work
          if (!target) {
            target = previewContainerRef.current?.querySelector('[style*="width"][style*="height"]') as HTMLElement | null;
          }
          if (!target) {
            target = previewContainerRef.current?.querySelector('.flex.flex-col') as HTMLElement | null;
          }

          if (!target) {
            console.error('❌ Target element not found for preview capture');
            return;
          }

          console.log('🎯 Found target element for capture');

          // Small delay to ensure DOM is fully rendered
          await new Promise(resolve => setTimeout(resolve, 100));

          const capturer = new CanvasPreviewCapture();
          const dataUrl = await capturer.captureElement(target);
          console.log('📸 Preview captured, data URL length:', dataUrl.length);

          // Upload to backend
          const response = await fetch(`/api/campaigns/${campaignId}/preview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ previewData: dataUrl })
          });

          if (response.ok) {
            console.log('✅ Preview capture and upload successful');
            // Notify parent window that preview has been updated
            window.parent?.postMessage({
              type: 'CAMPAIGN_PREVIEW_UPDATED',
              campaignId: campaignId
            }, '*');
          } else {
            console.error('❌ Failed to upload preview:', response.status, await response.text());
          }
          return;
        }

        const capturer = new CanvasPreviewCapture();
        if (event.data.type === 'REQUEST_SNAPSHOT') {
          const target = (previewContainerRef.current?.querySelector('.relative.rounded-2xl.shadow-2xl.overflow-hidden.flex.flex-col') as HTMLElement | null) || undefined;
          const dataUrl = await capturer.captureElement(target || document.body);
          window.parent?.postMessage({ type: 'SNAPSHOT_READY', image: dataUrl }, '*');
          return;
        }
        if (event.data.type === 'REQUEST_STRIP') {
          const stripEl = document.querySelector('.stamp-strip-container') as HTMLElement | null;
          if (!stripEl) throw new Error('Strip element not found');
          const stripUrl = await capturer.captureStripElement(stripEl);
          window.parent?.postMessage({ type: 'STRIP_READY', image: stripUrl }, '*');
          return;
        }
      } catch (err: any) {
        const messageType = (event.data && event.data.type) || 'UNKNOWN_REQUEST';
        window.parent?.postMessage({ type: `${messageType}_ERROR`, error: err?.message || 'Capture failed' }, '*');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [campaignId]);

  // Load saved design data when campaignId is provided
  React.useEffect(() => {
    if (campaignId) {
      const loadSavedDesign = async () => {
        try {
          const response = await fetch(`/api/campaigns/${campaignId}/design`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.design) {
              const savedDesign = data.data.design;
              // Merge saved design with default design to ensure all required fields are present
              const mergedDesign = {
                ...getDefaultDesign(passTypeFromUrl || 'redemption'),
                ...savedDesign,
                // Ensure cardType matches the URL parameter
                cardType: passTypeFromUrl || 'redemption'
              };
              setPassDesign(mergedDesign);
              setDesignHistory([mergedDesign]);
              setHistoryIndex(0);

            }
          }
        } catch (error) {
          console.error('Failed to load saved design:', error);
        }
      };
      loadSavedDesign();
    }
  }, [campaignId, passTypeFromUrl]);

  // History management functions
  const addToHistory = (newDesign: PassDesign) => {
    // Remove any future history if we're not at the end
    const newHistory = designHistory.slice(0, historyIndex + 1);
    newHistory.push(newDesign);
    
    // Limit history to 50 items
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setDesignHistory(newHistory);
    setPassDesign(newDesign);
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPassDesign(designHistory[newIndex]);
    }
  }, [historyIndex, designHistory]);

  const handleRedo = useCallback(() => {
    if (historyIndex < designHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setPassDesign(designHistory[newIndex]);
    }
  }, [historyIndex, designHistory]);

  // Toast management functions
  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset to default? This will clear all your changes and cannot be undone.')) {
      const defaultDesign = getDefaultDesign();
      setPassDesign(defaultDesign);
      setDesignHistory([defaultDesign]);
      setHistoryIndex(0);
      addToast({
        type: 'info',
        title: 'Reset Complete',
        message: 'Pass design has been reset to default settings.'
      });
    }
  };

  const handleDesignChange = (newDesign: PassDesign) => {
    addToHistory(newDesign);
    
    // Enhanced auto-save with immediate UX feedback
    if (campaignId) {
      enhancedAutoSaveService.autoSaveDesign(campaignId, newDesign, {
        delay: 2000,
        showIndicator: true,
        onSave: async (result) => {
          console.log('✅ Design auto-saved:', result);
          
          // Capture and upload preview in background
          try {
            let target = (previewContainerRef.current?.querySelector('.relative.rounded-2xl.shadow-2xl.overflow-hidden.flex.flex-col') as HTMLElement | null);
            if (!target) {
              target = previewContainerRef.current?.querySelector('[style*="width"][style*="height"]') as HTMLElement | null;
            }
            if (!target) {
              target = previewContainerRef.current?.querySelector('.flex.flex-col') as HTMLElement | null;
            }

            if (!target) {
              console.warn('⚠️ Preview capture skipped: target element not found');
              return;
            }

            // Small delay for DOM updates
            await new Promise(resolve => setTimeout(resolve, 100));

            const capturer = new CanvasPreviewCapture();
            const dataUrl = await capturer.captureElement(target);

            // Upload optimized preview
            const response = await fetch(`/api/campaigns/${campaignId}/preview`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ previewData: dataUrl })
            });

            if (response.ok) {
              console.log('📸 Preview updated successfully');
            }
          } catch (err) {
            console.error('❌ Preview capture failed:', err);
          }
        },
        onError: (error) => {
          console.error('❌ Auto-save failed:', error);
          addToast({
            type: 'error',
            title: 'Save Failed',
            message: 'Your changes are cached locally and will sync when connection is restored.',
            duration: 5000
          });
        }
      });
    }
    
    // Notify parent window of changes
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'DESIGN_CHANGED',
        design: newDesign
      }, '*');
    }
  };

  const handleCardTypeChange = (newCardType: CardType) => {
    if (newCardType === passDesign.cardType) return;
    
    // Create a new design with the selected card type and appropriate default fields
    const newDesign = getDefaultDesign(newCardType);
    
    // Preserve some common settings
    newDesign.backgroundColor = passDesign.backgroundColor;
    newDesign.foregroundColor = passDesign.foregroundColor;
    newDesign.labelColor = passDesign.labelColor;
    newDesign.stripBackgroundColor = passDesign.stripBackgroundColor;
    newDesign.stripBackgroundImage = passDesign.stripBackgroundImage;
    newDesign.stripBackgroundOpacity = passDesign.stripBackgroundOpacity;
    newDesign.logoText = passDesign.logoText;
    newDesign.logoImage = passDesign.logoImage;
    newDesign.logoFormat = passDesign.logoFormat;
    newDesign.hideLogoText = passDesign.hideLogoText;
    newDesign.qrAltText = passDesign.qrAltText;
    newDesign.expirationDate = passDesign.expirationDate;
    newDesign.hasExpiryDate = passDesign.hasExpiryDate;
    
    addToHistory(newDesign);
    
    // Notify parent window (dashboard) of design changes
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'DESIGN_CHANGED',
        design: newDesign
      }, '*');
    }
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, designHistory, handleUndo, handleRedo]);


  const handleGeneratePass = async () => {
    try {
      setIsGenerating(true);
      // 1) Capture strip from live preview
      const stripEl = document.querySelector('.stamp-strip-container') as HTMLElement | null;
      if (!stripEl) {
        addToast({
          type: 'error',
          title: 'Preview Error',
          message: 'Could not find the live preview strip to capture. Please ensure the preview is visible.'
        });
        return;
      }
      const capturer = new CanvasPreviewCapture();
      const stripPngDataUrl = await capturer.captureStripElement(stripEl);

      // 2) Build payload from current design
      const payload = {
        campaignId: '550e8400-e29b-41d4-a716-446655440001',
        campaignName: passDesign.logoText || '',
        tenantName: 'MKTR Platform',
        customerEmail: 'demo@mktr.sg',
        customerName: passDesign.secondaryFields && passDesign.secondaryFields.length > 0 ? (passDesign.secondaryFields[0].value || 'Customer Name') : 'Customer Name',
        stampsEarned: passDesign.stampsEarned,
        stampsRequired: passDesign.totalStamps,
        expirationDate: passDesign.expirationDate,
        hasExpiryDate: passDesign.hasExpiryDate,
        suppressStripShine: passDesign.suppressStripShine,
        colors: {
          foreground: passDesign.foregroundColor,
          background: passDesign.backgroundColor,
          label: passDesign.labelColor,
          stripBackground: passDesign.stripBackgroundColor
        },
        images: {
          stripImage: stripPngDataUrl,
          logo: passDesign.logoImage || undefined,
          logoImage: passDesign.logoImage || undefined,
          stripBackground: passDesign.stripBackgroundImage || undefined,
          stripBackgroundOpacity: passDesign.stripBackgroundOpacity || 0.8
        },
        removePlaceholderLogo: passDesign.removePlaceholderLogo || false,
        qrAltText: passDesign.qrAltText || '',
        // Milestone configuration
        milestones: passDesign.cardType === 'milestone' ? {
          numberOfMilestones: passDesign.numberOfMilestones || 2,
          milestonePositions: passDesign.milestonePositions || [5, 10],
          useMilestoneOverlay: true
        } : undefined,
        fieldConfig: {
          fields: {
            header: [
              passDesign.cardType === 'redemption' ? {
                key: 'expiryDate',
                label: 'EXPIRY',
                value: passDesign.hasExpiryDate && passDesign.expirationDate ? (
                  new Date(passDesign.expirationDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }).replace(/\//g, '/')
                ) : 'No Expiry',
                textAlignment: 'PKTextAlignmentRight'
              } : passDesign.cardType === 'points' ? {
                key: 'pointsValue',
                label: 'POINTS',
                value: (passDesign.pointsBalance || 0).toLocaleString(),
                textAlignment: 'PKTextAlignmentRight'
              } : passDesign.cardType === 'milestone' ? {
                key: 'nextReward',
                label: 'NEXT REWARD',
                value: (() => {
                  // Calculate next milestone
                  const milestonePositions = passDesign.milestonePositions || [];
                  const nextMilestone = milestonePositions.find(pos => pos > passDesign.stampsEarned);
                  
                  if (nextMilestone) {
                    const stampsNeeded = nextMilestone - passDesign.stampsEarned;
                    return `${stampsNeeded} stamp${stampsNeeded !== 1 ? 's' : ''} more`;
                  } else {
                    // All milestones achieved
                    return 'Fully Redeemed';
                  }
                })(),
                textAlignment: 'PKTextAlignmentRight'
              } : {
                key: 'pointsValue',
                label: 'POINTS',
                value: '1836',
                textAlignment: 'PKTextAlignmentRight'
              }
            ],
            primary: [],
            secondary: passDesign.cardType === 'redemption' ? [
              {
                key: 'cardHolder',
                label: 'Card Holder',
                value: passDesign.secondaryFields && passDesign.secondaryFields.length > 0 ? passDesign.secondaryFields[0].value : 'John Doe',
                textAlignment: 'PKTextAlignmentLeft'
              },
              {
                key: 'redeemed',
                label: 'Redeemed',
                value: `${passDesign.stampsEarned} out of ${passDesign.totalStamps}`,
                textAlignment: 'PKTextAlignmentLeft'
              }
            ] : passDesign.cardType === 'points' ? [
              {
                key: 'cardHolder',
                label: 'Card Holder',
                value: passDesign.secondaryFields && passDesign.secondaryFields.length > 0 ? passDesign.secondaryFields[0].value : 'John Doe',
                textAlignment: 'PKTextAlignmentLeft'
              },
              {
                key: 'nextReward',
                label: 'Next Reward',
                value: 'at 2,000 points',
                textAlignment: 'PKTextAlignmentRight'
              }
            ] : passDesign.cardType === 'milestone' ? [
              {
                key: 'cardHolder',
                label: 'Card Holder',
                value: passDesign.secondaryFields && passDesign.secondaryFields.length > 0 ? passDesign.secondaryFields[0].value : 'John Doe',
                textAlignment: 'PKTextAlignmentLeft'
              },
              {
                key: 'nextReward',
                label: 'Next Reward',
                value: (() => {
                  // Calculate next milestone dynamically
                  const milestonePositions = passDesign.milestonePositions || [];
                  const nextMilestone = milestonePositions.find(pos => pos > passDesign.stampsEarned);
                  
                  if (nextMilestone) {
                    return `Free coffee at ${nextMilestone} stamps`;
                  } else {
                    return 'All rewards earned!';
                  }
                })(),
                textAlignment: 'PKTextAlignmentRight'
              }
            ] : [],
            auxiliary: []
          }
        }
      };

      // 3) Request backend to generate working pass and return .pkpass
      const res = await fetch(`/api/passes/generate-working`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to generate pass');
      }

      // 4) Debug: Log provenance headers for the files used
      try {
        const logo = res.headers.get('X-Pass-Logo');
        const logo2x = res.headers.get('X-Pass-Logo2x');
        const logo3x = res.headers.get('X-Pass-Logo3x');
        const logoSource = res.headers.get('X-Pass-Logo-Source');
        const icon = res.headers.get('X-Pass-Icon');
        const icon2x = res.headers.get('X-Pass-Icon2x');
        const strip = res.headers.get('X-Pass-Strip');
        const strip2x = res.headers.get('X-Pass-Strip2x');
        const strip3x = res.headers.get('X-Pass-Strip3x');
        console.log('[PKPASS FILES USED]', { logo, logo2x, logo3x, logoSource, icon, icon2x, strip, strip2x, strip3x });
      } catch {}

      // 5) Download the pkpass
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(payload.campaignName || 'loyalty_pass').toString().replace(/\s+/g, '_')}.pkpass`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      // Show success toast
      addToast({
        type: 'success',
        title: 'Pass Generated',
        message: `Your ${passDesign.cardType} pass has been generated and downloaded successfully!`
      });
    } catch (e: any) {
      console.error('Generate pass failed', e);
      addToast({
        type: 'error',
        title: 'Pass Generation Failed',
        message: e?.message || 'Failed to generate pass. Please check your configuration and try again.',
        errorCode: e?.code || undefined,
        duration: 7000
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Design Editor Sidebar */}
        {showEditor && (
          <div className="w-full lg:w-96 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 lg:flex-shrink-0 max-h-96 lg:max-h-none overflow-y-auto lg:overflow-visible">
            <DesignEditor 
              design={passDesign} 
              onDesignChange={handleDesignChange}
            />
          </div>
        )}

        {/* Pass Preview Area */}
        <div className="flex-1 flex flex-col bg-gray-50 min-h-0">
          {/* Mobile: Show/Hide Editor Toggle */}
          <div className="lg:hidden p-3 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowEditor(!showEditor)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  showEditor 
                    ? 'bg-gray-100 text-gray-700' 
                    : 'bg-blue-600 text-white'
                }`}
              >
                {showEditor ? 'Hide Controls' : 'Show Controls'}
              </button>
              
              {/* Save Status Indicator */}
              <div className="ml-3 flex items-center space-x-2">
                {!isOnline && (
                  <div className="flex items-center space-x-1 text-amber-600">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-xs">Offline</span>
                  </div>
                )}
                
                {saveStatus.saving && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <Save className="w-4 h-4 animate-pulse" />
                    <span className="text-xs">Saving...</span>
                  </div>
                )}
                
                {saveStatus.saved && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-xs">Saved</span>
                  </div>
                )}
                
                {saveStatus.error && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-xs">Failed</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-3 lg:p-6 overflow-auto" ref={previewContainerRef}>
            <div className="w-full max-w-sm lg:max-w-none lg:w-auto">
              <PassPreview design={passDesign} onDesignChange={(updates) => {
                const newDesign = { ...passDesign, ...updates };
                handleDesignChange(newDesign);
              }} />
            </div>
            
            {/* Action Buttons - Centered under the pass */}
            <div className="flex flex-col items-center space-y-4 mt-6">
              {/* History Controls and Generate Demo */}
              <div className="flex items-center space-x-3">
                {/* History Controls */}
                <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="p-1.5 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Undo (Cmd+Z)"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= designHistory.length - 1}
                    className="p-1.5 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Redo (Cmd+Shift+Z)"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-gray-300 mx-1"></div>
                  <button
                    onClick={handleReset}
                    className="p-1.5 rounded-md hover:bg-white text-red-600 hover:text-red-700 transition-all"
                    title="Reset to Default"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Manual Preview Capture Button */}
                <button
                  onClick={async () => {
                    if (!campaignId) {
                      console.error('❌ No campaign ID available for preview capture');
                      return;
                    }

                    console.log('🖼️ Manual preview capture for campaign:', campaignId);
                    try {
                      // Find the pass preview element
                      let target = (previewContainerRef.current?.querySelector('.relative.rounded-2xl.shadow-2xl.overflow-hidden.flex.flex-col') as HTMLElement | null);

                      // Fallback selectors if the first one doesn't work
                      if (!target) {
                        target = previewContainerRef.current?.querySelector('[style*="width"][style*="height"]') as HTMLElement | null;
                      }
                      if (!target) {
                        target = previewContainerRef.current?.querySelector('.flex.flex-col') as HTMLElement | null;
                      }

                      if (!target) {
                        console.error('❌ Target element not found for preview capture');
                        console.log('Available elements:', previewContainerRef.current?.querySelectorAll('*').length);
                        return;
                      }

                      console.log('🎯 Found target element:', target.className);

                      // Small delay to ensure DOM is fully rendered
                      await new Promise(resolve => setTimeout(resolve, 100));

                      const capturer = new CanvasPreviewCapture();
                      const dataUrl = await capturer.captureElement(target);
                      console.log('📸 Preview captured, data URL length:', dataUrl.length);

                      // Upload to backend
                      const response = await fetch(`/api/campaigns/${campaignId}/preview`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ previewData: dataUrl })
                      });

                      if (response.ok) {
                        const result = await response.json();
                        console.log('✅ Manual preview capture and upload successful:', result);

                        // Show success message
                        addToast({
                          type: 'success',
                          title: 'Preview Updated',
                          message: 'Campaign preview has been updated successfully!'
                        });

                        // Refresh the campaign list in parent window
                        if (window.parent && window.parent !== window) {
                          window.parent.postMessage({
                            type: 'CAMPAIGN_PREVIEW_UPDATED',
                            campaignId: campaignId
                          }, '*');
                        }
                      } else {
                        const error = await response.json();
                        console.error('❌ Failed to upload preview:', response.status, error);
                        addToast({
                          type: 'error',
                          title: 'Preview Update Failed',
                          message: 'Failed to update campaign preview. Please try again.'
                        });
                      }
                    } catch (error) {
                      console.error('❌ Manual preview capture failed:', error);
                      addToast({
                        type: 'error',
                        title: 'Preview Capture Failed',
                        message: 'Failed to capture campaign preview. Please try again.'
                      });
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-sm"
                  title="Manually capture and update the campaign preview image"
                >
                  📸 Capture Preview
                </button>

                {/* Check Preview Status Button */}
                <button
                  onClick={async () => {
                    console.log('🔍 Checking preview status...');
                    try {
                      const response = await fetch(`/api/campaigns/${campaignId}/preview-status`);
                      const result = await response.json();
                      console.log('📊 Preview status:', result);

                      if (result.exists) {
                        addToast({
                          type: 'info',
                          title: 'Preview Status',
                          message: `Preview exists (${result.fileSize} bytes, last modified: ${new Date(result.lastModified).toLocaleTimeString()})`
                        });
                      } else {
                        addToast({
                          type: 'warning',
                          title: 'Preview Status',
                          message: 'No preview found for this campaign'
                        });
                      }
                    } catch (error) {
                      console.error('❌ Failed to check preview status:', error);
                      addToast({
                        type: 'error',
                        title: 'Status Check Failed',
                        message: 'Could not check preview status'
                      });
                    }
                  }}
                  className="px-3 py-1 rounded text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200"
                >
                  Check Status
                </button>

                {/* Generate Demo Button */}
                <button
                  onClick={handleGeneratePass}
                  disabled={isGenerating}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                    isGenerating
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200'
                      : 'bg-white text-blue-600 hover:bg-blue-50 border-blue-200 shadow-sm'
                  }`}
                >
                  {isGenerating ? 'Generating…' : 'Generate Demo'}
                </button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-gray-500 text-center max-w-md">
                Use the demo generator to test your pass design. Save and continue options are available in the header.
              </p>
            </div>

            {/* Desktop Save Status Indicator */}
            <div className="hidden lg:block fixed bottom-4 right-4 z-50">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Auto-save Status</span>
                  <div className="flex items-center space-x-1">
                    {isOnline ? (
                      <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  {saveStatus.saving && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Save className="w-4 h-4 animate-pulse" />
                      <span className="text-sm">Saving changes...</span>
                    </div>
                  )}
                  
                  {saveStatus.saved && !saveStatus.saving && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <Check className="w-4 h-4" />
                      <span className="text-sm">All changes saved</span>
                    </div>
                  )}
                  
                  {saveStatus.error && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <WifiOff className="w-4 h-4" />
                      <span className="text-sm">Save failed - cached locally</span>
                    </div>
                  )}
                  
                  {!saveStatus.saving && !saveStatus.saved && !saveStatus.error && (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                      <span className="text-sm">Ready</span>
                    </div>
                  )}
                </div>
                
                {/* Auto-save Stats */}
                <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Pending:</span>
                    <span>{autoSaveStats.pendingSaves}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cached:</span>
                    <span>{autoSaveStats.cachedItems}</span>
                  </div>
                  {autoSaveStats.pendingSync > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>Sync pending:</span>
                      <span>{autoSaveStats.pendingSync}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}

export default App;