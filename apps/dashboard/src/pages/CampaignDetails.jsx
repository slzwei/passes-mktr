import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import autoSaveService from '@/services/autoSaveService';
import {
  ArrowLeft,
  Calendar,
  Target,
  Clock,
  MapPin,
  Mail,
  Phone,
  Save,
  ArrowRight,
  Gift,
  FileText,
  ExternalLink,
  Download,
  Globe,
  Building,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import campaignService from '@/services/campaignService';
import TinyPassPreview from '@/components/campaigns/TinyPassPreview.jsx';

const CampaignDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { campaignId } = useParams();
  
  // Get pass design from URL params or location state (legacy)
  const urlParams = new URLSearchParams(location.search);
  let passDesign = null;
  let passType = 'redemption';
  
  if (urlParams.get('design')) {
    try {
      passDesign = JSON.parse(decodeURIComponent(urlParams.get('design')));
      passType = urlParams.get('passType') || 'redemption';
    } catch (error) {
      console.error('Failed to parse design from URL:', error);
    }
  } else if (location.state?.passDesign) {
    passDesign = location.state.passDesign;
    passType = location.state.passType || 'redemption';
  }

  const [formData, setFormData] = useState({
    campaignName: '',
    description: '',
    startDate: '',
    endDate: '',
    goals: '',
    location: '',
    contactEmail: '',
    contactPhone: '',
    contactWebsite: '',
    storeLocatorLink: '',
    rewardBreakdown: '',
    termsAndConditions: '',
    isActive: true
  });

  // Mock tenant data - in real app, this would come from API
  const [tenantData, setTenantData] = useState({
    companyName: 'Coffee Corner',
    email: 'support@coffeecorner.com',
    phone: '+1 (555) 123-4567',
    website: 'https://coffeecorner.com'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [designData, setDesignData] = useState(null);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState(null);

  // Determine preview design (prefer saved campaign design)
  const previewDesign = (campaignId && designData?.design) ? designData.design : passDesign;

  // Load campaign data when campaignId is present
  useEffect(() => {
    if (campaignId) {
      loadCampaignData();
    }
  }, [campaignId]);

  const loadCampaignData = async () => {
    try {
      setIsLoadingCampaign(true);
      
      // Load campaign and design data
      const [campaignData, designData] = await Promise.all([
        campaignService.getCampaign(campaignId),
        campaignService.getCampaignDesign(campaignId)
      ]);
      
      setCampaign(campaignData);
      setDesignData(designData);
      try {
        const snap = sessionStorage.getItem(`campaign:${campaignId}:snapshot`);
        if (snap) setSnapshotUrl(snap);
      } catch {}
      
      console.log('Debug - Loaded campaign data:', campaignData);
      console.log('Debug - Loaded design data:', designData);
      
      // Pre-populate form with campaign data
      setFormData(prev => ({
        ...prev,
        campaignName: campaignData.name || '',
        description: campaignData.description || '',
        // Load campaign details from saved data
        ...(campaignData.campaignDetails && {
          startDate: campaignData.campaignDetails.startDate || '',
          endDate: campaignData.campaignDetails.endDate || '',
          goals: campaignData.campaignDetails.goals || '',
          location: campaignData.campaignDetails.location || '',
          contactEmail: campaignData.campaignDetails.contactEmail || '',
          contactPhone: campaignData.campaignDetails.contactPhone || '',
          contactWebsite: campaignData.campaignDetails.contactWebsite || '',
          storeLocatorLink: campaignData.campaignDetails.storeLocatorLink || '',
          rewardBreakdown: campaignData.campaignDetails.rewardBreakdown || '',
          termsAndConditions: campaignData.campaignDetails.termsAndConditions || ''
        })
      }));
      
    } catch (error) {
      console.error('Failed to load campaign data:', error);
      // Handle error - maybe show a toast or redirect
    } finally {
      setIsLoadingCampaign(false);
    }
  };

  // Auto-populate tenant data on component mount
  useEffect(() => {
    if (tenantData.email && !formData.contactEmail) {
      setFormData(prev => ({
        ...prev,
        contactEmail: tenantData.email,
        contactPhone: tenantData.phone,
        contactWebsite: tenantData.website
      }));
    }
  }, [tenantData, formData.contactEmail]);

  // Generate terms & conditions template
  const generateTermsTemplate = () => {
    const template = `
REDEMPTION RULES & TERMS

Campaign: ${formData.campaignName || '[Campaign Name]'}
Company: ${tenantData.companyName}

REWARD BREAKDOWN:
${formData.rewardBreakdown || '[Describe what each stamp redeemed can get the user]'}

REDEMPTION RULES:
• Rewards must be redeemed within 30 days of earning
• One reward per redemption
• Rewards cannot be combined with other offers
• Valid only at participating locations
• Management reserves the right to modify or cancel this program at any time

EXCLUSIONS:
• Not valid on sale items
• Cannot be transferred to other customers
• No cash value
• Not valid for online purchases (unless otherwise specified)

CONTACT INFORMATION:
Email: ${formData.contactEmail || tenantData.email}
Phone: ${formData.contactPhone || tenantData.phone}
Website: ${formData.contactWebsite || tenantData.website}
${formData.storeLocatorLink ? `Store Locator: ${formData.storeLocatorLink}` : ''}

By participating in this program, customers agree to these terms and conditions.
    `.trim();
    
    setFormData(prev => {
      const newFormData = {
        ...prev,
        termsAndConditions: template
      };
      
      // Auto-save when template is loaded
      if (campaignId) {
        autoSaveService.autoSaveDetails(campaignId, newFormData, {
          delay: 1000, // Shorter delay for template loading
          onSave: (result) => {
            console.log('Template auto-saved:', result);
          },
          onError: (error) => {
            console.error('Template auto-save failed:', error);
          }
        });
      }
      
      return newFormData;
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [field]: value
      };
      
      // Auto-save campaign details when form data changes
      if (campaignId) {
        autoSaveService.autoSaveDetails(campaignId, newFormData, {
          delay: 2000, // 2 second delay
          onSave: (result) => {
            console.log('Campaign details auto-saved:', result);
          },
          onError: (error) => {
            console.error('Campaign details auto-save failed:', error);
            // Could show a toast notification here
          }
        });
      }
      
      return newFormData;
    });
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      if (campaignId) {
        // New campaign workflow - update the existing campaign
        const response = await fetch(`/api/campaigns/${campaignId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.campaignName,
            description: formData.description,
            campaignDetails: {
              startDate: formData.startDate,
              endDate: formData.endDate,
              goals: formData.goals,
              location: formData.location,
              contactEmail: formData.contactEmail,
              contactPhone: formData.contactPhone,
              contactWebsite: formData.contactWebsite,
              storeLocatorLink: formData.storeLocatorLink,
              rewardBreakdown: formData.rewardBreakdown,
              termsAndConditions: formData.termsAndConditions
            }
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to save campaign');
        }

        console.log('Campaign draft saved:', { campaignId, formData });
        alert('Campaign draft saved successfully!');
      } else {
        // Legacy behavior for non-campaign workflow
        console.log('Draft saved (legacy):', { passDesign, passType, formData });
        alert('Draft saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextStep = async () => {
    // Navigate to landing page editor
    if (campaignId) {
      navigate(`/campaigns/${campaignId}/landing`);
    } else {
      // Fallback for legacy workflow
      navigate('/campaigndetails');
    }
  };

  const handleGenerateDemoPass = async () => {
    console.log('Generate demo pass clicked!', { isFormValid, formData });
    console.log('Debug - Campaign ID:', campaignId);
    console.log('Debug - Design Data:', designData);
    console.log('Debug - Pass Design fallback:', passDesign);
    
    const finalPassDesign = campaignId && designData ? designData.design : passDesign;
    console.log('Debug - Final pass design being sent:', finalPassDesign);
    
    setIsGeneratingDemo(true);
    try {
      // Build payload to match Step 1 working generator
      const stripImage = (() => {
        try { return sessionStorage.getItem(`campaign:${campaignId}:stripImage`) || undefined; } catch { return undefined; }
      })();
      const colors = finalPassDesign?.colors || {};
      // Mirror Step 1 mapping from PassDesign
      const mappedColors = {
        foreground: finalPassDesign?.foregroundColor || '#FFFFFF',
        background: finalPassDesign?.backgroundColor || '#8B4513',
        label: finalPassDesign?.labelColor || (finalPassDesign?.foregroundColor || '#FFFFFF'),
        stripBackground: finalPassDesign?.stripBackgroundColor
      };
      const ensureFieldConfig = (() => {
        const fc = finalPassDesign?.fieldConfig;
        if (!fc || !fc.fields) {
          // Don't send empty fieldConfig - let server use default loyalty card config with back fields
          return null;
        }
        return fc;
      })();
      const payload = {
        campaignId: campaignId || '550e8400-e29b-41d4-a716-446655440001',
        campaignName: formData.campaignName || (campaign?.name || ''),
        tenantName: tenantData?.companyName || 'MKTR Platform',
        customerEmail: 'demo@mktr.sg',
        customerName: formData.contactEmail ? formData.contactEmail.split('@')[0] : 'John Doe',
        stampsEarned: finalPassDesign?.stampsEarned || 0,
        stampsRequired: finalPassDesign?.totalStamps || 10,
        expirationDate: formData.endDate || undefined,
        hasExpiryDate: Boolean(formData.endDate),
        removePlaceholderLogo: Boolean(finalPassDesign?.removePlaceholderLogo),
        colors: mappedColors,
        images: {
          ...(finalPassDesign?.logoImage ? { logo: finalPassDesign.logoImage } : {}),
          ...(stripImage ? { stripImage } : {}),
          ...(finalPassDesign?.stripBackgroundImage ? { stripBackground: finalPassDesign.stripBackgroundImage } : {}),
          ...(finalPassDesign?.stripBackgroundOpacity ? { stripBackgroundOpacity: finalPassDesign.stripBackgroundOpacity } : {}),
          ...(finalPassDesign?.stampIconUnredeemed ? { stampIconUnredeemed: finalPassDesign.stampIconUnredeemed } : {}),
          ...(finalPassDesign?.stampIconRedeemed ? { stampIconRedeemed: finalPassDesign.stampIconRedeemed } : {}),
          ...(typeof finalPassDesign?.useSameStampIcon === 'boolean' ? { useSameStampIcon: finalPassDesign.useSameStampIcon } : {})
        },
        suppressStripShine: Boolean(finalPassDesign?.suppressStripShine),
        qrAltText: finalPassDesign?.qrAltText || '',
        milestones: finalPassDesign?.cardType === 'milestone' ? {
          numberOfMilestones: finalPassDesign?.numberOfMilestones || 2,
          milestonePositions: finalPassDesign?.milestonePositions || [5, 10],
          useMilestoneOverlay: true
        } : undefined,
        ...(ensureFieldConfig ? { fieldConfig: ensureFieldConfig } : {}),
        // Add campaign details for back of pass
        campaignDetails: {
          campaignName: formData.campaignName || '',
          startDate: formData.startDate || '',
          endDate: formData.endDate || '',
          location: formData.location || '',
          contactEmail: formData.contactEmail || '',
          contactPhone: formData.contactPhone || '',
          contactWebsite: formData.contactWebsite || '',
          storeLocatorLink: formData.storeLocatorLink || '',
          rewardBreakdown: formData.rewardBreakdown || '',
          termsAndConditions: formData.termsAndConditions || ''
        }
      };

      // Call the same working generator endpoint as Step 1
      const response = await fetch('/api/passes/generate-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the .pkpass file as a blob
      const blob = await response.blob();
      
      // Create download link for .pkpass file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.campaignName || 'demo'}-pass.pkpass`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Demo .pkpass file download initiated');
      alert('Demo pass generated successfully! Check your downloads for the .pkpass file.');
    } catch (error) {
      console.error('Failed to generate demo pass:', error);
      
      // Fallback: Show a more helpful error message
      if (error.message.includes('Failed to fetch')) {
        alert('Unable to connect to the pass generation service. Please ensure the API server is running on port 3000.');
      } else {
        alert(`Failed to generate demo pass: ${error.message}`);
      }
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  const isFormValid = formData.campaignName;
  const isRewardSectionComplete = formData.rewardBreakdown && formData.termsAndConditions;
  const isContactSectionComplete = formData.contactEmail && formData.contactPhone;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaign Details</h1>
            <p className="text-gray-600 mt-1">Configure your campaign settings and launch your digital wallet pass</p>
          </div>
        </motion.div>

        {/* Pass Type Badge */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <Badge variant="outline" className="capitalize">
            {passType} Campaign
          </Badge>
          {passDesign && (
            <Badge variant="secondary">
              Pass Design Complete
            </Badge>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaignName">Campaign Name *</Label>
                    <Input
                      id="campaignName"
                      value={formData.campaignName}
                      onChange={(e) => handleInputChange('campaignName', e.target.value)}
                      placeholder="e.g., Summer Coffee Loyalty"
                      data-lpignore="true"
                      autoComplete="off"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your campaign goals and what customers can expect..."
                    rows={3}
                    data-lpignore="true"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goals">Campaign Goals</Label>
                  <Textarea
                    id="goals"
                    value={formData.goals}
                    onChange={(e) => handleInputChange('goals', e.target.value)}
                    placeholder="What do you want to achieve with this campaign?"
                    rows={2}
                    data-lpignore="true"
                    autoComplete="off"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Timeline & Budget */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      data-lpignore="true"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      data-lpignore="true"
                      autoComplete="off"
                    />
                  </div>
                </div>
                
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Information
                  {isContactSectionComplete && <CheckCircle className="h-4 w-4 text-green-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                        placeholder="contact@company.com"
                        className="pl-10"
                        data-lpignore="true"
                        autoComplete="off"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Auto-populated from your account</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="contactPhone"
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="pl-10"
                        data-lpignore="true"
                        autoComplete="off"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Auto-populated from your account</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactWebsite">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="contactWebsite"
                      type="url"
                      value={formData.contactWebsite}
                      onChange={(e) => handleInputChange('contactWebsite', e.target.value)}
                      placeholder="https://yourcompany.com"
                      className="pl-10"
                      data-lpignore="true"
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeLocatorLink">Store Locator Link (Optional)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="storeLocatorLink"
                      type="url"
                      value={formData.storeLocatorLink}
                      onChange={(e) => handleInputChange('storeLocatorLink', e.target.value)}
                      placeholder="https://maps.google.com/..."
                      className="pl-10"
                      data-lpignore="true"
                      autoComplete="off"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Add a Google Maps link to help customers find your store</p>
                </div>
              </CardContent>
            </Card>

            {/* Reward Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Reward Breakdown
                  {formData.rewardBreakdown && <CheckCircle className="h-4 w-4 text-green-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rewardBreakdown">What can users redeem with each stamp? *</Label>
                  <Textarea
                    id="rewardBreakdown"
                    value={formData.rewardBreakdown}
                    onChange={(e) => handleInputChange('rewardBreakdown', e.target.value)}
                    placeholder="e.g., 1 stamp = 10% off next purchase, 3 stamps = free coffee, 5 stamps = free pastry..."
                    rows={4}
                    data-lpignore="true"
                    autoComplete="off"
                  />
                  <p className="text-xs text-gray-500">Describe what each stamp redeemed can get the user</p>
                </div>
              </CardContent>
            </Card>

            {/* Terms & Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Terms & Conditions
                  {formData.termsAndConditions && <CheckCircle className="h-4 w-4 text-green-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">This will appear on the back of the generated pass</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateTermsTemplate}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Template
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="termsAndConditions">Full Terms & Conditions *</Label>
                  <Textarea
                    id="termsAndConditions"
                    value={formData.termsAndConditions}
                    onChange={(e) => handleInputChange('termsAndConditions', e.target.value)}
                    placeholder="Enter terms and conditions for this campaign..."
                    rows={12}
                    data-lpignore="true"
                    autoComplete="off"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">Include redemption rules, exclusions, and contact information</p>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pass Design Preview */}
            {(previewDesign) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pass Design Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 rounded-lg p-4 flex flex-col items-center justify-center">
                    {snapshotUrl ? (
                      <img src={snapshotUrl} alt="Pass snapshot" className="rounded-xl shadow w-[180px] h-auto" />
                    ) : (
                      <TinyPassPreview design={previewDesign} />
                    )}
                    <p className="text-sm font-medium mt-3">{campaign?.name || 'Campaign'}</p>
                    <p className="text-xs text-gray-500">{(campaignId && designData?.type) ? designData.type : (passType || 'redemption')} pass</p>
                    <p className="text-xs text-gray-400 mt-1">Design from previous step</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={() => navigate(`/campaigns/${campaignId}/design`)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Edit Design
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Campaign Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Campaign Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Draft</Badge>
                  <span className="text-sm text-gray-600">Ready to publish</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Pass Design Complete</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${isFormValid ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Basic Information {isFormValid ? 'Complete' : 'Incomplete'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${isRewardSectionComplete ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Rewards & Terms {isRewardSectionComplete ? 'Complete' : 'Incomplete'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${isContactSectionComplete ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Contact Info {isContactSectionComplete ? 'Complete' : 'Incomplete'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>
                
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleGenerateDemoPass}
                  disabled={isGeneratingDemo || !isFormValid}
                  title={!isFormValid ? 'Please fill in basic information first' : 'Generate a demo pass for testing'}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isGeneratingDemo ? 'Generating...' : 'Generate Demo Pass'}
                </Button>
                {!isFormValid && (
                  <p className="text-xs text-gray-500 text-center">
                    Fill in campaign name to enable
                  </p>
                )}
                
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={handleNextStep}
                  disabled={!isFormValid || !isRewardSectionComplete || !isContactSectionComplete}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Next Step
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate(-1)}
                >
                  Back to Editor
                </Button>
              </CardContent>
            </Card>

            {/* Debug Info - Remove in production */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-800">Debug Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-yellow-700">
                <div>Form Valid: {isFormValid ? '✅' : '❌'}</div>
                <div>Campaign Name: {formData.campaignName ? '✅' : '❌'}</div>
                <div>Description: {formData.description ? '✅' : '⚪'} (Optional)</div>
                <div>Start Date: {formData.startDate ? '✅' : '⚪'} (Optional)</div>
                <div>End Date: {formData.endDate ? '✅' : '⚪'} (Optional)</div>
                <div>Reward Section: {isRewardSectionComplete ? '✅' : '❌'}</div>
                <div>Contact Section: {isContactSectionComplete ? '✅' : '❌'}</div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <Gift className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Be specific about what users can redeem with each stamp</span>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Use the template generator for professional terms & conditions</span>
                </div>
                <div className="flex items-start gap-2">
                  <Building className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Contact info is auto-populated from your account</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Add a Google Maps link to help customers find your store</span>
                </div>
                <div className="flex items-start gap-2">
                  <Download className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Generate a demo pass to test before publishing</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;
