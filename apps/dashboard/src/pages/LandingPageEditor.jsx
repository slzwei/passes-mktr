import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  Smartphone,
  User,
  Eye,
  Palette,
  Mail,
  Phone,
  Upload,
  Image as ImageIcon,
  X,
  Loader2
} from 'lucide-react';
import campaignService from '@/services/campaignService';

const LandingPageEditor = () => {
  const navigate = useNavigate();
  const { campaignId } = useParams();

  const [formData, setFormData] = useState({
    campaignTitle: '',
    description: '',
    headerImage: null
  });

  const [fieldConfig, setFieldConfig] = useState({
    name: true,
    phone: true,
    email: false
  });

  const [showMobilePreview, setShowMobilePreview] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (campaignId) {
      loadLandingPageData();
    }
  }, [campaignId]);

  const loadLandingPageData = async () => {
    try {
      const campaign = await campaignService.getCampaign(campaignId);
      if (campaign?.landingPageData) {
        setFormData(prev => ({
          ...prev,
          ...campaign.landingPageData
        }));

        if (campaign.landingPageData.fieldConfig) {
          setFieldConfig(campaign.landingPageData.fieldConfig);
        }
      }
    } catch (error) {
      console.error('Failed to load landing page data:', error);
    }
  };

  const toggleMobilePreview = () => {
    setShowMobilePreview(!showMobilePreview);
  };

  const handleFieldToggle = async (field) => {
    const updatedFieldConfig = {
      ...fieldConfig,
      [field]: !fieldConfig[field]
    };

    setFieldConfig(updatedFieldConfig);

    // Automatically save the field configuration changes
    if (campaignId) {
      try {
        await campaignService.updateCampaign(campaignId, {
          landingPageData: {
            ...formData,
            fieldConfig: updatedFieldConfig
          }
        });
      } catch (error) {
        console.error('Failed to save field configuration:', error);
      }
    }
  };

  const handleSave = async () => {
    try {
      if (campaignId) {
        await campaignService.updateCampaign(campaignId, {
          landingPageData: {
            ...formData,
            fieldConfig: fieldConfig
          }
        });

        alert('Landing page configuration saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save landing page data:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      const imageUrl = await campaignService.uploadImage(file, campaignId, 'landing-header');

      const updatedFormData = {
        ...formData,
        headerImage: imageUrl
      };

      setFormData(updatedFormData);

      // Automatically save the landing page data with the new image
      if (campaignId) {
        await campaignService.updateCampaign(campaignId, {
          landingPageData: {
            ...updatedFormData,
            fieldConfig: fieldConfig
          }
        });
      }

      console.log('Image uploaded and saved successfully:', imageUrl);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    const updatedFormData = {
      ...formData,
      headerImage: null
    };

    setFormData(updatedFormData);

    // Automatically save the landing page data without the image
    if (campaignId) {
      try {
        await campaignService.updateCampaign(campaignId, {
          landingPageData: {
            ...updatedFormData,
            fieldConfig: fieldConfig
          }
        });
      } catch (error) {
        console.error('Failed to save landing page data:', error);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Landing Page Editor</h1>
              <p className="text-gray-600">Design your mobile landing experience</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              Save Configuration
            </Button>
            <Button
              variant="outline"
              onClick={toggleMobilePreview}
              className="flex items-center gap-2"
            >
              {showMobilePreview ? <Eye className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
              {showMobilePreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
          {/* Editor Sidebar */}
          <div className="lg:col-span-1 h-full flex flex-col">
            {/* Image Upload Card */}
            <Card className="shadow-lg flex-shrink-0 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Palette className="h-5 w-5 text-purple-600" />
                  Header Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.headerImage ? (
                  <div className="relative">
                    <img
                      src={formData.headerImage}
                      alt="Header"
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 h-8 w-8 p-0"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-4">
                      Upload a header image for your landing page
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-full"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Field Configuration */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-blue-600" />
                    Field Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Select Fields to Display</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="name-field"
                          checked={fieldConfig.name}
                          onCheckedChange={() => handleFieldToggle('name')}
                        />
                        <Label htmlFor="name-field" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Name
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="phone-field"
                          checked={fieldConfig.phone}
                          onCheckedChange={() => handleFieldToggle('phone')}
                        />
                        <Label htmlFor="phone-field" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone Number
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="email-field"
                          checked={fieldConfig.email}
                          onCheckedChange={() => handleFieldToggle('email')}
                        />
                        <Label htmlFor="email-field" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Mobile Preview */}
          {showMobilePreview && (
            <div className="lg:col-span-2 h-full overflow-y-auto">
              <Card className="shadow-lg flex-shrink-0">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-blue-600" />
                      Mobile Preview
                    </span>
                    {campaignId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/campaigns/${campaignId}/mobile`, '_blank')}
                        className="text-xs"
                        title="Open the actual generated landing page"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview Page
                        <span className="ml-1 text-green-600 text-xs">●</span>
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center p-4">
                  <div className="relative">
                    {/* Phone Frame */}
                    <div className="w-80 h-[600px] bg-black rounded-3xl p-2 shadow-2xl">
                      <div className="w-full h-full bg-white rounded-2xl overflow-hidden relative">
                        {/* Header Image */}
                        {formData.headerImage && (
                          <div className="w-full h-32 overflow-hidden">
                            <img
                              src={formData.headerImage}
                              alt="Header"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Content Preview */}
                        <div className="p-4 space-y-4">
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">
                              {formData.campaignTitle || 'Campaign Title'}
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">
                              {formData.description || 'Campaign description will appear here...'}
                            </p>
                          </div>

                          {/* Preview of enabled fields */}
                          <div className="space-y-3">
                            {fieldConfig.name && (
                              <div>
                                <Label className="text-xs text-gray-500">FULL NAME</Label>
                                <div className="h-10 bg-gray-100 rounded px-3 flex items-center mt-1">
                                  <User className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-gray-500 text-sm">
                                    Enter your name
                                  </span>
                                </div>
                              </div>
                            )}
                            {fieldConfig.phone && (
                              <div>
                                <Label className="text-xs text-gray-500">PHONE NUMBER</Label>
                                <div className="h-10 bg-gray-100 rounded px-3 flex items-center mt-1">
                                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-gray-500 text-sm">
                                    +65 1234 5678
                                  </span>
                                </div>
                              </div>
                            )}
                            {fieldConfig.email && (
                              <div>
                                <Label className="text-xs text-gray-500">EMAIL</Label>
                                <div className="h-10 bg-gray-100 rounded px-3 flex items-center mt-1">
                                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-gray-500 text-sm">
                                    Enter your email
                                  </span>
                                </div>
                              </div>
                            )}
                            <div className="h-10 bg-blue-600 rounded text-white flex items-center justify-center text-sm font-medium">
                              Send OTP
                            </div>
                          </div>

                          {/* Preview Link */}
                          {campaignId && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                              <p className="text-xs text-gray-600 mb-2">Generated Page URL:</p>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-white px-2 py-1 rounded border flex-1">
                                  {window.location.origin}/campaigns/{campaignId}/mobile
                                </code>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/campaigns/${campaignId}/mobile`)}
                                  className="text-xs px-2 py-1 h-7"
                                >
                                  Copy
                                </Button>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                This is a real, shareable page that customers can use to register interest. Changes are automatically saved.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPageEditor;