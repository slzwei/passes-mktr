/**
 * Single source of truth for Apple Wallet storeCard strip dimensions
 * These are the official Apple PassKit dimensions for storeCard strip images
 * 
 * Shared between frontend and backend to ensure consistency
 */

// Apple Wallet storeCard strip dimensions (official specifications)
export const STRIP_W_1X = 375;
export const STRIP_H_1X = 144;

export const STRIP_W_2X = 750;  // 375 * 2
export const STRIP_H_2X = 288;  // 144 * 2

export const STRIP_W_3X = 1125; // 375 * 3
export const STRIP_H_3X = 432;  // 144 * 3

// Safe area padding for Apple Wallet display crop
export const STRIP_SAFE_AREA_TOP = 15;    // 15px top padding
export const STRIP_SAFE_AREA_BOTTOM = 15; // 15px bottom padding
export const STRIP_SAFE_AREA_HEIGHT = STRIP_H_1X - STRIP_SAFE_AREA_TOP - STRIP_SAFE_AREA_BOTTOM; // 114px

// Debug mode toggle (for frontend, we'll use environment variable)
export const STRIP_DEBUG = process.env.NODE_ENV === 'development';
