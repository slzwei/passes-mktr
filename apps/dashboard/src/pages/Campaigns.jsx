import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Megaphone,
  Plus,
  Settings,
  Trash2,
  Eye,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  Search,
  Filter,
  MoreHorizontal,
  Edit3,
  X,
  Grid3X3,
  List,
  Trash,
  CheckSquare,
  Square
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import campaignsService from "@/services/campaignsService";
import campaignService from "@/services/campaignService";
import campaignMetricsService from "@/services/campaignMetricsService";


const StatsCard = ({ title, value, change, icon: Icon, color }) => (
  <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <div className="flex items-center mt-2 text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              {change}
            </div>
          )}
        </div>
        <div className={`p-3 ${color} bg-opacity-10 rounded-lg`}>
          <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Helper function to get the appropriate pass component
const getPassComponent = (campaign) => {
  const passData = campaign.passData || {};
  
  switch (campaign.passType) {
    case 'redemption':
      return <RedemptionPass passData={{
        stamps: passData.stamps || passData.stampsEarned || 4,
        totalStamps: passData.totalStamps || 10,
        color: passData.color || '#8B5CF6',
        logoIcon: passData.logoIcon || '🎁',
        logoTitle: passData.logoTitle || 'REDEMPTION',
        cardHolder: passData.cardHolder || 'John Doe'
      }} />;
    case 'milestone':
      return <MilestonePass passData={{
        stamps: passData.stamps || passData.stampsEarned || 4,
        totalStamps: passData.totalStamps || 10,
        color: passData.color || '#3B82F6',
        logoIcon: passData.logoIcon || '⚡',
        logoTitle: passData.logoTitle || 'MILESTONE',
        cardHolder: passData.cardHolder || 'John Doe',
        nextReward: passData.nextReward || 'Free coffee at 5 stamps'
      }} />;
    case 'points':
      return <PointsPass passData={{
        points: passData.points || passData.pointsBalance || 1250,
        color: passData.color || '#F97316',
        logoIcon: passData.logoIcon || '⭐',
        logoTitle: passData.logoTitle || 'POINTS',
        cardHolder: passData.cardHolder || 'John Doe',
        nextRewardAt: passData.nextRewardAt || 2000
      }} />;
    default:
      return <RedemptionPass passData={{
        stamps: 4,
        totalStamps: 10,
        color: '#8B5CF6',
        logoIcon: '🎁',
        logoTitle: 'REDEMPTION',
        cardHolder: 'John Doe'
      }} />;
  }
};

