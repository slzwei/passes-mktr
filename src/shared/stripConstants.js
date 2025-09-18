/**
 * Single source of truth for Apple Wallet storeCard strip dimensions
 * These are the official Apple PassKit dimensions for storeCard strip images
 */

// Apple Wallet storeCard strip dimensions (official specifications)
const STRIP_W_1X = 375;
const STRIP_H_1X = 144;

const STRIP_W_2X = 750;  // 375 * 2
const STRIP_H_2X = 288;  // 144 * 2

const STRIP_W_3X = 1125; // 375 * 3
const STRIP_H_3X = 432;  // 144 * 3

// Safe area padding for Apple Wallet display crop
const STRIP_SAFE_AREA_TOP = 15;    // 15px top padding
const STRIP_SAFE_AREA_BOTTOM = 15; // 15px bottom padding
const STRIP_SAFE_AREA_HEIGHT = STRIP_H_1X - STRIP_SAFE_AREA_TOP - STRIP_SAFE_AREA_BOTTOM; // 114px

// Debug mode toggle
const STRIP_DEBUG = process.env.STRIP_DEBUG === 'true' || false;

module.exports = {
  STRIP_W_1X,
  STRIP_H_1X,
  STRIP_W_2X,
  STRIP_H_2X,
  STRIP_W_3X,
  STRIP_H_3X,
  STRIP_SAFE_AREA_TOP,
  STRIP_SAFE_AREA_BOTTOM,
  STRIP_SAFE_AREA_HEIGHT,
  STRIP_DEBUG
};
