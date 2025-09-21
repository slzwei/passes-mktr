import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToastContext } from '@/components/ui/ToastProvider';
import { Partners } from '@/api/entities';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Users, 
  TrendingUp,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';

const PartnerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const [partner, setPartner] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadPartnerData();
  }, [id]);

  const loadPartnerData = async () => {
    try {
      setIsLoading(true);
      const [partnerResponse, statsResponse] = await Promise.all([
        Partners.getById(id),
        Partners.getStatistics(id)
      ]);
      
      setPartner(partnerResponse.data);
      setStatistics(statsResponse.data);
    } catch (err) {
      error("Error", err.message || "Failed to load partner details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this partner? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await Partners.delete(id);
      
      success("Success", "Partner deleted successfully");
      
      navigate('/Partners');
    } catch (err) {
      error("Error", err.message || "Failed to delete partner");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAddress = (address) => {
    if (!address) return 'No address provided';
    
    const parts = [
      address.street,
      address.city,
      address.postalCode,
      address.country
    ].filter(Boolean);
    
    return parts.join(', ') || 'No address provided';
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/Partners')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/Partners')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Partner Not Found</h1>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">The requested partner could not be found.</p>
            <Button 
              onClick={() => navigate('/Partners')}
              className="mt-4"
            >
              Back to Partners
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/Partners')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{partner.name}</h1>
            <p className="text-gray-500">Partner Details</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/Partners/${id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Partner Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Partner Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                  <p className="text-sm">
                    {partner.email || 'No email provided'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="h-4 w-4" />
                    Phone
                  </div>
                  <p className="text-sm">
                    {partner.phone || 'No phone provided'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  Address
                </div>
                <p className="text-sm">
                  {formatAddress(partner.address)}
                </p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    Created
                  </div>
                  <p className="text-sm">
                    {formatDate(partner.createdAt)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    Last Updated
                  </div>
                  <p className="text-sm">
                    {formatDate(partner.updatedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Campaigns ({statistics?.campaigns?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statistics?.campaigns?.length > 0 ? (
                <div className="space-y-4">
                  {statistics.campaigns.map((campaign) => (
                    <div key={campaign.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{campaign.name}</h3>
                          <p className="text-sm text-gray-500">{campaign.description}</p>
                        </div>
                        <Badge variant={campaign.isActive ? "default" : "secondary"}>
                          {campaign.type}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {campaign.statistics?.totalPasses || 0}
                          </div>
                          <div className="text-gray-500">Total Passes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {campaign.statistics?.activePasses || 0}
                          </div>
                          <div className="text-gray-500">Active</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {campaign.statistics?.redeemedPasses || 0}
                          </div>
                          <div className="text-gray-500">Redeemed</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No campaigns associated with this partner</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {statistics?.totals?.totalPasses || 0}
                </div>
                <div className="text-sm text-gray-500">Total Passes</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">
                    {statistics?.totals?.activePasses || 0}
                  </div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">
                    {statistics?.totals?.redeemedPasses || 0}
                  </div>
                  <div className="text-xs text-gray-500">Redeemed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partner Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={partner.isActive ? "default" : "secondary"}>
                  {partner.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PartnerDetails;
