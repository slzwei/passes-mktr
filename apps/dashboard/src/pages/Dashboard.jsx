import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard, 
  Megaphone, 
  BarChart3,
  ArrowUpRight,
  Eye,
  Download,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";

const MetricCard = ({ title, value, change, changeType, icon: Icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className={`absolute top-0 right-0 w-20 h-20 ${color} opacity-10 rounded-full transform translate-x-6 -translate-y-6`}></div>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          <div className={`p-2 ${color} bg-opacity-10 rounded-lg`}>
            <Icon className={`h-4 w-4 ${color.replace('bg-', 'text-')}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className={`flex items-center text-sm ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
            {changeType === 'positive' ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {change}
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const RecentActivity = () => (
  <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
    <CardHeader className="border-b border-gray-50">
      <CardTitle className="flex items-center justify-between">
        <span>Recent Activity</span>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          View All
        </Button>
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="divide-y divide-gray-50">
        {[
          { action: "New partner joined", time: "2 hours ago", type: "partner" },
          { action: "Campaign launched", time: "4 hours ago", type: "campaign" },
          { action: "1,234 passes issued", time: "6 hours ago", type: "pass" },
          { action: "Analytics report generated", time: "1 day ago", type: "report" },
        ].map((activity, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 hover:bg-gray-25 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'partner' ? 'bg-blue-500' :
                  activity.type === 'campaign' ? 'bg-purple-500' :
                  activity.type === 'pass' ? 'bg-green-500' : 'bg-orange-500'
                }`}></div>
                <span className="text-sm text-gray-900">{activity.action}</span>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const QuickActions = () => (
  <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
    <CardHeader className="border-b border-gray-50">
      <CardTitle>Quick Actions</CardTitle>
    </CardHeader>
    <CardContent className="p-6">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Add Partner", icon: Plus, color: "bg-blue-600 hover:bg-blue-700" },
          { label: "New Campaign", icon: Megaphone, color: "bg-purple-600 hover:bg-purple-700" },
          { label: "View Analytics", icon: BarChart3, color: "bg-green-600 hover:bg-green-700" },
          { label: "Export Data", icon: Download, color: "bg-orange-600 hover:bg-orange-700" },
        ].map((action, index) => (
          <motion.div
            key={action.label}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button className={`w-full ${action.color} shadow-sm text-white border-0`}>
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          </motion.div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    partners: { value: "248", change: "+12%", changeType: "positive" },
    passholders: { value: "15.2K", change: "+18%", changeType: "positive" },
    campaigns: { value: "32", change: "+5%", changeType: "positive" },
    engagement: { value: "87.3%", change: "-2%", changeType: "negative" },
  });

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 max-w-7xl mx-auto">
      {/* Quick Actions Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            All systems operational
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-purple-600 hover:bg-purple-700 shadow-sm">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Partners"
          value={stats.partners.value}
          change={stats.partners.change}
          changeType={stats.partners.changeType}
          icon={Users}
          color="bg-blue-500"
        />
        <MetricCard
          title="Total Passholders"
          value={stats.passholders.value}
          change={stats.passholders.change}
          changeType={stats.passholders.changeType}
          icon={CreditCard}
          color="bg-green-500"
        />
        <MetricCard
          title="Active Campaigns"
          value={stats.campaigns.value}
          change={stats.campaigns.change}
          changeType={stats.campaigns.changeType}
          icon={Megaphone}
          color="bg-purple-500"
        />
        <MetricCard
          title="Engagement Rate"
          value={stats.engagement.value}
          change={stats.engagement.change}
          changeType={stats.engagement.changeType}
          icon={BarChart3}
          color="bg-orange-500"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="border-b border-gray-50">
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Chart visualization coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}