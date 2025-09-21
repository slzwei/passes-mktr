/**
 * Campaign Metrics Service
 * Follows SOLID principles for extensible metric calculations
 */

// Base interface for metric calculators
class BaseMetricsCalculator {
  calculateMetrics(campaign) {
    throw new Error('calculateMetrics must be implemented by subclass');
  }
}

// Redemption card metrics calculator
class RedemptionMetricsCalculator extends BaseMetricsCalculator {
  calculateMetrics(campaign) {
    // In a real app, these would come from analytics data
    const issued = Math.floor(Math.random() * 500) + 100; // 100-600 issued
    const stampsRedeemed = Math.floor(Math.random() * issued * 3); // 0-3x stamps per issued pass
    
    return [
      {
        label: 'Issued',
        value: issued.toLocaleString(),
        icon: 'ticket'
      },
      {
        label: 'Stamps Redeemed', 
        value: stampsRedeemed.toLocaleString(),
        icon: 'stamp'
      }
    ];
  }
}

// Milestone card metrics calculator
class MilestoneMetricsCalculator extends BaseMetricsCalculator {
  calculateMetrics(campaign) {
    const issued = Math.floor(Math.random() * 300) + 50;
    const milestonesCompleted = Math.floor(Math.random() * issued * 0.7);
    
    return [
      {
        label: 'Issued',
        value: issued.toLocaleString(),
        icon: 'ticket'
      },
      {
        label: 'Milestones Completed',
        value: milestonesCompleted.toLocaleString(),
        icon: 'target'
      }
    ];
  }
}

// Points card metrics calculator
class PointsMetricsCalculator extends BaseMetricsCalculator {
  calculateMetrics(campaign) {
    const issued = Math.floor(Math.random() * 400) + 75;
    const totalPointsEarned = Math.floor(Math.random() * issued * 150);
    
    return [
      {
        label: 'Issued',
        value: issued.toLocaleString(),
        icon: 'ticket'
      },
      {
        label: 'Points Earned',
        value: totalPointsEarned.toLocaleString(),
        icon: 'star'
      }
    ];
  }
}

// Factory for creating metric calculators
class MetricsCalculatorFactory {
  static createCalculator(cardType) {
    switch (cardType) {
      case 'redemption':
        return new RedemptionMetricsCalculator();
      case 'milestone':
        return new MilestoneMetricsCalculator();
      case 'points':
        return new PointsMetricsCalculator();
      default:
        // Default to redemption for unknown types
        return new RedemptionMetricsCalculator();
    }
  }
}

// Main service class
class CampaignMetricsService {
  getMetricsForCampaign(campaign) {
    // Determine card type from campaign
    const cardType = campaign.type || campaign.cardType || campaign.passType || 'redemption';
    
    // Get appropriate calculator
    const calculator = MetricsCalculatorFactory.createCalculator(cardType);
    
    // Calculate and return metrics
    return calculator.calculateMetrics(campaign);
  }
  
  // Helper method to get metric icon component name
  getMetricIconName(iconType) {
    const iconMap = {
      'ticket': 'Ticket',
      'stamp': 'Stamp', 
      'target': 'Target',
      'star': 'Star'
    };
    
    return iconMap[iconType] || 'BarChart3';
  }
}

// Export singleton instance
export default new CampaignMetricsService();

// For debugging in development
if (process.env.NODE_ENV === 'development') {
  window.campaignMetricsService = new CampaignMetricsService();
}
