import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, Calendar, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Analytics() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-end">
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
              Total Revenue
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">$125,430</div>
            <div className="flex items-center text-sm text-green-600 mt-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              +15.3% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">$47.82</div>
            <div className="flex items-center text-sm text-green-600 mt-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              +8.2% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Retention Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">78.5%</div>
            <div className="flex items-center text-sm text-green-600 mt-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              +3.1% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b border-gray-50">
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-orange-600" />
            Performance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
              <p className="text-gray-500 mb-6">Detailed charts and visualizations will appear here</p>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                Coming Soon
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}