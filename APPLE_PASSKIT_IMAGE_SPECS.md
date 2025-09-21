# Apple PassKit Image Specifications

## ✅ Correct Image Dimensions

Based on Apple's official PassKit documentation, here are the **exact** image requirements:

### 📱 Logo Images

- **@1x**: 160×50px
- **@2x**: 320×100px
- **@3x**: 480×150px
- **Format**: PNG with transparency
- **Usage**: Appears in the pass header

### 🔘 Icon Images

- **@1x**: 29×29px
- **@2x**: 58×58px
- **@3x**: 87×87px
- **Format**: PNG with transparency
- **Usage**: Appears in stamps and throughout the pass

### 🖼️ Strip Images

- **@1x**: 375×123px
- **@2x**: 750×246px
- **@3x**: 1125×369px
- **Format**: PNG or JPG
- **Usage**: Background for the main content area

## 📁 Directory Structure

```
apps/dashboard/public/storage/images/
├── logos/                    # Logo images (160×50px base)
│   ├── coffee-shop-logo.png
│   ├── coffee-shop-logo@2x.png
│   ├── coffee-shop-logo@3x.png
│   └── ...
├── icons/                    # Icon images (29×29px base)
│   ├── coffee-shop-icon.png
│   ├── coffee-shop-icon@2x.png
│   ├── coffee-shop-icon@3x.png
│   └── ...
└── strips/                   # Strip images (375×123px base)
    ├── coffee-strip.png
    ├── coffee-strip@2x.png
    ├── coffee-strip@3x.png
    └── ...
```

## 🔧 Usage in Pass Data

```javascript
const passData = {
  // Logo images (160×50px base)
  logoImage: "/storage/images/logos/coffee-shop-logo.png", // @1x
  logoImage2x: "/storage/images/logos/coffee-shop-logo@2x.png", // @2x (optional)
  logoImage3x: "/storage/images/logos/coffee-shop-logo@3x.png", // @3x (optional)

  // Icon images (29×29px base)
  iconImage: "/storage/images/icons/coffee-shop-icon.png", // @1x
  iconImage2x: "/storage/images/icons/coffee-shop-icon@2x.png", // @2x (optional)
  iconImage3x: "/storage/images/icons/coffee-shop-icon@3x.png", // @3x (optional)

  // Strip images (375×123px base)
  stripImage: "/storage/images/strips/coffee-strip.png", // @1x
  stripImage2x: "/storage/images/strips/coffee-strip@2x.png", // @2x (optional)
  stripImage3x: "/storage/images/strips/coffee-strip@3x.png", // @3x (optional)

  // Fallback properties
  logoIcon: "☕", // Fallback emoji/text for logo
  logoTitle: "COFFEE SHOP", // Text that appears with logo

  // Other pass properties...
  color: "#8B5CF6",
  stamps: 4,
  totalStamps: 10,
  // etc.
};
```

## 🎯 What Size Should You Create?

### **Minimum Required**:

- Create the **@1x** versions first:
  - Logo: 160×50px
  - Icon: 29×29px
  - Strip: 375×123px

### **Recommended**:

- Create all three resolutions for best quality across devices:
  - **@1x**: Standard resolution
  - **@2x**: High-resolution displays (iPhone 4+, iPad 3+)
  - **@3x**: Ultra-high-resolution displays (iPhone 6+ Plus, newer iPads)

## 📝 File Naming Examples

### Coffee Shop

```
logos/
├── coffee-shop-logo.png      (160×50)
├── coffee-shop-logo@2x.png   (320×100)
└── coffee-shop-logo@3x.png   (480×150)

icons/
├── coffee-shop-icon.png      (29×29)
├── coffee-shop-icon@2x.png   (58×58)
└── coffee-shop-icon@3x.png   (87×87)

strips/
├── coffee-strip.png          (375×123)
├── coffee-strip@2x.png       (750×246)
└── coffee-strip@3x.png       (1125×369)
```

## 🚀 Quick Start

1. **Create your @1x images** with the base dimensions
2. **Place them** in the appropriate directories
3. **Update your pass data** to reference the images
4. **Test** your passes
5. **Optionally create @2x and @3x** for higher quality on retina displays

## ⚠️ Important Notes

- **Always provide @1x**: This is the minimum required
- **@2x and @3x are optional**: But recommended for best quality
- **Use exact dimensions**: Don't round or approximate
- **PNG with transparency**: Best for logos and icons
- **Keep file sizes reasonable**: Under 50KB for logos, 100KB for strips

## 🎉 Updated Components

The pass components have been updated to support:

- ✅ Apple PassKit standard dimensions
- ✅ Multiple resolution support (@1x, @2x, @3x)
- ✅ Proper image handling with srcSet
- ✅ Fallback support for missing images
- ✅ Updated directory structure

Your pass templates now fully comply with Apple's official PassKit image specifications!
