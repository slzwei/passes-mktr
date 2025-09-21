import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Partners as PartnersAPI } from "@/api/entities";
import PartnerForm from "@/components/PartnerForm";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar
} from "lucide-react";

export default function Partners() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setIsLoading(true);
      const response = await PartnersAPI.getAll({ 
        tenantId: 'tenant-1',
        search: searchTerm 
      });
      setPartners(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to load partners",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPartners();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleCreatePartner = async (partnerData) => {
    await PartnersAPI.create(partnerData);
    await loadPartners();
  };

  const handleUpdatePartner = async (partnerData) => {
    await PartnersAPI.update(editingPartner.id, partnerData);
    await loadPartners();
  };

  const handleDeletePartner = async (id) => {
    if (!window.confirm('Are you sure you want to delete this partner? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(id);
      await PartnersAPI.delete(id);
      await loadPartners();
      
      toast({
        title: "Success",
        description: "Partner deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete partner",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditPartner = (partner) => {
    setEditingPartner(partner);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingPartner(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAddress = (address) => {
    if (!address) return 'No address';
    
    const parts = [
      address.street,
      address.city,
      address.postalCode,
      address.country
    ].filter(Boolean);
    
    return parts.join(', ') || 'No address';
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-end">
        <Button 
          className="bg-purple-600 hover:bg-purple-700 shadow-sm"
          onClick={() => setIsFormOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Partner
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b border-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Partner Directory
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search partners..." 
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-48 bg-gray-200 rounded"></div>
                      <div className="h-3 w-32 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-8 w-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No partners found' : 'No partners yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Get started by adding your first business partner'
                }
              </p>
              {!searchTerm && (
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => setIsFormOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Partner
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {partners.map((partner) => (
                <div key={partner.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-lg">{partner.name}</h3>
                        <Badge variant={partner.isActive ? "default" : "secondary"}>
                          {partner.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        {partner.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{partner.email}</span>
                          </div>
                        )}
                        {partner.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{partner.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{formatAddress(partner.address)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Created {formatDate(partner.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Updated {formatDate(partner.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/Partners/${partner.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPartner(partner)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePartner(partner.id)}
                        disabled={deletingId === partner.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deletingId === partner.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partner Form Modal */}
      <PartnerForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSave={editingPartner ? handleUpdatePartner : handleCreatePartner}
        partner={editingPartner}
        mode={editingPartner ? 'edit' : 'create'}
      />
    </div>
  );
}