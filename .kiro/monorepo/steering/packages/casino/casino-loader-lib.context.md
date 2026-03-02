---
inclusion: fileMatch
fileMatchPattern: 'packages/casino/loader-lib/**/*'
---

# Casino Loader-Lib – Angular Library Context

## 1. Role & Scope

### Responsibility
- **Type**: Utility library (lazy loading orchestration)
- **Purpose**: Dynamic loading of Casino platform-lib modules and components for cross-product integration
- **Primary use case**: Loading Casino features into other products (Bingo, Promo) without static dependencies
- **Consumers**: Bingo entrypoint, Promo features, any product needing Casino components without bundling platform-lib

### Out of Scope
- Casino routing and Module Federation (owned by `entrypoint-lib`)
- Core Casino business logic (owned by `platform-lib`)
- Casino-specific UI components (owned by `ui-lib`)

---

## 2. Public API

- Barrel file: `src/public-api.ts`
- Main exports:
  - `CasinoPlatformLoaderService` - Orchestrates lazy loading of platform-lib services and components
  - `CasinoModuleLoadDirective` - Directive for dynamic component instantiation (`bgCasinoModuleLoad`)
  - `CasinoPlatformLoaderModule` - Legacy NgModule wrapper (deprecated pattern)
- Stability: **Stable** (used by Bingo and Promo products)

**Import Pattern**: Always use `@casinocore/loader` barrel export.

```typescript
// ✅ Correct
import { CasinoPlatformLoaderService } from '@casinocore/loader';

// ❌ Wrong
import { CasinoPlatformLoaderService } from '../../loader-lib/src/lib/casino-platform-loader.service';
```

---

## 3. Internal Structure

- `casino-platform-loader.service.ts` - Core lazy loading orchestration, service registry, component factory map
- `casino-module-load.directive.ts` - Dynamic component creation directive
- `services.ts` - Dynamic service map for lazy-loaded platform-lib services
- `casino-platform-loader.module.ts` - Legacy NgModule wrapper (avoid in new code)

**Placement Rule**: This library is minimal by design. New code should go in `platform-lib` or consuming products, not here.

---

## 4. Angular Patterns

### Service
- **Singleton**: `providedIn: 'root'` for `CasinoPlatformLoaderService`
- **State**: Uses `BehaviorSubject` for module load status (legacy pattern, predates signals)
- **Lazy loading**: Dynamic `import()` of `services.ts` triggers platform-lib initialization

### Directive
- **Standalone**: `CasinoModuleLoadDirective` is standalone
- **Lifecycle**: Uses `OnInit`, `OnChanges`, `OnDestroy` with `takeUntilDestroyed()`
- **Dynamic components**: Creates components via `ViewContainerRef.createComponent()`

### Component Factory Map
- Hardcoded `componentsMap` in service maps string names to component types
- Used by directive to resolve component factories at runtime

**Rule**: Match existing patterns. This library uses legacy patterns (BehaviorSubject, manual subscriptions) for backward compatibility.

---

## 5. Invariants & Contracts

### Loading Lifecycle
1. Consumer calls `loadCasinoPlatformModule(configs)` with initialization config
2. Service lazy-loads `services.ts` via dynamic `import()`
3. Service retrieves platform-lib services from injector using `dynamicServicesMap`
4. Service calls `onAppInitHandler.execute()` to bootstrap Casino
5. Service calls `casinoLobbyService.initiateCasinoLobby(params)` with config
6. Service emits `true` on `casinoModuleLoadedSubject`
7. Directive receives notification and creates components

### Configuration Contract
`loadCasinoPlatformModule(configs)` accepts:
- `disableProductLobbyDataFetch` - Skip full lobby data fetch
- `lobbyTypeMap` - Custom lobby type mappings
- `disableCasinoLocalStorage` - Disable IndexedDB caching
- `disableSlotracesCallsOnBootstrap` - Skip slot races initialization
- `isDisableLiveCasinoCalls` - Skip live casino API calls
- `isDisableJackpotCalls` - Skip jackpot API calls
- `targetOverlayLobby` - Lobby type for overlay mode
- `isLoadedFromPromo` - Flag for promo integration
- `isLoadedInGame` - Flag for in-game integration
- `bingoCoinEconomyInGame` - Bingo coin economy flag

