import { PassTemplate } from '../types/passTypes';

export interface TemplateLibraryItem {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  preview: string;
  template: PassTemplate;
}

export class TemplateLibraryService {
  private static instance: TemplateLibraryService;

  constructor() {}

  static getInstance(): TemplateLibraryService {
    if (!TemplateLibraryService.instance) {
      TemplateLibraryService.instance = new TemplateLibraryService();
    }
    return TemplateLibraryService.instance;
  }

  // Get all template library items
  getTemplateLibrary(): TemplateLibraryItem[] {
    return [
      {
        id: 'coffee-loyalty',
        name: 'Coffee Loyalty Card',
        description: 'Classic coffee shop loyalty card with stamp collection',
        category: 'Food & Beverage',
        tags: ['coffee', 'loyalty', 'stamps', 'food'],
        preview: 'coffee-loyalty-preview.png',
        template: {
          id: 'coffee-loyalty-template',
          name: 'Coffee Loyalty Card',
          type: 'redemption',
          description: 'Earn stamps for every coffee purchase',
          fields: {
            header: [
              {
                key: 'company_name',
                label: 'Coffee Corner',
                value: 'Coffee Corner',
                textAlignment: 'PKTextAlignmentCenter'
              }
            ],
            primary: [
              {
                key: 'stamps_earned',
                label: 'Stamps',
                value: '{{stampsEarned}}/{{stampsRequired}}',
                textAlignment: 'PKTextAlignmentCenter'
              }
            ],
            secondary: [
              {
                key: 'next_reward',
                label: 'Next Reward',
                value: '{{nextReward}}',
                textAlignment: 'PKTextAlignmentLeft'
              },
              {
                key: 'expiry_date',
                label: 'Expires',
                value: '{{expiryDate}}',
                textAlignment: 'PKTextAlignmentRight'
              }
            ],
            auxiliary: [
              {
                key: 'customer_name',
                label: 'Member',
                value: '{{customerName}}',
                textAlignment: 'PKTextAlignmentCenter'
              }
            ],
            back: [
              {
                key: 'terms',
                label: 'Terms & Conditions',
                value: 'Present this card for stamp collection. One stamp per purchase. Valid at participating locations.',
                textAlignment: 'PKTextAlignmentLeft'
              }
            ]
          },
          colors: {
            foreground: 'rgb(255, 255, 255)',
            background: 'rgb(139, 69, 19)',
            label: 'rgb(255, 255, 255)'
          },
          images: {
            logo: null,
            icon: null,
            strip: null
          }
        }
      },
      {
        id: 'retail-rewards',
        name: 'Retail Rewards Card',
        description: 'Points-based rewards system for retail stores',
        category: 'Retail',
        tags: ['retail', 'points', 'rewards', 'shopping'],
        preview: 'retail-rewards-preview.png',
        template: {
          id: 'retail-rewards-template',
          name: 'Retail Rewards Card',
          type: 'points',
          description: 'Earn points on every purchase',
          fields: {
            header: [
              {
                key: 'store_name',
                label: 'Fashion Store',
                value: 'Fashion Store',
                textAlignment: 'PKTextAlignmentCenter'
              }
            ],
            primary: [
              {
                key: 'points_balance',
                label: 'Points Balance',
                value: '{{pointsEarned}}',
                textAlignment: 'PKTextAlignmentCenter'
              }
            ],
            secondary: [
              {
                key: 'membership_tier',
                label: 'Tier',
                value: '{{membershipTier}}',
                textAlignment: 'PKTextAlignmentLeft'
              },
              {
                key: 'spend_amount',
                label: 'Total Spent',
                value: '\\${{spendAmount}}',
                textAlignment: 'PKTextAlignmentRight'
              }
            ],
            auxiliary: [
              {
                key: 'next_reward',
                label: 'Next Reward',
                value: '{{nextReward}}',
                textAlignment: 'PKTextAlignmentCenter'
              }
            ],
            back: [
              {
                key: 'terms',
                label: 'Terms & Conditions',
                value: 'Earn 1 point per $1 spent. Points expire after 12 months. Valid at all store locations.',
                textAlignment: 'PKTextAlignmentLeft'
              }
            ]
          },
          colors: {
            foreground: 'rgb(255, 255, 255)',
            background: 'rgb(25, 25, 112)',
            label: 'rgb(255, 255, 255)'
          },
          images: {
            logo: null,
            icon: null,
            strip: null
          }
        }
      },
      {
        id: 'gym-membership',
        name: 'Gym Membership Card',
        description: 'Fitness center membership with class bookings',
        category: 'Health & Fitness',
        tags: ['gym', 'fitness', 'membership', 'health'],
        preview: 'gym-membership-preview.png',
        template: {
          id: 'gym-membership-template',
          name: 'Gym Membership Card',
          type: 'rewards',
          description: 'Access to all gym facilities and classes',
          fields: {
            header: [
              {
                key: 'gym_name',
                label: 'FitLife Gym',
                value: 'FitLife Gym',
                textAlignment: 'PKTextAlignmentCenter'
              }
            ],
            primary: [
              {
                key: 'membership_type',
                label: 'Membership',
                value: '{{membershipTier}}',
                textAlignment: 'PKTextAlignmentCenter'
              }
            ],
            secondary: [
              {
                key: 'expiry_date',
                label: 'Expires',
                value: '{{expiryDate}}',
                textAlignment: 'PKTextAlignmentLeft'
              },
              {
                key: 'member_id',
                label: 'Member ID',
                value: '{{customerId}}',
                textAlignment: 'PKTextAlignmentRight'
              }
            ],
            auxiliary: [
              {
                key: 'customer_name',
                label: 'Member',
                value: '{{customerName}}',
                textAlignment: 'PKTextAlignmentCenter'
              }
            ],
            back: [
              {
                key: 'terms',
                label: 'Terms & Conditions',
                value: 'Valid for gym access and group classes. Bring photo ID. No guest privileges.',
                textAlignment: 'PKTextAlignmentLeft'
              }
            ]
          },
          colors: {
            foreground: 'rgb(255, 255, 255)',
            background: 'rgb(34, 139, 34)',
            label: 'rgb(255, 255, 255)'
          },
          images: {
            logo: null,
            icon: null,
            strip: null
          }
        }
      },
      {
        id: 'restaurant-loyalty',
        name: 'Restaurant Loyalty Card',
        description: 'Dining loyalty program with visit tracking',
        category: 'Food & Beverage',
        tags: ['restaurant', 'dining', 'loyalty', 'food'],
        preview: 'restaurant-loyalty-preview.png',
        template: {
          id: 'restaurant-loyalty-template',
          name: 'Restaurant Loyalty Card',
          type: 'redemption',
          description: 'Earn rewards with every visit',
          fields: {
            header: [
              {
                key: 'restaurant_name',
                label: 'Bella Vista',
                value: 'Bella Vista',
                textAlignment: 'PKTextAlignmentCenter'
              }
            ],
            primary: [
              {
                key: 'visits',
                label: 'Visits',
                value: '{{stampsEarned}}/{{stampsRequired}}',
                textAlignment: 'PKTextAlignmentCenter'
              }
            ],
            secondary: [
              {
                key: 'next_reward',
                label: 'Next Reward',
                value: '{{nextReward}}',
                textAlignment: 'PKTextAlignmentLeft'
              },
              {
                key: 'expiry_date',
                label: 'Expires',
                value: '{{expiryDate}}',
                textAlignment: 'PKTextAlignmentRight'
              }
            ],
            auxiliary: [
              {
                key: 'customer_name',
                label: 'Guest',
                value: '{{customerName}}',
                textAlignment: 'PKTextAlignmentCenter'
              }
            ],
            back: [
              {
                key: 'terms',
                label: 'Terms & Conditions',
                value: 'One visit per day counts. Present card before ordering. Valid for dine-in only.',
                textAlignment: 'PKTextAlignmentLeft'
              }
            ]
          },
          colors: {
            foreground: 'rgb(255, 255, 255)',
            background: 'rgb(255, 69, 0)',
            label: 'rgb(255, 255, 255)'
          },
          images: {
            logo: null,
            icon: null,
            strip: null
          }
        }
      },
      {
        id: 'beauty-salon',
        name: 'Beauty Salon Card',
        description: 'Spa and salon service tracking card',
        category: 'Beauty & Wellness',
        tags: ['beauty', 'salon', 'spa', 'wellness'],
        preview: 'beauty-salon-preview.png',
        template: {
          id: 'beauty-salon-template',
          name: 'Beauty Salon Card',
          type: 'redemption',
          description: 'Track your beauty treatments and rewards',
          fields: {
            header: [
              {
                key: 'salon_name',
                label: 'Serenity Spa',
                value: 'Serenity Spa',
                textAlignment: 'PKTextAlignmentCenter'
              }
            ],
            primary: [
              {
                key: 'treatments',
                label: 'Treatments',
                value: '{{stampsEarned}}/{{stampsRequired}}',
                textAlignment: 'PKTextAlignmentCenter'
              }
            ],
            secondary: [
              {
                key: 'next_reward',
                label: 'Next Reward',
                value: '{{nextReward}}',
                textAlignment: 'PKTextAlignmentLeft'
              },
              {
                key: 'expiry_date',
                label: 'Expires',
                value: '{{expiryDate}}',
                textAlignment: 'PKTextAlignmentRight'
              }
            ],
            auxiliary: [
              {
                key: 'customer_name',
                label: 'Client',
                value: '{{customerName}}',
                textAlignment: 'PKTextAlignmentCenter'
              }
            ],
            back: [
              {
                key: 'terms',
                label: 'Terms & Conditions',
                value: 'One treatment per visit counts. Book in advance. Valid for 12 months from issue.',
                textAlignment: 'PKTextAlignmentLeft'
              }
            ]
          },
          colors: {
            foreground: 'rgb(255, 255, 255)',
            background: 'rgb(147, 51, 234)',
            label: 'rgb(255, 255, 255)'
          },
          images: {
            logo: null,
            icon: null,
            strip: null
          }
        }
      }
    ];
  }

