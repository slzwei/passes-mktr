# Image Upload Guide for MKTR Passes

## 📁 Where to Place Your Images

Place your images in these directories under the project root:

```
storage/images/
├── logos/
│   ├── logo.png          # Your original logo (any size)
│   └── logo@2x.png       # Your original logo@2x (any size)
├── icons/
│   ├── icon.png          # Your original icon (any size)
│   └── icon@2x.png       # Your original icon@2x (any size)
└── strips/
    ├── strip.png         # Your original strip (any size)
    └── strip@2x.png      # Your original strip@2x (any size)
```

## 🎨 Image Requirements (Auto-Resized)

The system will automatically resize your images to Apple's required dimensions:

### Logos
- **logo.png**: Resized to 29x29px
- **logo@2x.png**: Resized to 58x58px

### Icons  
- **icon.png**: Resized to 29x29px
- **icon@2x.png**: Resized to 58x58px

### Strips
- **strip.png**: Resized to 320x84px
- **strip@2x.png**: Resized to 640x168px

## 📤 How to Upload

1. **Place your images** in the directories above
2. **Any size is fine** - the system will resize them
3. **Supported formats**: PNG, JPG, JPEG, WebP
4. **Run the pass generator** - it will use your images

## 🔧 Image Processing

The system uses Sharp.js to:
- ✅ Resize images to exact Apple requirements
- ✅ Optimize file size
- ✅ Maintain aspect ratio (with smart cropping)
- ✅ Convert to PNG format
- ✅ Handle any input format

## 📱 Testing Your Images

After placing your images, run:

```bash
# Generate a pass with your custom images
npm run pass:generate

# Or test the image processing
node scripts/test-image-processing.js
```

## 🎯 Image Tips

- **High resolution**: Use high-res images for better quality after resizing
- **Square logos**: Work best for 29x29 and 58x58 sizes
- **Wide strips**: 320x84 and 640x168 work well for horizontal designs
- **PNG format**: Recommended for transparency support
- **Simple designs**: Work better at small sizes

## 📂 Current Structure

```
storage/images/
├── logos/           # Place your logos here
├── icons/           # Place your icons here  
├── strips/          # Place your strips here
└── processed/       # Auto-generated resized images
```

**Just drop your images in the appropriate folders and the system will handle the rest!** 🚀
