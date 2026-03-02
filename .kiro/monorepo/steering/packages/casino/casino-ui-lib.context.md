---
inclusion: fileMatch
fileMatchPattern: 'packages/casino/ui-lib/**/*'
---

# Casino UI Library – Angular Library Context

## 1. Role & Scope

### Responsibility
- Type: UI library (presentational components)
- Casino-specific UI components that are NOT part of the Design System
- Game tiles, jackpot displays, casino-specific badges, CTAs, modals, and navigation pills
- Typical consumers: `casino/entrypoint-lib`, `casino/platform-lib` features

### Out of scope
- Design System components (use `@frontend/design-system/*` instead)
- Business logic or state management (belongs in `platform-lib/core`)
- API integration (belongs in `providers-data-access`)
- Generic cross-product UI (belongs in `@frontend/vanilla/shared/*`)

**Decision Rule**: If it's a reusable UI primitive, use Design System. If it's casino-specific presentation logic, it belongs here.

---

## 2. Public API

- Barrel file: `src/public-api.ts`
- Import path: `@frontend/casino-ui/{submodule}`
- Sub-modules with separate entry points:
  - `@frontend/casino-ui/jackpot-ribbon` - Jackpot display banner
  - `@frontend/casino-ui/onboarding` - User onboarding flows
  - `@frontend/casino-ui/geo-coordinator` - Geolocation installers
  - `@frontend/casino-ui/shared` - Shared constants, types, themes
- Main exports (from root):
  - Game tiles: `GameTileBlockComponent`, `TileFooterComponent`, `ImageLoaderComponent`
  - CTAs: `CsCTAComponent`, `CsIconCTAComponent`, `GametileCTAComponent`, `HyperlinkCTAComponent`
  - Icons: `ClassIconComponent`, `FavCTAComponent`, `ImageIconComponent`, `QuickInfoIconComponent`
  - UI elements: `BadgeComponent`, `ChevronComponent`, `NavPillComponent`, `TooltipComponent`, `ModalComponent`
  - Skeletons: `SkeletonComponent`, `TeaserSkeletonComponent`, `PlayAgainSkeletonComponent`
  - Wrappers: `ButtonWrapperDirective`, `ScrollbarWrapperDirective`, `AppearanceThemeModifierDirective`
- Stability: Stable (internal to Casino product)

**Rule**: Always import from barrel exports (`@frontend/casino-ui/{submodule}`), never deep imports.

---

## 3. Internal Structure

- `src/` - Main component library
  - `badges/` - Casino-specific badge components
  - `chevron/` - Chevron navigation indicators
  - `containers/` - Container description components
  - `cta/` - Call-to-action buttons (7 variants)
  - `game-tiles/` - Game tile components and layouts
  - `game-tile-footer-ticker/` - Animated footer tickers
  - `gift-cards/` - Gift card display components
  - `icons/` - Casino-specific icon components
  - `image/` - Image loading components and directives
  - `info-modal/` - Information modal dialogs
  - `modal/` - Generic modal wrapper
  - `nav-pill/` - Navigation pill components
  - `play-again/` - Play again feature components
  - `recommendations/` - Game recommendation cards
  - `skeleton/` - Loading skeleton states
  - `standout-game/` - Featured game displays
  - `tooltip/` - Tooltip components
  - `volatility-range/` - Volatility range indicators
  - `wrappers/` - Theme-aware wrapper directives
  - `utils/` - Shared utilities and models
- `jackpot-ribbon/` - Standalone jackpot ribbon module
- `onboarding/` - Standalone onboarding module
- `geo-coordinator/` - Standalone geolocation installer module
- `shared/` - Shared constants, types, themes
- `styles/` - SCSS variables, mixins, legacy shims

**Placement Rule**: Add new casino-specific UI components to `src/`. Create new sub-modules only for features with separate entry points.

---

## 4. Angular Patterns to Follow

- Components: Standalone components only (no NgModules)
- Change detection: OnPush for all components
- State: Use `signal()` for reactive state, `computed()` for derived values
- Inputs: Use `input()` and `input.required()` for component inputs
- Outputs: Use `output()` for component events
- Prefix: All component selectors use `cs-` prefix
- RxJS: Prefer `toSignal()` over `async` pipe, use `takeUntilDestroyed()` for subscriptions

**Rule**: Match OnPush + signals pattern. Never use default change detection or manual `ChangeDetectorRef` calls.

---

## 5. Invariants & Contracts

- Data assumptions:
  - Game tile components expect valid game IDs and image URLs
  - Jackpot components expect numeric values (formatted by pipes)
  - Theme wrappers expect valid theme configuration from `ConfigProviderService`
- Behavioral guarantees:
  - All components are SSR-compatible (no direct `window`/`document` access)
  - Image components use lazy loading by default
  - Skeleton components match the dimensions of their target components
- Error handling:
  - Invalid inputs log warnings but don't throw
  - Missing images fall back to placeholder states
  - Theme mismatches use default theme values

**Rule**: Never break SSR compatibility. Always provide fallback states for missing data.

---

## 6. Dependencies

### Allowed
- Internal: `@casinocore/platform/core` (for `ConfigProviderService`), `@casinocore/type-utils`
- Design System: `@frontend/design-system/*` (use DS components where appropriate)
- Vanilla: `@frontend/vanilla/core`, `@frontend/vanilla/shared/*`
- Angular: `@angular/common`, `@angular/core`, `@angular/cdk`
- External: `hammerjs` (touch gestures, imported in platform-lib)

### Forbidden
- Other product libraries (`@frontend/sports/*`, `@frontend/bingo/*`)
- Direct API calls (use services from `platform-lib` or `providers-data-access`)
- Global state management (state belongs in services, not UI components)

**Rule**: UI components should be presentation-only. Business logic belongs in `platform-lib`.

---

## 7. Testing Expectations

- Unit tests: Jest framework, co-located `*.spec.ts` files
- Focus areas:
  - Component rendering with various input combinations
  - Event emission and user interactions
  - Conditional rendering logic
  - Theme wrapper directive behavior
- Coverage: Test public API and critical rendering paths
- Mocking: Mock `ConfigProviderService` for theme-dependent components

**Rule**: Test component contracts (inputs/outputs), not implementation details.

---

## 8. Known Gotchas

- **SSR Compatibility**: All components run on server. Never access `window`, `document`, or browser APIs directly. Use `afterNextRender()` for browser-only code.
- **Theme Wrappers**: `ButtonWrapperDirective` and `ScrollbarWrapperDirective` apply theme-specific classes. Don't override these manually.
- **Image Loading**: `ImageLoaderComponent` and `BackgroundImageLoaderDirective` handle lazy loading. Don't bypass with direct `<img>` tags.
- **Jackpot Ribbon**: Uses `IncrementalTickingDirective` for animated value updates. Don't update values directly without the directive.
- **Nav Pills**: `NavPillComponent` wraps Design System `DsPill` with casino-specific styling. Prefer DS `DsPill` for new implementations.
- **Legacy Components**: Some components (badges, modals) predate Design System. Evaluate DS alternatives before extending these.
