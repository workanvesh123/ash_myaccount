---
inclusion: manual
---

# CSS & Animations – Performance Optimization

## Scope – When to Read This

### This file applies when you:
- Write or modify CSS animations, transitions, or keyframes
- Optimize rendering performance or fix jank/stuttering
- Add visual effects, hover states, or interactive animations
- Work with transform, opacity, or layout-affecting properties

### This file does NOT cover:
- Design system component styling (see `design-system-integration.md`)
- Semantic tokens and theming (see `semantic-tokens.md`)
- DOM manipulation patterns (see `dom-manipulation.md`)

---

## Core Principles

- **P1 – Compositor-Only Animations:** Try to use compositor properties such as `transform` and `opacity` for animations & state transitions. These properties run on the GPU compositor thread without triggering layout or paint, ensuring 60fps performance.
- **P2 – No Layout Thrashing:** Never animate layout properties such as (`top`, `left`, `width`, `height`, `margin`, `padding`). These force synchronous layout recalculations on every frame, causing jank.
- **P3 – Use `<img>` for Images:** Never use CSS `background-image` for any images. Use `<img>` with `NgOptimizedImage` for proper lazy loading, responsive sizing, and LCP optimization.
- **P4 - Prioritize & optimize Images** prioritize images that are LCP candidates (e.g. the first item of a list). Also specify a proper `sizes` property.
- **P5 – Avoid `will-change`:** Do not use `will-change` unless absolutely necessary. Modern browsers automatically optimize animations on `transform` and `opacity`. Using `will-change` creates additional compositor layers, increases memory usage, and can degrade performance.

---

## Do / Don't Guidelines

### Do
- Use `transform: translateX()`, `scale()`, `rotate()` for movement and sizing
- Animate `opacity` for fade effects
- Use `transition-behavior: allow-discrete` with `@starting-style` for animating `display` and `content-visibility`
- Use CSS transitions for simple state changes, keyframe animations for complex sequences

### Don't
- Animate `top`, `left`, `width`, `height`, `margin`, or `padding`
- Use `background-image: url()` for any images (always use `<img>` with `NgOptimizedImage`)
- Use `will-change` (modern browsers auto-optimize; manual use creates unnecessary layers)
- Animate multiple properties simultaneously unless all are compositor-friendly
- Use `transition: all` (explicitly list properties for better performance)

---

## Standard Patterns

### Transform-Based Animations
```scss
// ✅ Correct: Transform-based slide animation
.slide-in {
  transform: translateX(0);
  transition: transform 300ms ease-out;
  
  &.hidden {
    transform: translateX(-100%);
  }
}

// ❌ Wrong: Layout property animation
.slide-in {
  left: 0;
  transition: left 300ms ease-out;
  
  &.hidden {
    left: -100%;
  }
}
```

### Animating `display` and `content-visibility`
```scss
// ✅ Correct: Modern approach to animate display property
.modal {
  display: none;
  opacity: 0;
  transition: opacity 300ms ease,
              display 300ms ease allow-discrete;
  
  &.open {
    display: block;
    opacity: 1;
  }
}

@starting-style {
  .modal.open {
    opacity: 0;
  }
}

// ❌ Wrong: Using visibility workarounds
.modal {
  visibility: hidden;
  opacity: 0;
  transition: opacity 300ms ease, visibility 0s 300ms;
  
  &.open {
    visibility: visible;
    opacity: 1;
    transition-delay: 0s;
  }
}
```

### Image Optimization
```typescript
// ✅ Correct: Use NgOptimizedImage
<img
  [ngSrc]="imageSrc()"
  [width]="320"
  [height]="240"
  sizes="(min-width: 960px) 768px, 100vw"
  ngSrcset="480w, 640w, 768w"
  [alt]="imageAlt()" />

// ❌ Wrong: CSS background-image
<div [style.background-image]="'url(' + imageSrc() + ')'"></div>
```

---

## Implementation Checklist

- [ ] Are all animations using only `transform` and `opacity`?
- [ ] Are you avoiding `will-change` (let browsers auto-optimize)?
- [ ] Are all images using `<img>` with `NgOptimizedImage` (never CSS `background-image`)?
- [ ] Are images properly optimized in terms of priority, placeholder & sizes configuration?
- [ ] Are you using `transition-behavior: allow-discrete` with `@starting-style` for `display`/`content-visibility` animations?
- [ ] Do transitions explicitly list properties (not `transition: all`)?

---

## Common Pitfalls & Anti-Patterns

- ❌ **Animating layout properties:** Causes forced synchronous layout on every frame, resulting in jank and dropped frames.
- ❌ **Using `will-change`:** Creates unnecessary compositor layers and increases memory usage. Modern browsers automatically optimize `transform` and `opacity` animations.
- ❌ **CSS background images:** Never use `background-image` for any images. Always use `<img>` with `NgOptimizedImage` for lazy loading, responsive sizing, and LCP optimization.
- ❌ **`transition: all`:** Animates every property change, including unintended ones. Explicitly list properties for predictable behavior.
- ❌ **Old `display: none` workarounds:** Use modern `transition-behavior: allow-discrete` with `@starting-style` instead of visibility hacks.

---

## Escalation & Trade-offs

- If animation smoothness conflicts with design requirements:
  - Prefer performance (60fps) over pixel-perfect design
  - Use `transform: scale()` instead of animating `width`/`height`
  - Consult design team to find compositor-friendly alternatives

**Rule:** When trade-offs are unclear, favor compositor-only animations and leave a comment explaining the performance constraint.

---

## Related Steering Files

- `.kiro/steering/topics/angular-performance/dom-manipulation.md` – DOM read/write batching
- `.kiro/steering/topics/angular-performance/image-optimization.md` – NgOptimizedImage patterns
- `.kiro/steering/topics/design-system/semantic-tokens.md` – Design system styling
