export type CardType = 'redemption' | 'points' | 'milestone';

export interface PassDesign {
  // Card Type
  cardType: CardType;
  
  // Colors
  backgroundColor: string;
  foregroundColor: string;
  labelColor: string;
  stripBackgroundColor: string;
  
  // Text Content
  logoText: string;
  logoImage?: string | null;
  logoFormat?: 'square' | 'wide';
  hideLogoText?: boolean;
  secondaryFields: Array<{
    label: string;
    value: string;
  }>;
  auxiliaryField: {
    label: string;
    value: string;
  };
  
  // Redemption Card Fields
  stampsEarned: number;
  totalStamps: number;
  
  // Milestone Card Fields
  numberOfMilestones: number;
  milestonePositions: number[]; // Array of stamp positions where milestones occur
  
  // Points Card Fields
  pointsBalance: number;
  pointsEarned: number;
  pointsRequired: number;
  pointsPerTransaction: number;
  nextRewardPoints: number;
  
  // Milestone Card Fields
  milestoneLevels: Array<{
    level: number;
    name: string;
    pointsRequired: number;
    reward: string;
  }>;
  currentMilestone: number;
  nextMilestonePoints: number;
  
  // Stamp Icons
  stampIconUnredeemed?: string | null;
  stampIconRedeemed?: string | null;
  stampIconMilestone?: string | null;
  useSameStampIcon?: boolean;
  useMilestoneOverlay?: boolean;
  
  // Stamp Colors
  stampUnredeemedColor?: string;
  stampEarnedColor?: string;
  stampMilestoneColor?: string;
  stampMilestoneCircleColor?: string;
  
  // Strip Background
  stripBackgroundImage?: string | null;
  stripBackgroundOpacity?: number;
  
  // Layout
  logoSize: number;
  cardWidth: number;
  cardHeight: number;
  stripHeight: number;
  headerHeight: number;
  secondaryHeight: number;
  auxiliaryHeight: number;
  barcodeHeight: number;
  
  // Barcode
  qrAltText?: string;
  
  // Expiration
  expirationDate?: string;
  hasExpiryDate?: boolean;
}
