import React, { useState, useCallback } from 'react';
import PassPreview from './components/PassPreview';
import DesignEditor from './components/DesignEditor';
import { PassDesign, CardType } from './types';
import './App.css';
import { CanvasPreviewCapture } from './services/previewCapture';
import { RotateCcw, Undo2, Redo2, CreditCard, Star, Target } from 'lucide-react';

function App() {
  const defaultExp = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  })();
  
  const getDefaultDesign = (cardType: CardType = 'redemption'): PassDesign => ({
    cardType,
    backgroundColor: '#8B4513',
    foregroundColor: '#FFFFFF',
    labelColor: '#FFFFFF',
    stripBackgroundColor: '#F5F5F5',
    logoText: '',
    logoImage: null,
    logoFormat: 'square',
    hideLogoText: false,
    secondaryFields: cardType === 'redemption' ? [
      { label: 'Card Holder', value: 'John Doe' },
      { label: 'Redeemed', value: '4 out of 10' }
    ] : cardType === 'points' ? [
      { label: 'Card Holder', value: 'John Doe' },
      { label: 'Next Reward', value: 'at 2,000 points' }
    ] : cardType === 'milestone' ? [
      { label: 'Card Holder', value: 'John Doe' },
      { label: 'Next Reward', value: 'Free coffee at 5 stamps' } // Will be calculated dynamically
    ] : [
      { label: 'Card Holder', value: 'John Doe' },
      { label: 'Redeemed', value: '4 out of 10' }
    ],
    auxiliaryField: {
      label: 'Next Reward',
      value: cardType === 'points' ? 'Next Reward at 2,000 points' : cardType === 'milestone' ? '' : 'Free coffee at 10 stamps'
    },
    // Redemption Card Fields
    stampsEarned: 4,
    totalStamps: 10,
    // Milestone Card Fields
    numberOfMilestones: 2,
    milestonePositions: [5, 10],
    // Points Card Fields
    pointsBalance: 1250,
    pointsEarned: 1250,
    pointsRequired: 2000,
    pointsPerTransaction: 50,
    nextRewardPoints: 2000,
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
    qrAltText: 'Loyalty Card QR Code',
    expirationDate: defaultExp,
    hasExpiryDate: false,
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
  });

  const [passDesign, setPassDesign] = useState<PassDesign>(getDefaultDesign());
  const [designHistory, setDesignHistory] = useState<PassDesign[]>([getDefaultDesign()]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showEditor, setShowEditor] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset to default? This will clear all your changes and cannot be undone.')) {
      const defaultDesign = getDefaultDesign();
      setPassDesign(defaultDesign);
      setDesignHistory([defaultDesign]);
      setHistoryIndex(0);
    }
  };

  const handleDesignChange = (newDesign: PassDesign) => {
    addToHistory(newDesign);
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
        alert('Could not find the live preview strip to capture.');
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
        qrAltText: passDesign.qrAltText || 'Loyalty Card QR Code',
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
      const res = await fetch('/api/passes/generate-working', {
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
    } catch (e: any) {
      console.error('Generate pass failed', e);
      alert(e?.message || 'Failed to generate pass');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">📱</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Apple Wallet Pass Designer
                </h1>
                <p className="text-sm text-gray-500">Create custom loyalty passes</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* History Controls */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-2 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Undo (Cmd+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= designHistory.length - 1}
                  className="p-2 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Redo (Cmd+Shift+Z)"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <button
                  onClick={handleReset}
                  className="p-2 rounded-md hover:bg-white text-red-600 hover:text-red-700 transition-all"
                  title="Reset to Default"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-6 bg-gray-300"></div>

              <button
                onClick={() => setShowEditor(!showEditor)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  showEditor 
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                }`}
              >
                {showEditor ? 'Hide Editor' : 'Show Editor'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Design Editor Sidebar */}
        {showEditor && (
          <div className="w-96 bg-white border-r border-gray-200 shadow-sm">
            <DesignEditor 
              design={passDesign} 
              onDesignChange={handleDesignChange}
            />
          </div>
        )}

        {/* Pass Preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Live Preview</h2>
            <p className="text-gray-600">Your Apple Wallet pass updates in real-time</p>
          </div>
          
          {/* Card Type Selector */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
              <div className="flex space-x-1">
                <button
                  onClick={() => handleCardTypeChange('redemption')}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    passDesign.cardType === 'redemption'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Redemption Card</span>
                </button>
                <button
                  onClick={() => handleCardTypeChange('points')}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    passDesign.cardType === 'points'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span>Points Card</span>
                </button>
                <button
                  onClick={() => handleCardTypeChange('milestone')}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    passDesign.cardType === 'milestone'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  <span>Milestone Card</span>
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Switch between card types to access different editor controls
            </p>
            <div className="mt-2 text-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                {passDesign.cardType === 'redemption' ? 'Redemption Card' : passDesign.cardType === 'points' ? 'Points Card' : 'Milestone Card'}
              </div>
            </div>
          </div>
          <div className="transform hover:scale-105 transition-transform duration-300">
            <PassPreview design={passDesign} />
          </div>
          <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live Preview Active</span>
            </div>
            {designHistory.length > 1 && (
              <div className="inline-flex items-center space-x-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                <span className="text-xs text-gray-500">History:</span>
                <span className="text-xs font-medium text-gray-700">
                  {historyIndex + 1} / {designHistory.length}
                </span>
              </div>
            )}
            <button
              onClick={handleGeneratePass}
              disabled={isGenerating}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isGenerating
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              }`}
            >
              {isGenerating ? 'Generating…' : 'Generate Pass'}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;