const CampaignCard = ({ campaign, onManage, onDelete, deletingCampaign, isSelected, onToggleSelect, showCheckbox = false }) => {


  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="group w-full max-w-[400px] flex-shrink-0"
  >
    <Card className={`shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showCheckbox && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(campaign.id);
                }}
                className="h-6 w-6 p-0"
              >
                {isSelected ? (
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                ) : (
                  <Square className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            )}
            <Badge
              variant={(() => {
                const status = campaign.status || (campaign.isActive ? 'active' : 'draft');
                return status === 'active' ? 'default' : status === 'draft' ? 'secondary' : 'outline';
              })()}
              className={
                (() => {
                  const status = campaign.status || (campaign.isActive ? 'active' : 'draft');
                  return status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                         status === 'draft' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                         'bg-gray-100 text-gray-800 border-gray-200';
                })()
              }
            >
              {campaign.status || (campaign.isActive ? 'active' : 'draft')}
            </Badge>
            <h3 className="font-semibold text-lg">{campaign.name}</h3>
          </div>
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onDelete(campaign)}
              disabled={deletingCampaign === campaign.id}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
              title="Delete campaign"
            >
              {deletingCampaign === campaign.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onManage(campaign)}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0 flex-1 flex flex-col">
        <div className="flex justify-center items-center bg-slate-100 rounded-lg p-4 overflow-hidden h-[335px]">
          {campaign.previewUrl ? (
            <>
              <img
                src={`${campaign.previewUrl}?t=${campaign.lastModified || campaign.updatedAt || Date.now()}&v=${Date.now()}`}
                onLoad={(e) => {
                  console.log(`✅ Image loaded successfully for ${campaign.id}:`, e.currentTarget.src);
                }}
                alt={`Preview of ${campaign.name}`}
                className="max-w-full max-h-full object-contain"
                style={{
                  transform: 'scale(0.6)',
                  minHeight: '50px',
                  maxHeight: '300px',
                  width: 'auto'
                }}
                onLoadStart={(e) => {
                  console.log(`🔄 Starting to load image for ${campaign.id}: ${e.currentTarget.src}`);
                }}
                onError={(e) => {
                  console.warn(`❌ Failed to load preview image for ${campaign.id}:`, e.currentTarget.src);
                  console.warn(`Campaign previewUrl: ${campaign.previewUrl}`);
                  console.warn(`Image exists in storage:`, campaign.previewUrl ? 'Yes' : 'No');
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback && fallback instanceof HTMLElement) {
                    fallback.style.display = 'block';
                  }
                }}
              />
            </>
          ) : null}
          <div className="text-center" style={{ display: campaign.previewUrl ? 'none' : 'block' }}>
            <div className="text-6xl mb-4">🎨</div>
            <p className="text-gray-600 font-medium">{campaign.name}</p>
            <p className="text-sm text-gray-500 mt-2">{campaign.description}</p>
          </div>
        </div>
        
        <div className="flex gap-2 pt-4 mt-auto">
          <Button
            variant={campaign.status === 'draft' ? 'default' : 'outline'}
            size="sm"
            className={`flex-1 ${
              campaign.status === 'draft'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Eye className="h-4 w-4 mr-2" />
            {campaign.status === 'draft' ? 'Publish' : 'View'}
          </Button>
          <Link
            to={campaign.id.startsWith('campaign-') ? `/campaigns/${campaign.id}/design` : `/editor/${campaign.passType || 'redemption'}`}
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full text-gray-600 hover:text-gray-800">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  </motion.div>
  );
};

const CampaignListItem = ({ campaign, onManage, onDelete, deletingCampaign, isSelected, onToggleSelect }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className={`border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'}`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(campaign.id);
          }}
          className="h-6 w-6 p-0"
        >
          {isSelected ? (
            <CheckSquare className="h-4 w-4 text-blue-600" />
          ) : (
            <Square className="h-4 w-4 text-gray-400" />
          )}
        </Button>
        
        <div className="flex items-center space-x-3">
          <Badge
            variant={(() => {
              const status = campaign.status || (campaign.isActive ? 'active' : 'draft');
              return status === 'active' ? 'default' : status === 'draft' ? 'secondary' : 'outline';
            })()}
            className={
              (() => {
                const status = campaign.status || (campaign.isActive ? 'active' : 'draft');
                return status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                       status === 'draft' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                       'bg-gray-100 text-gray-800 border-gray-200';
              })()
            }
          >
            {campaign.status || (campaign.isActive ? 'active' : 'draft')}
          </Badge>
          <div>
            <h3 className="font-semibold text-base">{campaign.name}</h3>
            <p className="text-sm text-gray-500">{campaign.description}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="text-right text-sm text-gray-500 mr-4">
          {campaignMetricsService.getMetricsForCampaign(campaign).map((metric, index) => (
            <div key={index}>{metric.value} {metric.label.toLowerCase()}</div>
          ))}
        </div>
        
        <Button 
          variant={campaign.status === 'draft' ? 'default' : 'outline'} 
          size="sm"
          className={
            campaign.status === 'draft' 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'text-gray-600 hover:text-gray-800'
          }
        >
          <Eye className="h-4 w-4 mr-2" />
          {campaign.status === 'draft' ? 'Publish' : 'View'}
        </Button>
        
        <Link to={campaign.id.startsWith('campaign-') ? `/campaigns/${campaign.id}/design` : `/editor/${campaign.passType || 'redemption'}`}>
          <Button variant="outline" size="sm" className="text-gray-600 hover:text-gray-800">
            <Edit3 className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </Link>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onDelete(campaign)}
          disabled={deletingCampaign === campaign.id}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
          title="Delete campaign"
        >
          {deletingCampaign === campaign.id ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  </motion.div>
);

