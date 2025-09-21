// layoutCalculator.ts
// SOLID: Single Responsibility - Calculate optimal layout for stamps

import { Layout, LayoutCalculator } from '../types/stripInterfaces';
import { STRIP_W_1X, STRIP_H_1X } from '../shared/stripConstants';

export class OptimizedLayoutCalculator implements LayoutCalculator {
  /**
   * Calculate optimal rows and columns using the same logic as live preview
   */
  calculateOptimalLayout(stampCount: number): Layout {
    // Tiered layout plan
    if (stampCount <= 1) return { rows: 1, cols: Math.max(1, stampCount) };
    if (stampCount <= 5) return { rows: 1, cols: stampCount };
    if (stampCount <= 10) return { rows: 2, cols: 5 };
    if (stampCount <= 12) return { rows: 2, cols: 6 };
    if (stampCount <= 16) return { rows: 2, cols: 8 }; // 13-16 stamps use same tier
    if (stampCount <= 18) return { rows: 2, cols: 9 }; // widen to reduce whitespace
    if (stampCount <= 20) return { rows: 3, cols: 7 };
    if (stampCount <= 24) return { rows: 3, cols: 8 };
    if (stampCount <= 27) return { rows: 3, cols: 9 };
    return { rows: 3, cols: 10 };
  }
}
