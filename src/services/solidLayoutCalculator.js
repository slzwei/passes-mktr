// solidLayoutCalculator.js
// SOLID: Single Responsibility - Calculate optimal layout for stamps

/**
 * Calculate optimal rows and columns using the same logic as live preview
 */
class SolidLayoutCalculator {
  calculateOptimalLayout(stampCount) {
    // Tiered layout plan
    if (stampCount <= 1) return { rows: 1, cols: Math.max(1, stampCount) };
    if (stampCount <= 5) return { rows: 1, cols: stampCount };
    if (stampCount <= 10) return { rows: 2, cols: 5 };
    if (stampCount <= 12) return { rows: 2, cols: 6 };
    if (stampCount <= 15) return { rows: 2, cols: 8 }; // widen to reduce whitespace
    if (stampCount <= 18) return { rows: 2, cols: 9 }; // widen to reduce whitespace
    if (stampCount <= 20) return { rows: 3, cols: 7 };
    if (stampCount <= 24) return { rows: 3, cols: 8 };
    if (stampCount <= 27) return { rows: 3, cols: 9 };
    return { rows: 3, cols: 10 };
  }
}

module.exports = { SolidLayoutCalculator };
