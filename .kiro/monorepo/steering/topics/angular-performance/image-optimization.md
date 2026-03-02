---
inclusion: manual
---

# Image Optimization

## Scope

### This file applies when you:
- Add or modify `<img>` tags in templates
- Create image-displaying components
- Optimize LCP (Largest Contentful Paint) metrics
- Work on above-the-fold content with images

### This file does NOT cover:
- CSS background images (use `<img>` instead)
- SVG icons (handled by design system)
- Video/media optimization

**Rule:** All static images must use `NgOptimizedImage` directive. No exceptions.

---

## Core Principles

- **P1 – Always use NgOptimizedImage:** Every `<img>` must use `ngSrc` instead of `src` to enable automatic optimization and prevent layout shift.
- **P2 – Define explicit dimensions:** Always specify `width` and `height` matching the image's aspect ratio to prevent CLS (Cumulative Layout Shift). Or use the `fill` attribute on an image that fills out its entire container. Make sure the container has `position: relative`
- **P3 – Responsive sizing:** Use `sizes` and `ngSrcset` to deliver optimal images for different viewports, reducing bandwidth waste.
- **P4 – Priority for above-the-fold:** Set `priority="true"` only for LCP images visible on initial load. Never lazy-load critical images. In case images are generated in a loop, make the first image using `priority` and all others should be lazy

---

## Do / Don't Guidelines

### Do
- Import `NgOptimizedImage` from `@angular/common` in component imports
- Define `width` and `height` to match the image's actual aspect ratio or use `fill` when filling out an entire container
- Use `sizes` & `ngSrcSet` attribute to specify how much viewport width the image occupies
- Set `priority="true"` for the single most important above-the-fold image

### Don't
- Never use plain `src` attribute (use `ngSrc` instead)
- Never omit `width` and `height` (causes layout shift) when not using `fill`
- Never set `priority="true"` for below-the-fold images (wastes bandwidth)
- Never use CSS background images for content images (prevents optimization)

---

## Standard Patterns

### Basic optimized image:
```typescript
@Component({
  template: `
    <img
      [ngSrc]="imagePath()"
      [width]="640"
      [height]="480"
      [alt]="imageAlt()"
      sizes="(min-width: 960px) 640px, 100vw"
      ngSrcset="320w, 640w, 960w" />
  `,
  imports: [NgOptimizedImage]
})
```

### LCP image (above-the-fold):
```typescript
<img
  [ngSrc]="heroImage()"
  [width]="1920"
  [height]="1080"
  [priority]="true"
  [alt]="heroAlt()"
  sizes="100vw"
  ngSrcset="768w, 1024w, 1920w" />
```

### Responsive image component:
```typescript
@Component({
  selector: 'app-responsive-image',
  template: `
    <img
      [ngSrc]="src()"
      [width]="width()"
      [height]="height()"
      [sizes]="sizes()"
      [ngSrcset]="srcset()"
      [priority]="priority()"
      [alt]="alt()" />
  `,
  imports: [NgOptimizedImage]
})
export class ResponsiveImageComponent {
  src = input.required<string>();
  width = input.required<number>();
  height = input.required<number>();
  alt = input.required<string>();
  sizes = input<string>('100vw');
  srcset = input<string>('');
  priority = input<boolean>(false);
}
```

---

## Implementation Checklist

- [ ] Have you imported `NgOptimizedImage` in the component?
- [ ] Does the image use `ngSrc` instead of `src`?
- [ ] Are `width` and `height` specified matching the aspect ratio?
- [ ] Is `sizes` attribute defined based on actual viewport usage?
- [ ] Is `ngSrcset` provided with multiple resolution variants?
- [ ] Is `priority="true"` set only for the LCP image (if applicable)?
- [ ] Does the image have a descriptive `alt` attribute?

---

## Common Pitfalls

- ❌ **Using plain `src` attribute**
  - Bypasses Angular's optimization, causes layout shift, no automatic srcset generation
- ❌ **Omitting width/height**
  - Causes CLS as browser can't reserve space before image loads
- ❌ **Setting priority on multiple images**
  - Wastes bandwidth by eagerly loading non-critical images, hurts performance
- ❌ **Hardcoded sizes="100vw" for small images**
  - Downloads unnecessarily large images on desktop when image only occupies partial width
- ❌ **Using CSS background-image for content**
  - Prevents NgOptimizedImage optimization, no lazy loading, poor accessibility

---

## Escalation & Trade-offs

- If image optimization conflicts with:
  - **Legacy CSS patterns:** Refactor to use `<img>` with NgOptimizedImage
  - **Dynamic runtime styling:** Use wrapper elements with CSS, not background images
  - **Third-party components:** Wrap in custom component using NgOptimizedImage

**Rule:** Performance and CLS prevention always win. Refactor incompatible patterns rather than skip optimization.

---

## Related Steering Files

- `.kiro/steering/topics/ssr/` – SSR compatibility for images
- `.kiro/steering/topics/design-system/` – Design system image components
