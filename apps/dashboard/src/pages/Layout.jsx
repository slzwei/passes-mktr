
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Users, 
  CreditCard, 
  Megaphone, 
  BarChart3, 
  ChevronDown,
  User,
  CreditCard as BillingIcon,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Edit3
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
    description: "Monitor performance",
    pageTitle: "Dashboard",
    pageDescription: "Monitor your loyalty program performance"
  },
  {
    title: "Partners",
    url: createPageUrl("Partners"),
    icon: Users,
    description: "Manage business partners",
    pageTitle: "Partners",
    pageDescription: "Manage your business partners and integrations"
  },
  {
    title: "Campaigns",
    url: createPageUrl("Campaigns"),
    icon: Megaphone,
    description: "Marketing campaigns",
    pageTitle: "Campaigns",
    pageDescription: "Create and manage your marketing campaigns"
  },
  {
    title: "Passholders",
    url: createPageUrl("Passholders"),
    icon: CreditCard,
    description: "View customer wallets",
    pageTitle: "Passholders",
    pageDescription: "View and manage customer digital wallets"
  },
  {
    title: "Analytics",
    url: createPageUrl("Analytics"),
    icon: BarChart3,
    description: "Performance insights",
    pageTitle: "Analytics",
    pageDescription: "Insights and performance metrics for your loyalty program"
  },
];

export default function Layout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const tenantEmail = "admin@loyaltyapp.com"; // This would come from auth context
  
  // Get current page info for header
  const getCurrentPageInfo = () => {
    const currentPath = location.pathname;
    
    // Special handling for editor and create campaign pages
    if (currentPath.toLowerCase().includes('createcampaign')) {
      return {
        title: "CreateCampaign",
        icon: Megaphone,
        pageTitle: "Campaigns",
        pageDescription: "Create and manage your marketing campaigns for"
      };
    }
    if (currentPath.toLowerCase().includes('/editor/redemption')) {
      return {
        title: "RedemptionEditor",
        icon: CreditCard,
        pageTitle: "Campaigns",
        pageDescription: "Create and manage your marketing campaigns for"
      };
    }
    if (currentPath.toLowerCase().includes('/editor/milestone')) {
      return {
        title: "MilestoneEditor",
        icon: CreditCard,
        pageTitle: "Campaigns",
        pageDescription: "Create and manage your marketing campaigns for"
      };
    }
    if (currentPath.toLowerCase().includes('/editor/points')) {
      return {
        title: "PointsEditor",
        icon: CreditCard,
        pageTitle: "Campaigns",
        pageDescription: "Create and manage your marketing campaigns for"
      };
    }
    
    // Regular navigation items
    const currentItem = navigationItems.find(item => {
      if (currentPath === '/' || currentPath === '/Dashboard') {
        return item.title === 'Dashboard';
      }
      return currentPath.toLowerCase().includes(item.title.toLowerCase());
    });
    return currentItem || navigationItems[0]; // Default to Dashboard
  };
  
  const currentPageInfo = getCurrentPageInfo();

  const handleLogout = () => {
    // Logout logic here
    console.log("Logging out...");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white shadow-xl transform transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:w-20" : "lg:w-72",
        sidebarOpen ? "translate-x-0 w-72" : "lg:translate-x-0 -translate-x-full w-72"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex-1 flex justify-center w-full">
              <img 
                src="/passes-logo.png" 
                alt="MKTR Passes Logo" 
                className={`object-contain w-full ${sidebarCollapsed ? 'h-16' : 'h-28'}`}
              />
            </div>
            <div className="flex items-center space-x-2">
              {/* Collapse button for desktop */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Menu className="h-4 w-4" />
              </Button>
              {/* Close button for mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation - Takes remaining space */}
          <nav className="flex-1 px-4 pt-1 pb-3 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "group flex items-center text-sm font-medium rounded-xl transition-all duration-200 relative",
                    "hover:bg-purple-50 hover:text-purple-700",
                    sidebarCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3",
                    isActive 
                      ? "bg-purple-100 text-purple-700 shadow-sm" 
                      : "text-gray-600"
                  )}
                  title={sidebarCollapsed ? item.title : undefined}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-colors flex-shrink-0",
                    sidebarCollapsed ? "mr-0" : "mr-4",
                    isActive ? "text-purple-600" : "text-gray-400 group-hover:text-purple-600"
                  )} />
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="truncate">{item.title}</span>
                        {isActive && (
                          <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>
                    </div>
                  )}
                  {sidebarCollapsed && isActive && (
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-purple-600 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Floating Upgrade to Pro Button - Matches sidebar width and visibility */}
      {!sidebarCollapsed && (
        <div className="fixed bottom-6 left-6 transition-all duration-300 ease-in-out" 
             style={{ 
               zIndex: 60,
               width: 'calc(18rem - 3rem)' // 288px - 48px = 240px (matches sidebar content width)
             }}>
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-4 text-white shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">Upgrade to Pro</h3>
                <p className="text-xs opacity-90">Unlock advanced features</p>
              </div>
              <Button 
                size="sm" 
                className="bg-white text-purple-700 hover:bg-gray-50 shadow-none flex-shrink-0"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={cn(
        "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
      )} style={{ width: `calc(100vw - ${sidebarCollapsed ? '5rem' : '18rem'})` }}>
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${
                  currentPageInfo.title === 'Dashboard' ? 'bg-blue-500' : 
                  currentPageInfo.title === 'Partners' ? 'bg-purple-500' : 
                  currentPageInfo.title === 'Passholders' ? 'bg-green-500' : 
                  currentPageInfo.title === 'Campaigns' ? 'bg-orange-500' : 
                  currentPageInfo.title === 'Analytics' ? 'bg-indigo-500' : 
                  'bg-blue-500'
                } bg-opacity-10 rounded-lg`}>
                  {React.createElement(currentPageInfo.icon, {
                    className: `h-5 w-5 ${
                      currentPageInfo.title === 'Dashboard' ? 'text-blue-600' : 
                      currentPageInfo.title === 'Partners' ? 'text-purple-600' : 
                      currentPageInfo.title === 'Passholders' ? 'text-green-600' : 
                      currentPageInfo.title === 'Campaigns' ? 'text-orange-600' : 
                      currentPageInfo.title === 'Analytics' ? 'text-indigo-600' : 
                      'text-blue-600'
                    }`
                  })}
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-semibold text-gray-900">
                    {currentPageInfo.pageTitle}
                  </h1>
                  <p className="text-sm text-gray-500 hidden md:block">
                    {currentPageInfo.pageDescription}
                  </p>
                </div>
                <div className="sm:hidden">
                  <h1 className="text-base font-semibold text-gray-900">
                    {currentPageInfo.pageTitle}
                  </h1>
                </div>
              </div>
            </div>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{tenantEmail}</p>
                    <p className="text-xs text-gray-500">Tenant Admin</p>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {tenantEmail.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-lg">
                <DropdownMenuItem className="flex items-center px-3 py-2 cursor-pointer">
                  <User className="mr-3 h-4 w-4 text-gray-500" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center px-3 py-2 cursor-pointer">
                  <BillingIcon className="mr-3 h-4 w-4 text-gray-500" />
                  <span>Plans & Billing</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center px-3 py-2 cursor-pointer">
                  <HelpCircle className="mr-3 h-4 w-4 text-gray-500" />
                  <span>Help</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="flex items-center px-3 py-2 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
