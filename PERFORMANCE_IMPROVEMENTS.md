# Performance Optimization Guide

## Current Status (Lighthouse Report)
- **Performance Score: 27/100** 🔴 CRITICAL
- **LCP: 16.6s** (Target: <2.5s)
- **TBT: 1,720ms** (Target: <200ms)
- **CLS: 0.381** (Target: <0.1)
- **Speed Index: 2.7s** (Acceptable)

## Critical Issues & Solutions

### 1. Image Optimization (HIGHEST PRIORITY)

**Problems:**
- Images are **13.9 MB too large**
- Not using modern formats (WebP)
- Not efficiently encoded
- No lazy loading for offscreen images

**Solutions Implemented:**
✅ Created `OptimizedImage` component with:
- Lazy loading
- Loading skeletons
- WebP support with fallbacks
- Error handling

✅ Updated Home.js to use OptimizedImage component

**Next Steps:**
1. Install sharp: `npm install --save-dev sharp`
2. Run image optimizer: `node scripts/optimize-images.js`
3. This will convert all JPG/PNG images to WebP format
4. Expected savings: **~13 MB** (90%+ reduction)

### 2. Image Conversion Script

Run this to optimize all images:
```bash
npm install --save-dev sharp
node scripts/optimize-images.js
```

This will:
- Convert all images to WebP format
- Resize images to max 800px width
- Reduce quality to 80 (still looks great)
- Save alongside original files with .webp extension

### 3. Code Splitting (JavaScript Reduction)

**Current:** Unused JavaScript adds 316 KB

**Solutions:**
✅ Already using React.lazy() for heavy components
✅ Lazy loading: TrendingSongs, PersonalizedSections, Footer

**Additional Recommendations:**
- Split routes with lazy loading
- Move MUI imports to code-split chunks
- Use dynamic imports for heavy libraries

### 4. Fix CLS (Cumulative Layout Shift)

**Problem:** CLS of 0.381 (should be < 0.1)

**Solutions:**
✅ OptimizedImage component reserves space with fixed height
✅ Skeleton placeholders prevent layout shift

**Additional Recommendations:**
- Set explicit width/height on all images
- Reserve space for dynamic content
- Avoid inserting content above existing content

### 5. Firebase Storage Optimization

For images stored in Firebase Storage:

```javascript
// Use Firebase Storage image resizing
const imageUrl = 'https://firebasestorage.googleapis.com/...';
const optimizedUrl = `${imageUrl}_800x800`; // Firebase auto-resizes
```

Or upload pre-optimized images:
```javascript
import sharp from 'sharp';

const buffer = await sharp(file)
  .resize(800, 800, { fit: 'inside' })
  .webp({ quality: 80 })
  .toBuffer();

await uploadBytes(storageRef, buffer);
```

## Implementation Checklist

- [x] Create OptimizedImage component
- [x] Add WebP support with fallbacks
- [x] Add loading skeletons
- [x] Update Home.js to use OptimizedImage
- [ ] Install sharp package
- [ ] Run image optimization script
- [ ] Update all pages to use OptimizedImage
- [ ] Convert all existing images to WebP
- [ ] Set up automated image optimization in CI/CD
- [ ] Add image compression to upload flow

## Expected Results After Implementation

### Before:
- Performance Score: **27/100**
- LCP: **16.6s**
- Image Size: **~14 MB**

### After:
- Performance Score: **70-80/100** ⚡
- LCP: **<3s** ✅
- Image Size: **~1-2 MB** ✅

## Quick Wins (Do These First)

1. **Run image optimizer** (saves 13 MB):
   ```bash
   npm install --save-dev sharp
   node scripts/optimize-images.js
   ```

2. **Update remaining CardMedia components** to use OptimizedImage:
   ```javascript
   // Before:
   <CardMedia component="img" image={src} />

   // After:
   <OptimizedImage src={src} height={160} />
   ```

3. **Add explicit dimensions** to all images to prevent CLS

## Long-term Recommendations

1. **CDN**: Use Cloudflare or Firebase Hosting CDN for images
2. **Image service**: Consider using imgix, Cloudinary, or Firebase Extensions
3. **Monitoring**: Set up Lighthouse CI to track performance over time
4. **Budget**: Set performance budgets (LCP < 2.5s, TBT < 200ms)

## Testing

After implementing changes, test with:
```bash
# Lighthouse CLI
npm install -g lighthouse
lighthouse http://localhost:8888 --view

# Or use Chrome DevTools
# F12 → Lighthouse → Analyze page load
```

## Resources

- [Web.dev Performance](https://web.dev/performance/)
- [Image Optimization](https://web.dev/fast/#optimize-your-images)
- [WebP Format](https://developers.google.com/speed/webp)
- [Sharp Documentation](https://sharp.pixelplumbering.com/)