  // Get templates by category
  getTemplatesByCategory(category: string): TemplateLibraryItem[] {
    return this.getTemplateLibrary().filter(item => item.category === category);
  }

  // Get templates by tag
  getTemplatesByTag(tag: string): TemplateLibraryItem[] {
    return this.getTemplateLibrary().filter(item => 
      item.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
    );
  }

  // Search templates
  searchTemplates(query: string): TemplateLibraryItem[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getTemplateLibrary().filter(item =>
      item.name.toLowerCase().includes(lowercaseQuery) ||
      item.description.toLowerCase().includes(lowercaseQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  // Get template by ID
  getTemplateById(id: string): TemplateLibraryItem | null {
    return this.getTemplateLibrary().find(item => item.id === id) || null;
  }

  // Get all categories
  getCategories(): string[] {
    const categories = this.getTemplateLibrary().map(item => item.category);
    return Array.from(new Set(categories)).sort();
  }

  // Get all tags
  getTags(): string[] {
    const tags = this.getTemplateLibrary().flatMap(item => item.tags);
    return Array.from(new Set(tags)).sort();
  }

  // Create template from library item
  createTemplateFromLibrary(libraryItem: TemplateLibraryItem): PassTemplate {
    return {
      ...libraryItem.template,
      id: `template-${Date.now()}`,
      name: `${libraryItem.name} (Copy)`,
      description: libraryItem.description
    };
  }
}

export default TemplateLibraryService.getInstance();
