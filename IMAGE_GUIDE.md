# Pass Template Images Guide

## Directory Structure

Place your images in the following directories:

```
apps/dashboard/public/storage/images/
├── logos/                    # Company/brand logos
│   ├── coffee-shop-logo.png
│   ├── restaurant-logo.png
│   ├── retail-logo.png
│   └── ...
├── processed/               # Background images and patterns
│   ├── default-strip-background.png
│   ├── coffee-strip-background.png
│   ├── restaurant-strip-background.png
│   ├── retail-strip-background.png
│   └── ...
└── stamps/                  # Custom stamp icons (optional)
    ├── coffee-stamp.png
    ├── food-stamp.png
    ├── retail-stamp.png
    └── ...
```

## Image Requirements

### Logo Images (Apple PassKit Standard)

- **@1x**: 160x50px
- **@2x**: 320x100px
- **@3x**: 480x150px
- **Format**: PNG with transparency preferred
- **File naming**: Use descriptive names with resolution suffix like `{business-type}-logo.png`, `{business-type}-logo@2x.png`, `{business-type}-logo@3x.png`

### Icon Images (Apple PassKit Standard)

- **@1x**: 29x29px
- **@2x**: 58x58px
- **@3x**: 87x87px
- **Format**: PNG with transparency
- **File naming**: Use descriptive names with resolution suffix like `{business-type}-icon.png`, `{business-type}-icon@2x.png`, `{business-type}-icon@3x.png`

### Strip Images (Apple PassKit Standard)

- **@1x**: 375x123px
- **@2x**: 750x246px
- **@3x**: 1125x369px
- **Format**: PNG or JPG
- **File naming**: Use descriptive names with resolution suffix like `{business-type}-strip.png`, `{business-type}-strip@2x.png`, `{business-type}-strip@3x.png`

## Usage in Pass Components

### 1. Logo Images (160x50px base)

Update the `logoImage` property in pass data:

```javascript
const passData = {
  logoImage: "/storage/images/logos/coffee-shop-logo.png", // 160x50px
  logoImage2x: "/storage/images/logos/coffee-shop-logo@2x.png", // 320x100px (optional)
  logoImage3x: "/storage/images/logos/coffee-shop-logo@3x.png", // 480x150px (optional)
  logoIcon: "☕", // Fallback icon
  logoTitle: "COFFEE SHOP",
  // ... other properties
};
```

### 2. Icon Images (29x29px base)

Update the `iconImage` property in pass data:

```javascript
const passData = {
  iconImage: "/storage/images/icons/coffee-shop-icon.png", // 29x29px
  iconImage2x: "/storage/images/icons/coffee-shop-icon@2x.png", // 58x58px (optional)
  iconImage3x: "/storage/images/icons/coffee-shop-icon@3x.png", // 87x87px (optional)
  // ... other properties
};
```

### 3. Strip Images (375x123px base)

Update the `stripImage` property in pass data:

```javascript
const passData = {
  stripImage: "/storage/images/strips/coffee-strip.png", // 375x123px
  stripImage2x: "/storage/images/strips/coffee-strip@2x.png", // 750x246px (optional)
  stripImage3x: "/storage/images/strips/coffee-strip@3x.png", // 1125x369px (optional)
  // ... other properties
};
```

## Example File Names

### Coffee Shop Template

- **Logo**: `coffee-shop-logo.png` (160x50), `coffee-shop-logo@2x.png` (320x100), `coffee-shop-logo@3x.png` (480x150)
- **Icon**: `coffee-shop-icon.png` (29x29), `coffee-shop-icon@2x.png` (58x58), `coffee-shop-icon@3x.png` (87x87)
- **Strip**: `coffee-strip.png` (375x123), `coffee-strip@2x.png` (750x246), `coffee-strip@3x.png` (1125x369)

### Restaurant Template

- **Logo**: `restaurant-logo.png` (160x50), `restaurant-logo@2x.png` (320x100), `restaurant-logo@3x.png` (480x150)
- **Icon**: `restaurant-icon.png` (29x29), `restaurant-icon@2x.png` (58x58), `restaurant-icon@3x.png` (87x87)
- **Strip**: `restaurant-strip.png` (375x123), `restaurant-strip@2x.png` (750x246), `restaurant-strip@3x.png` (1125x369)

### Retail Store Template

- **Logo**: `retail-logo.png` (160x50), `retail-logo@2x.png` (320x100), `retail-logo@3x.png` (480x150)
- **Icon**: `retail-icon.png` (29x29), `retail-icon@2x.png` (58x58), `retail-icon@3x.png` (87x87)
- **Strip**: `retail-strip.png` (375x123), `retail-strip@2x.png` (750x246), `retail-strip@3x.png` (1125x369)

## Default Images

If no custom images are provided, the components will use:

- Default logo: Text-based icon (e.g., "☕", "🍕", "🛍️")
- Default background: `default-strip-background.png`
- Default stamps: Colored circles

## Adding Images to Your Project

1. Create the appropriate image files with the correct dimensions
2. Place them in the corresponding directories above
3. Update your pass data objects to reference the new images
4. Test the passes to ensure images display correctly

## Best Practices

1. **Optimize images**: Compress images to reduce file size
2. **Use consistent naming**: Follow the naming convention for easy management
3. **Test on different devices**: Ensure images look good on various screen sizes
4. **Provide fallbacks**: Always include fallback icons for when images fail to load
5. **Use transparency**: PNG files with transparency work best for logos and stamps
