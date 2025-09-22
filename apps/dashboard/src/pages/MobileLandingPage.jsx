import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  Loader2,
  Phone,
  User,
  Mail,
  Apple,
  Sparkles,
  Send
} from 'lucide-react';
import campaignService from '@/services/campaignService';

const MobileLandingPage = () => {
  const { campaignId } = useParams();

  // Form state
  const [formData, setFormData] = useState({
    campaignTitle: '',
    description: '',
    name: '',
    phone: '',
    email: '',
    headerImage: null
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // Field configuration
  const [fieldConfig, setFieldConfig] = useState({
    name: true,
    phone: true,
    email: false
  });

  // Analytics tracking
  const [analyticsData, setAnalyticsData] = useState({
    pageView: false,
    formStart: false,
    formComplete: false,
    otpSent: false,
    otpVerified: false,
    walletButtonClick: false
  });

  // Load campaign data
  useEffect(() => {
    if (campaignId) {
      loadLandingPageData();
      trackPageView();
    }
  }, [campaignId]);

  const loadLandingPageData = async () => {
    try {
      console.log('🔍 Loading landing page data for campaign:', campaignId);
      const campaign = await campaignService.getCampaign(campaignId);
      console.log('📊 Campaign data loaded:', campaign);
      
      if (campaign?.landingPageData) {
        const { campaignTitle, description, name, phone, email, headerImage, fieldConfig: config } = campaign.landingPageData;
        console.log('🖼️ Header image URL:', headerImage);

        setFormData({
          campaignTitle: campaignTitle || '',
          description: description || '',
          name: name || '',
          phone: phone || '',
          email: email || '',
          headerImage: headerImage
        });

        if (config) {
          setFieldConfig(config);
        }
        
        console.log('✅ Landing page data loaded successfully');
      } else {
        console.log('⚠️ No landing page data found in campaign');
      }
    } catch (error) {
      console.error('❌ Failed to load landing page data:', error);
    }
  };

  // Analytics tracking functions
  const trackPageView = async () => {
    if (analyticsData.pageView) return; // Prevent duplicate tracking
    
    try {
      await campaignService.trackAnalytics(campaignId, {
        event: 'page_view',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        url: window.location.href
      });
      
      setAnalyticsData(prev => ({ ...prev, pageView: true }));
      console.log('📊 Page view tracked');
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  };

  const trackFormStart = async () => {
    if (analyticsData.formStart) return;
    
    try {
      await campaignService.trackAnalytics(campaignId, {
        event: 'form_start',
        timestamp: new Date().toISOString(),
        formFields: Object.keys(fieldConfig).filter(key => fieldConfig[key])
      });
      
      setAnalyticsData(prev => ({ ...prev, formStart: true }));
      console.log('📊 Form start tracked');
    } catch (error) {
      console.error('Failed to track form start:', error);
    }
  };

  const trackFormComplete = async () => {
    if (analyticsData.formComplete) return;
    
    try {
      await campaignService.trackAnalytics(campaignId, {
        event: 'form_complete',
        timestamp: new Date().toISOString(),
        formData: {
          name: fieldConfig.name ? formData.name : null,
          phone: fieldConfig.phone ? formData.phone : null,
          email: fieldConfig.email ? formData.email : null
        }
      });
      
      setAnalyticsData(prev => ({ ...prev, formComplete: true }));
      console.log('📊 Form completion tracked');
    } catch (error) {
      console.error('Failed to track form completion:', error);
    }
  };

  const trackOtpSent = async () => {
    if (analyticsData.otpSent) return;
    
    try {
      await campaignService.trackAnalytics(campaignId, {
        event: 'otp_sent',
        timestamp: new Date().toISOString(),
        phone: formData.phone
      });
      
      setAnalyticsData(prev => ({ ...prev, otpSent: true }));
      console.log('📊 OTP sent tracked');
    } catch (error) {
      console.error('Failed to track OTP sent:', error);
    }
  };

  const trackOtpVerified = async () => {
    if (analyticsData.otpVerified) return;
    
    try {
      await campaignService.trackAnalytics(campaignId, {
        event: 'otp_verified',
        timestamp: new Date().toISOString(),
        phone: formData.phone
      });
      
      setAnalyticsData(prev => ({ ...prev, otpVerified: true }));
      console.log('📊 OTP verification tracked');
    } catch (error) {
      console.error('Failed to track OTP verification:', error);
    }
  };

  const trackWalletButtonClick = async () => {
    if (analyticsData.walletButtonClick) return;
    
    try {
      await campaignService.trackAnalytics(campaignId, {
        event: 'wallet_button_click',
        timestamp: new Date().toISOString()
      });
      
      setAnalyticsData(prev => ({ ...prev, walletButtonClick: true }));
      console.log('📊 Wallet button click tracked');
    } catch (error) {
      console.error('Failed to track wallet button click:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Track form start when user begins typing
    if (!analyticsData.formStart && value.trim()) {
      trackFormStart();
    }

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (fieldConfig.name && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (fieldConfig.phone && !formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (fieldConfig.phone && formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (fieldConfig.email && !formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (fieldConfig.email && formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Track OTP sent
      await trackOtpSent();
      
      // Simulate OTP sending (replace with real Twilio integration)
      await new Promise(resolve => setTimeout(resolve, 1000));

      setOtpSent(true);
      console.log('OTP sent to:', formData.phone);
    } catch (error) {
      console.error('Failed to send OTP:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return;

    setIsLoading(true);

    try {
      // Simulate OTP verification (any OTP works in development)
      await new Promise(resolve => setTimeout(resolve, 500));

      if (otp.length >= 4) {
        // Track OTP verification and form completion
        await trackOtpVerified();
        await trackFormComplete();
        
        await handleSubmit();
      }
    } catch (error) {
      console.error('Failed to verify OTP:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Save form submission data (in a real app, this would save to database)
      console.log('Form submitted with data:', formData);

      // Show success state
      setShowSuccess(true);

      // Show success for 3 seconds, then show Apple Wallet button
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to submit form:', error);
    }
  };

  const handleAddToWallet = async () => {
    // Track wallet button click
    await trackWalletButtonClick();
    
    // Simulate Apple Wallet integration
    console.log('Adding pass to Apple Wallet...');
    alert('Apple Wallet integration would be implemented here with the generated .pkpass file');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Full-screen mobile-optimized content */}
      <div className="w-full min-h-screen max-w-md mx-auto">
        <div className="w-full overflow-hidden">
          {/* Header Image */}
          {formData.headerImage && (
            <div className="w-full h-48 overflow-hidden">
              <img
                src={formData.headerImage}
                alt="Header"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {formData.campaignTitle || 'Campaign Title'}
              </h1>
              <p className="text-gray-600 text-base leading-relaxed">
                {formData.description || 'Campaign description will appear here...'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!showSuccess ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3">
                  {/* Dynamic Form Fields - Mobile optimized */}
                  {fieldConfig.name && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Enter your name"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                      {errors.name && (
                        <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                      )}
                    </div>
                  )}

                  {fieldConfig.phone && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+65 1234 5678"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                      )}
                    </div>
                  )}

                  {fieldConfig.email && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="Enter your email"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                      )}
                    </div>
                  )}

                  {!otpSent ? (
                    <button
                      onClick={handleSendOtp}
                      disabled={isLoading || Object.values(fieldConfig).every(enabled => !enabled)}
                      className={`w-full py-4 bg-blue-600 rounded-lg text-white font-semibold text-base cursor-pointer hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isLoading || Object.values(fieldConfig).every(enabled => !enabled) 
                          ? 'opacity-50 cursor-not-allowed' 
                          : ''
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin inline" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-2 inline" />
                          Send OTP
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Enter OTP</Label>
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="1234"
                          maxLength={6}
                          className="w-full py-3 px-4 border border-gray-300 rounded-lg text-center text-xl font-mono tracking-widest focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <button
                        onClick={handleVerifyOtp}
                        disabled={isLoading || otp.length < 4}
                        className={`w-full py-4 bg-green-600 rounded-lg text-white font-semibold text-base cursor-pointer hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          isLoading || otp.length < 4 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin inline" />
                            Verifying...
                          </>
                        ) : (
                          'Verify & Submit'
                        )}
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-8 py-12"
                >
                  <div className="relative">
                    <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="h-16 w-16 text-green-600" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Thank You!</h2>
                    <p className="text-gray-600 text-lg">Your interest has been registered successfully.</p>
                  </div>

                  <button
                    onClick={handleAddToWallet}
                    className="w-full bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-lg shadow-lg cursor-pointer transition-colors flex items-center justify-center font-semibold text-lg"
                  >
                    <Apple className="h-6 w-6 mr-3" />
                    Add to Apple Wallet
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileLandingPage;