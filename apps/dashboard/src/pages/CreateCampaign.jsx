import React from 'react';
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gift, Zap, Star } from 'lucide-react';
import { motion } from 'framer-motion';

import RedemptionPass from '../components/campaigns/RedemptionPass';
import MilestonePass from '../components/campaigns/MilestonePass';
import PointsPass from '../components/campaigns/PointsPass';

const PassTypeCard = ({ passType, onSelect }) => {
  const { title, description, icon: Icon, color, comingSoon, PassComponent, accentColor } = passType;

  return (
    <div
      className={`relative group flex flex-col justify-between p-6 rounded-2xl h-full shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent cursor-pointer ${comingSoon ? 'bg-gray-50' : 'bg-white'}`}
      style={{ borderTopColor: accentColor, borderTopWidth: '4px', ...(comingSoon ? {} : { borderColor: accentColor + '40', hoverBorderColor: accentColor }) }}
      onClick={!comingSoon ? onSelect : undefined}
    >
      {comingSoon && (
        <div className="absolute top-4 right-4 bg-yellow-200 text-yellow-900 px-2 py-1 text-xs font-medium rounded-full">
          Coming Soon
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: accentColor }}
          ></div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
        <p className={`text-gray-600 mb-6 ${comingSoon ? 'opacity-50' : ''}`}>{description}</p>
        
        {/* Pass Preview */}
        <div className="flex-1 flex justify-center items-center my-4">
          <div className="transform scale-[0.7]">
            {PassComponent ? <PassComponent /> : 
              <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Icon className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">Preview</p>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <Button
          variant="outline"
          className={`w-full justify-center transition-all duration-300 ${comingSoon ? 'cursor-not-allowed opacity-50' : `group-hover:bg-[${accentColor}10] group-hover:text-[${accentColor}]`}`}
          disabled={comingSoon}
          style={{ borderColor: accentColor + '40', color: accentColor }}
        >
          <span>{comingSoon ? "Coming Soon" : "Select This Type"}</span>
        </Button>
      </div>
    </div>
  );
};

export default function CreateCampaign() {
  const navigate = useNavigate();

  const passTypes = [
    {
      title: "Redemption Card",
      description: "Single-use rewards like discounts, free items, or special offers that customers can redeem once.",
      icon: Gift,
      color: "bg-purple-500",
      accentColor: "#8B5CF6", // Purple-500
      comingSoon: false,
      PassComponent: () => <RedemptionPass passData={{ 
        stamps: 4, 
        totalStamps: 10, 
        color: '#8B5CF6',
        logoIcon: '🎁',
        logoTitle: 'REDEMPTION',
        // logoImage: '/storage/images/logos/gift-logo.png', // Uncomment to use custom logo
        // backgroundImage: '/storage/images/processed/gift-strip-background.png', // Uncomment to use custom background
        // stampIcon: '/storage/images/stamps/gift-stamp.png' // Uncomment to use custom stamp
      }} />
    },
    {
      title: "Milestone Card", 
      description: "Collect stamps or progress markers to unlock rewards when reaching specific goals or milestones.",
      icon: Zap,
      color: "bg-blue-500",
      accentColor: "#3B82F6", // Blue-500
      comingSoon: false,
      PassComponent: () => <MilestonePass passData={{ 
        stamps: 4, 
        totalStamps: 10, 
        color: '#3B82F6',
        logoIcon: '⚡',
        logoTitle: 'MILESTONE',
        cardHolder: 'John Doe',
        nextReward: 'Free coffee at 5 stamps',
        // logoImage: '/storage/images/logos/milestone-logo.png', // Uncomment to use custom logo
        // backgroundImage: '/storage/images/processed/milestone-strip-background.png', // Uncomment to use custom background
        // stampIcon: '/storage/images/stamps/milestone-stamp.png' // Uncomment to use custom stamp
      }} />
    },
    {
      title: "Points Card",
      description: "Accumulate points with every purchase that can be spent flexibly on various rewards and benefits.",
      icon: Star,
      color: "bg-orange-500", 
      accentColor: "#F97316", // Orange-500
      comingSoon: false,
      PassComponent: () => <PointsPass passData={{ 
        points: 1250, 
        color: '#F97316',
        logoIcon: '⭐',
        logoTitle: 'POINTS',
        cardHolder: 'John Doe',
        nextRewardAt: 2000,
        // logoImage: '/storage/images/logos/points-logo.png', // Uncomment to use custom logo
        // backgroundImage: '/storage/images/processed/points-strip-background.png', // Uncomment to use custom background
      }} />
    }
  ];

  const handleSelectPass = (passType) => {
    // Navigate to the specific editor based on pass type
    const editorRoutes = {
      'Redemption Card': '/editor/redemption',
      'Milestone Card': '/editor/milestone', 
      'Points Card': '/editor/points'
    };
    
    const route = editorRoutes[passType.title];
    if (route) {
      navigate(route);
    } else {
      console.error('Unknown pass type:', passType.title);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(createPageUrl('Campaigns'))}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Choose Pass Type</h1>
          <p className="text-gray-600 mt-1">Select the type of digital wallet pass you want to create for your campaign.</p>
        </div>
      </motion.div>

      {/* Pass Type Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
        {passTypes.map((pass, index) => (
          <motion.div
            key={pass.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <PassTypeCard
              passType={pass}
              onSelect={() => handleSelectPass(pass)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