const CreateCampaignCard = ({ onCampaignCreated }) => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsCreating(true);
      
      // Create a new campaign
      const campaignData = {
        name: 'New Campaign',
        description: 'A new digital wallet campaign',
        type: 'redemption'
      };
      
      const newCampaign = await campaignService.createCampaign(campaignData);
      
      // Refresh parent campaigns list
      if (onCampaignCreated) {
        await onCampaignCreated();
      }
      
      // Navigate to the design step
      navigate(`/campaigns/${newCampaign.id}/design`);
      
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('Failed to create campaign. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="h-full w-full max-w-[380px] flex-shrink-0"
    >
      <div onClick={handleCreateCampaign} className="h-full cursor-pointer">
        <Card className="shadow-lg border-2 border-dashed border-gray-300 hover:border-purple-400 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
          <CardContent className="p-8 text-center flex-1 flex flex-col justify-between">
            <div className="flex justify-center items-center h-[335px] bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Plus className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-gray-500 text-xs">New Campaign</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 mt-auto">Create New Campaign</h3>
              <p className="text-sm text-gray-500 mb-4">Design your next digital wallet experience</p>

              <Button 
                className="bg-purple-600 hover:bg-purple-700 w-full"
                disabled={isCreating}
              >
                {isCreating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {isCreating ? 'Creating...' : 'Get Started'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default function Campaigns() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingCampaign, setDeletingCampaign] = useState(null);
  const [isCreatingFirstCampaign, setIsCreatingFirstCampaign] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [selectedCampaigns, setSelectedCampaigns] = useState(new Set());
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  // Load campaigns from service
  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);

      console.log('🔄 Loading campaigns from API...');

      // Load campaigns from API
      const response = await fetch('/api/campaigns?tenantId=tenant-1');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load campaigns');
      }

      // Use only API campaigns - they have the correct previewUrl and updated data
      const allCampaigns = result.data || [];

      console.log('✅ API campaigns loaded successfully:', allCampaigns.length);
      console.log('📊 Campaign IDs:', allCampaigns.map(c => `${c.id} (${c.previewUrl ? 'has' : 'no'} preview)`).join(', '));

      // Log detailed campaign info
      allCampaigns.forEach((campaign, index) => {
        console.log(`Campaign ${index}: ${campaign.id}`);
        console.log(`  - Name: ${campaign.name}`);
        console.log(`  - Preview URL: ${campaign.previewUrl}`);
        console.log(`  - Last Modified: ${campaign.lastModified}`);
        console.log(`  - Generated Image URL: ${campaign.previewUrl}?t=${campaign.lastModified || Date.now()}&v=${Date.now()}`);
      });

      setCampaigns(allCampaigns);
    } catch (error) {
      console.error('❌ Error loading campaigns from API:', error);

      // Fallback to localStorage campaigns
      try {
        const localCampaigns = campaignsService.getAllCampaigns();
        console.warn('⚠️ Using localStorage campaigns as fallback:', localCampaigns.length);
        console.log('📊 LocalStorage campaign IDs:', localCampaigns.map(c => `${c.id} (${c.previewUrl ? 'has' : 'no'} preview)`).join(', '));
        setCampaigns(localCampaigns);
      } catch (fallbackError) {
        console.error('Error loading fallback campaigns:', fallbackError);
        setCampaigns([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh campaigns when returning to this page
  useEffect(() => {
    const handleFocus = () => {
      loadCampaigns();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);


  // Handle campaign deletion
  const handleDeleteCampaign = async (campaign) => {
    if (!window.confirm(`Are you sure you want to delete "${campaign.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingCampaign(campaign.id);
      
      // Check if this is an API campaign (has campaignId format) or localStorage campaign
      if (campaign.id.startsWith('campaign-')) {
        // API campaign - delete via API
        const response = await fetch(`/api/campaigns/${campaign.id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete campaign');
        }
      } else {
        // Legacy localStorage campaign
        if (campaign.isDraft) {
          campaignsService.deleteDraft(campaign.id);
        } else {
          campaignsService.deleteCampaign(campaign.id);
        }
      }
      
      // Refresh the campaigns list
      await loadCampaigns();
      
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Failed to delete campaign. Please try again.');
    } finally {
      setDeletingCampaign(null);
    }
  };

  const handleCreateFirstCampaign = async () => {
    try {
      setIsCreatingFirstCampaign(true);
      
      // Create a new campaign
      const campaignData = {
        name: 'New Campaign',
        description: 'A new digital wallet campaign',
        type: 'redemption'
      };
      
      const newCampaign = await campaignService.createCampaign(campaignData);
      
      // Refresh campaigns list to include the new campaign
      await loadCampaigns();
      
      // Navigate to the design step
      navigate(`/campaigns/${newCampaign.id}/design`);
      
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('Failed to create campaign. Please try again.');
    } finally {
      setIsCreatingFirstCampaign(false);
    }
  };

  // Selection helper functions
  const toggleCampaignSelection = (campaignId) => {
    setSelectedCampaigns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId);
      } else {
        newSet.add(campaignId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    console.log('🎯 Toggle select all clicked:', {
      currentSelected: selectedCampaigns.size,
      totalCampaigns: filteredCampaigns.length,
      campaignIds: filteredCampaigns.map(c => c.id)
    });

    if (selectedCampaigns.size === filteredCampaigns.length) {
      console.log('📭 Deselecting all campaigns');
      setSelectedCampaigns(new Set());
    } else {
      const allIds = new Set(filteredCampaigns.map(c => c.id));
      console.log('✅ Selecting all campaigns:', Array.from(allIds));
      setSelectedCampaigns(allIds);
    }
  };

  const handleBulkDelete = async () => {
    // Get current selected campaigns to avoid closure issues
    const currentSelected = selectedCampaigns;

    console.log('🚀 Starting bulk delete:', {
      selectedCount: currentSelected.size,
      selectedCampaigns: Array.from(currentSelected)
    });

    if (currentSelected.size === 0) return;

    const selectedCount = currentSelected.size;
    if (!window.confirm(`Are you sure you want to delete ${selectedCount} campaign${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeletingSelected(true);

      // Delete all selected campaigns
      const deletePromises = Array.from(currentSelected).map(async (campaignId) => {
        console.log('🗑️ Deleting campaign:', campaignId);

        if (campaignId.startsWith('campaign-')) {
          // API campaign
          const response = await fetch(`http://localhost:3000/api/campaigns/${campaignId}`, {
            method: 'DELETE'
          });
          if (!response.ok) {
            throw new Error(`Failed to delete campaign ${campaignId}`);
          }
        } else {
          // localStorage campaign
          const campaign = campaigns.find(c => c.id === campaignId);
          if (campaign?.isDraft) {
            campaignsService.deleteDraft(campaignId);
          } else {
            campaignsService.deleteCampaign(campaignId);
          }
        }
      });

      await Promise.all(deletePromises);
      console.log('✅ All delete promises completed');

      // Clear selection and refresh
      setSelectedCampaigns(new Set());
      await loadCampaigns();
      console.log('✅ Campaign list refreshed');

    } catch (error) {
      console.error('❌ Error deleting campaigns:', error);
      alert('Failed to delete some campaigns. Please try again.');
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Handle both old status field and new isActive field
    let campaignStatus = campaign.status;
    if (campaignStatus === undefined || campaignStatus === null) {
      campaignStatus = campaign.isActive ? 'active' : 'draft';
    }

    const matchesTab = activeTab === "all" || campaignStatus === activeTab;
    return matchesSearch && matchesTab;
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading campaigns...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
{/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-1">Design, manage and track your digital wallet campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Link to={createPageUrl("CreateCampaign")}>
            <Button className="bg-purple-600 hover:bg-purple-700 shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Campaigns"
          value={campaigns.filter(c => c.status === 'active').length.toString()}
          change="+3 this month"
          icon={Megaphone}
          color="bg-purple-500"
        />
        <StatsCard
          title="Draft Campaigns"
          value={campaigns.filter(c => c.status === 'draft').length.toString()}
          change="Work in progress"
          icon={Edit3}
          color="bg-yellow-500"
        />
        <StatsCard
          title="Total Campaigns"
          value={campaigns.length.toString()}
          change="All campaigns"
          icon={BarChart3}
          color="bg-blue-500"
        />
        <StatsCard
          title="Revenue Generated"
          value="$47.2K"
          change="+24% increase"
          icon={TrendingUp}
          color="bg-green-500"
        />
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-4 sm:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="paused">Paused</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Search campaigns..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* View Toggle */}
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCampaigns.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-900">
              {selectedCampaigns.size} campaign{selectedCampaigns.size > 1 ? 's' : ''} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCampaigns(new Set())}
              className="text-blue-700 hover:text-blue-900"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isDeletingSelected}
          >
            {isDeletingSelected ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Trash className="h-4 w-4 mr-2" />
            )}
            Delete Selected
          </Button>
        </div>
      )}

      {/* Campaigns Grid */}
      {filteredCampaigns.length === 0 && !searchTerm ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Megaphone className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {activeTab === 'all' ? 'No campaigns yet' : `No ${activeTab} campaigns`}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md">
            {activeTab === 'all' 
              ? 'Get started by creating your first digital wallet campaign. Choose from redemption, milestone, or points cards.'
              : `You don't have any ${activeTab} campaigns yet. Create your first campaign to get started.`
            }
          </p>
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={handleCreateFirstCampaign}
            disabled={isCreatingFirstCampaign}
          >
            {isCreatingFirstCampaign ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {isCreatingFirstCampaign ? 'Creating...' : 'Create Your First Campaign'}
          </Button>
        </div>
      ) : (
        <>
          {/* List View Header with Select All */}
          {viewMode === "list" && filteredCampaigns.length > 0 && (
            <div className="bg-gray-50 border rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSelectAll}
                    className="h-6 w-6 p-0"
                  >
                    {selectedCampaigns.size === filteredCampaigns.length && filteredCampaigns.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  <span className="text-sm font-medium text-gray-700">
                    Select All ({filteredCampaigns.length})
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {selectedCampaigns.size} of {filteredCampaigns.length} selected
                </span>
              </div>
            </div>
          )}

          {/* Grid View */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center">
              <CreateCampaignCard onCampaignCreated={loadCampaigns} />
              {filteredCampaigns.map((campaign, index) => (
                <CampaignCard 
                  key={campaign.id} 
                  campaign={campaign}
                  onManage={(campaign) => console.log('Managing:', campaign)}
                  onDelete={handleDeleteCampaign}
                  deletingCampaign={deletingCampaign}
                  isSelected={selectedCampaigns.has(campaign.id)}
                  onToggleSelect={toggleCampaignSelection}
                  showCheckbox={true}
                />
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-3">
              {filteredCampaigns.map((campaign, index) => (
                <CampaignListItem
                  key={campaign.id}
                  campaign={campaign}
                  onManage={(campaign) => console.log('Managing:', campaign)}
                  onDelete={handleDeleteCampaign}
                  deletingCampaign={deletingCampaign}
                  isSelected={selectedCampaigns.has(campaign.id)}
                  onToggleSelect={toggleCampaignSelection}
                />
              ))}
            </div>
          )}
        </>
      )}

      {filteredCampaigns.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
          <p className="text-gray-500">Try adjusting your search or create a new campaign</p>
        </div>
      )}
    </div>
  );
}