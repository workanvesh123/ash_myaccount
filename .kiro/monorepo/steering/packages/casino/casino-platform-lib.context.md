---
inclusion: fileMatch
fileMatchPattern: 'packages/casino/platform-lib/**/*'
---

# Casino Platform-Lib – Angular Library Context

## Role & Scope

### Responsibility
- **Type**: Feature library (40+ sub-modules)
- **Purpose**: Core Casino business logic, game management, lobby features, jackpot tracking
- **Consumers**: `casino/entrypoint-lib`, `casino/ui-lib`, lobby components

### Key Responsibilities
- Game data management and caching (IndexedDB)
- Game launch orchestration via `CasinoCoreGamelaunchService`
- Lobby state management via `CasinoLobbyService`
- Configuration and feature flags via `ConfigProviderService`
- Jackpot tracking, slot races, gaming stories, teasers
- Live casino features, immersive lobbies, game show hubs

### Out of Scope
- Routing and Module Federation (owned by `entrypoint-lib`)
- Casino-specific UI components (owned by `ui-lib`)
- Game provider API clients (owned by `providers-data-access`)

---

## Public API & Import Patterns

### Barrel Exports
- **Core module**: `@casinocore/platform/core` (main services, models, components)
- **Feature modules**: `@casinocore/platform/{feature}` (e.g., `jackpot-widgets`, `slot-races`, `teasers`)

### Key Exports from Core
- **Services**: `CasinoLobbyService`, `ConfigProviderService`, `CasinoCoreGamelaunchService`, `JackpotService`, `FavouriteService`
- **Components**: `GameDetailComponent`, `EmbeddedGameViewComponent`, `ToasterMsgComponent`
- **Models**: Game models, lobby models, jackpot models, launch models
- **Utilities**: URL utilities, tracking adapters, pipes

**Rule**: Always import from `@casinocore/platform/{module}` barrel exports. Never use relative paths or deep imports into sub-folders.

```typescript
// ✅ Correct
import { CasinoLobbyService, ConfigProviderService } from '@casinocore/platform/core';
import { JackpotWidgetComponent } from '@casinocore/platform/jackpot-widgets';

// ❌ Wrong
import { CasinoLobbyService } from '../../platform-lib/core/casino-lobby-manager/casino-lobby.service';
```

---

## Internal Structure

### Core Module (`core/`)
- `casino-lobby-manager/` - Lobby state, game lists, categories
- `config-provider/` - Feature flags, API paths, runtime config
- `shared/` - 60+ services (game launch, favorites, jackpots, tracking, utilities)
- `components/` - Reusable Casino components
- `directives/` - Custom directives (intersection observer, draggable, long-press)
- `platform-api/` - API client service
- `store/` - Teaser state management
- `tracking/` - Analytics and tracking adapters
- `utilities/` - URL utilities, helpers

### Feature Modules (40+ sub-modules)
- `jackpot-widgets/` - Jackpot display components
- `immersive-lobby/` - Immersive lobby experience
- `slot-races/` - Slot race tournaments
- `gaming-stories/` - Instagram-style stories
- `teasers/` - Promotional teasers
- `livecasino/` - Live casino features
- `game-show-hub/` - Game show lobby
- And 30+ more specialized features

**Placement Rule**: Add new services to `core/shared/`, new components to `core/components/`, or create a new feature module if it's a standalone lobby feature.

---

## Angular Patterns

### Components
- **Standalone components only** (no NgModules)
- **Change detection**: `OnPush` for all new components
- **State**: Use signals for reactive state, `computed()` for derived state
- **Never use `async` pipe** - use `toSignal()` instead

### Services
- **State management**: Service-based with signals
- **Configuration**: Always inject `ConfigProviderService` for feature flags
- **Game launch**: Always use `CasinoCoreGamelaunchService` for launching games
- **Caching**: Use `CacheManagerService` for IndexedDB operations

### RxJS
- Use `pipe` with operators, avoid manual `subscribe` in components
- Use `take(1)` for single-value subscriptions (never `first()` in SSR)
- Use `takeUntilDestroyed()` for cleanup

---

## Critical Invariants

### Configuration Access
- **Always** inject `ConfigProviderService` to access feature flags and API paths
- **Always** provide fallback values for SSR compatibility: `features.enableX ?? false`
- **Never** access `window.clientConfig` directly without optional chaining

### Game Launch Flow
- **Always** check authentication before launching games via `UserService.isAuthenticated`
- **Always** use `CasinoCoreGamelaunchService.launch()` - never construct launch URLs manually
- **Never** bypass authentication checks for protected game launches

### IndexedDB Caching
- Game data is cached in IndexedDB via `CacheManagerService`
- Cache invalidation happens automatically on data updates
- **Always** handle cache misses gracefully with API fallback

### Hammerjs Side Effect
- `core/public-api.ts` imports `hammerjs` for touch gestures
- This is a **global side effect** - do not remove
- Required for swipe gestures in carousels and game tiles

---

## Dependencies

### Allowed
- `@frontend/design-system/*` - DS components
- `@frontend/vanilla/core` - Shared services (auth, user, config, timers)
- `@frontend/vanilla/features/*` - Cross-product features
- `@frontend/vanilla/shared/*` - Shared utilities
- `@casinocore/type-utils` - Shared TypeScript types
- `hammerjs` - Touch gesture library (core only)

### Forbidden
- Other product libraries (`@frontend/sports/*`, `@frontend/bingo/*`)
- Direct imports from `entrypoint-lib` or `ui-lib`
- Legacy or deprecated packages

---

## Testing

### Unit Tests
- **Framework**: Jest
- **Location**: Co-located `*.spec.ts` files
- **Focus**: Service logic, game launch flows, configuration handling, state management
- **Mocks**: Use `packages/casino/platform-lib/mocks/` for test data

### Test Coverage Priorities
1. Game launch authentication checks
2. Configuration service feature flag logic
3. Lobby service game filtering and sorting
4. Jackpot service data updates
5. Cache manager IndexedDB operations

**Rule**: Any change to public service APIs must have corresponding test coverage.

---

## Known Gotchas

### 40+ Sub-Modules
Platform-lib is massive with 40+ feature modules. Always check `core/public-api.ts` before creating new services - it likely already exists.

### SSR Compatibility
- Runs on server - avoid direct `window`/`document` access
- Use `WINDOW` injection token from `@frontend/vanilla/core`
- Use `afterNextRender()` for browser-only initialization
- Always provide SSR-safe fallbacks for feature flags

### Configuration Timing
- `ConfigProviderService` data may be undefined initially during SSR
- Always use optional chaining: `config?.feature ?? defaultValue`
- Never assume configuration is immediately available

### IndexedDB Performance
- IndexedDB operations are async - always handle promises
- Cache reads happen on lobby load - avoid blocking UI
- Cache writes happen in background - don't await unless critical

### Multi-Lobby Impact
Changes to core services affect ALL Casino lobbies (slots, live casino, arcade, game shows). Test thoroughly across lobby types before deploying.