### Component Factory Map
**Note**: This list may become outdated. Always check `casino-platform-loader.service.ts` for the current component map.

Available components (hardcoded in `componentsMap` as of last update):
- `RpFavWidgetWrapperComponent` - Favorites widget
- `CasinoGridOnLobbyTypeComponent` - Game grid
- `NavOnLobbyTypeComponent` - Navigation
- `GeolocationInstallerComponent` - Geo installer
- `NewsFeedV2WidgetComponent` - News feed
- `SlotRacesWidgetComponent` - Slot races
- `GamingStoriesPhase2WrapperComponent` - Gaming stories
- `TeaserOnLobbyTypeComponent` / `TeasersWrapperComponent` - Teasers
- `CasinocoreErrorHandlerComponent` - Error handler

**Rule**: Never modify the loading lifecycle or config contract without coordinating with Bingo and Promo teams.

---

## 6. Dependencies

### Allowed
- `@casinocore/platform/*` - Platform-lib services and components (lazy-loaded)
- `@frontend/vanilla/core` - `NativeAppService` for ODR detection
- `@angular/core` - Angular DI, lifecycle, component creation

### Forbidden
- Other product libraries (`@frontend/sports/*`, `@frontend/bingo/*`)
- Direct imports from `entrypoint-lib` or `ui-lib`
- Static imports from `platform-lib` (must use dynamic `import()`)

**Critical**: Platform-lib imports must be lazy-loaded via dynamic `import()` to avoid bundling Casino into consuming products.

---

## 7. Testing Expectations

- **Framework**: Jest
- **Location**: Co-located `*.spec.ts` files
- **Focus**: 
  - Lazy loading lifecycle (module load triggers service initialization)
  - Component factory resolution (directive creates correct components)
  - Configuration passing (configs flow to `casinoLobbyService.initiateCasinoLobby()`)
  - ODR detection (skip loading for ODR apps)

**Rule**: Test the orchestration logic, not the platform-lib services (those have their own tests).

---

## 8. Known Gotchas

### ODR App Detection Bug
**Status**: Known issue (requires investigation and tracking)

- Service checks `NativeAppService.applicationName` for `'casinowodr'` or `'sportswodr'`
- **Bug**: Logic uses `!isODR || !isSportsODR` which always evaluates to `true`
- Since `applicationName` can only be one value, one condition is always false, making the OR always true
- **Intended behavior**: Skip loading for ODR apps to avoid conflicts
- **Actual behavior**: Always loads, even in ODR apps
- **Fix**: Should be `!isODR && !isSportsODR` or `!(isODR || isSportsODR)`

### Legacy Patterns
- Uses `BehaviorSubject` instead of signals (predates Angular 16+)
- Uses manual subscriptions instead of `toSignal()` (backward compatibility)
- Includes NgModule wrapper (deprecated, avoid in new code)

### Cross-Product Integration
- Bingo uses this to load Casino favorites widget without bundling platform-lib
- Changes to `componentsMap` or service initialization affect Bingo and Promo
- Always coordinate breaking changes with consuming products

### Service Retrieval Timing
- Services are retrieved from injector AFTER dynamic `import()` completes
- Consumers must wait for `casinoModuleLoadedObservable` before accessing services
- Calling `getCasinoLobbyService()` before module loads returns `undefined`

### Directive Data Binding
- Directive uses `@Input('data')` to pass JSON data to dynamically created components
- Data is assigned via `Object.keys()` iteration, not Angular input binding
- Changes to `jsonData` trigger `ngOnChanges()` and re-assign properties
