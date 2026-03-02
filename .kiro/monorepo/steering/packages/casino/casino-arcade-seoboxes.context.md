---
inclusion: fileMatch
fileMatchPattern: 'packages/casino/arcade-seoboxes/**/*'
---

# Arcade SEO Boxes – Angular Library Context

## 1. Role & Scope

### Responsibility
- **Type**: Feature library (UI component)
- **Purpose**: Renders SEO-optimized content blocks for the arcade lobby using CMS-driven page matrix data
- **Consumers**: Casino arcade lobby (`packages/casino/entrypoint-lib/`)

### Out of scope
- CMS content fetching (handled by parent components)
- Page matrix rendering logic (delegated to `@frontend/vanilla/features/content`)
- Other lobby types (slots, live casino, game shows)

**Rule**: This component is a presentation wrapper. It receives SEO box data and delegates rendering to `PageMatrixComponent`.

---

## 2. Public API

- **Barrel file**: `src/index.ts`
- **Main export**: `ArcadeSeoboxesComponent`
- **Import path**: `@frontend/casino/arcade-seoboxes`
- **Stability**: Stable (arcade-specific feature)

**Rule**: Always import from `@frontend/casino/arcade-seoboxes`, never from internal paths.

---

## 3. Internal Structure

Minimal single-component library:

- `lib/arcade-seoboxes.component.ts` – Component logic
- `lib/arcade-seoboxes.component.html` – Template with `@for` loop
- `index.ts` – Public API barrel

**Placement rule**: This library is intentionally minimal. New arcade SEO features belong here only if they're tightly coupled to SEO box rendering.

---

## 4. Angular Patterns

### Component
- **Standalone**: Yes
- **Change detection**: Default (consider migrating to OnPush)
- **Lifecycle hooks**: `OnInit` (product detection), `OnChanges` (path decoding)

### State
- No internal state management
- Uses `ProductService` from `@frontend/vanilla/core` to detect current product
- Input-driven: `@Input() seoboxes: any`

### Data Flow
```
Parent (arcade lobby) → @Input() seoboxes → ArcadeSeoboxesComponent → PageMatrixComponent
                                                      ↓
                                              ProductService (current product)
```

**Rule**: Component is stateless. All data comes from inputs. Product context is read-only.

---

## 5. Invariants & Contracts

### Input Contract
- **`seoboxes`**: Array of objects with `path` property (type: `any`)
- **Transformation**: `OnChanges` decodes URI paths into `decodedPath` property
- **Nullability**: Component handles empty/undefined arrays gracefully

### Behavioral Guarantees
- Decodes all `path` properties using `decodeURI()` on input change
- Renders one SEO block per seobox item
- Delegates content rendering to `PageMatrixComponent`

### Error Handling
- Silent failure if `seoboxes` is undefined/null
- No error boundaries (relies on parent error handling)

**Rule**: Input mutation is acceptable here (`seoboxes[i].decodedPath = ...`) because the array is owned by this component's lifecycle.

---

## 6. Dependencies

### Allowed
- `@frontend/vanilla/core` – `ProductService`, `ClientConfigProductName`
- `@frontend/vanilla/features/content` – `PageMatrixComponent` (required dependency)
- `@angular/core` – Standard Angular APIs

**Dependencies**: Requires `PageMatrixComponent` from `@frontend/vanilla/features/content`

### Forbidden
- Other Casino libraries (`platform-lib`, `ui-lib`, `loader-lib`)
- Other product libraries (`@frontend/sports/*`, `@frontend/bingo/*`)
- Design System components (not needed for this wrapper)

**Rule**: This library is intentionally isolated. It bridges arcade lobby data to vanilla's page matrix renderer.

---

## 7. Testing Expectations

- **Framework**: Jest
- **Location**: `*.spec.ts` next to component
- **Focus**:
  - Path decoding logic (`decodeURI` transformation)
  - Product service integration
  - Input change detection
  - Template rendering with `@for` loop

**Rule**: Test the path decoding transformation and product detection. Mock `PageMatrixComponent` to isolate this component's behavior.

---

## 8. Known Gotchas

### Type Safety
- `@Input() seoboxes: any` lacks type safety. Consider defining an interface:
  ```typescript
  interface SeoBox {
    path: string;
    decodedPath?: string;
  }
  ```

### Input Mutation
- Component mutates input array by adding `decodedPath` property. This is acceptable but unconventional. Consider using `computed()` or `map()` for immutability.

### Change Detection
- Uses default change detection. Migrating to `OnPush` would require converting `seoboxes` to a signal.

### SSR Compatibility
- Component is SSR-safe (no browser APIs)
- `ProductService` must provide SSR-safe defaults

### Arcade-Specific
- This component is tightly coupled to arcade lobby. Do not reuse for other lobby types without refactoring.

**Rule**: When refactoring, prioritize type safety and immutability over backward compatibility.
