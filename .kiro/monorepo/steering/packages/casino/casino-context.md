---
inclusion: fileMatch
fileMatchPattern: 'packages/casino/**/*'
---

# Casino – Project Context

## Purpose & Domain Scope

### What Casino owns
- Multi-lobby casino platform (slots, live casino, arcade, game shows, specialty games)
- Game browsing, filtering, search, and launch flows
- Progressive jackpot tracking and display
- Player favorites and free spins management
- Category-based game organization (roulette, blackjack, etc.)
- Game provider API integration

### What Casino does NOT own
- Authentication/login flows (owned by Vanilla)
- Payment/cashier flows (owned by Payments)
- Promotions/offers (owned by Promo)
- Global navigation/header/footer (owned by Vanilla or Host App)
- Design System components (owned by Design System)

**Decision Rule**: If it's game-related or lobby-specific, it belongs in Casino. If it's cross-product or user account-related, it belongs elsewhere.

---

## Code Locations & Library Structure

### Seven Core Libraries

**1. entrypoint-lib** (`@frontend/casino/entrypoint-lib`)
- Location: `packages/casino/entrypoint-lib/`
- Purpose: Application entry, routing, Module Federation integration, lobby shells
- Key files: `casino.routes.ts`, `casino-internal.routes.ts`, `home-lobby-mod/`

**2. platform-lib** (`@casinocore/platform/{submodule}`)
- Location: `packages/casino/platform-lib/`
- Purpose: Core business logic, 40+ feature modules, game management
- Sub-modules: `core/`, `jackpot-widgets/`, `immersive-lobby/`, `slot-races/`, `teasers/`
- Key services: `CasinoLobbyService`, `ConfigProviderService`, `CasinoCoreGamelaunchService`

**3. ui-lib** (`@frontend/casino-ui/{submodule}`)
- Location: `packages/casino/ui-lib/`
- Purpose: Casino-specific UI components (NOT Design System)
- Sub-modules: `jackpot-ribbon/`, `onboarding/`, `geo-coordinator/`

**4. providers-data-access** (`@frontend/casino/providers-data-access`)
- Location: `packages/casino/providers-data-access/`
- Purpose: External game provider API clients

**5. loader-lib** (`@casinocore/loader`)
- Location: `packages/casino/loader-lib/`
- Purpose: Loading states and transitions

**6. arcade-seoboxes** (`@frontend/casino/arcade-seoboxes`)
- Location: `packages/casino/arcade-seoboxes/`
- Purpose: SEO-optimized content for arcade lobby

**7. type-utils** (`@casinocore/type-utils`)
- Location: `packages/casino/type-utils/`
- Purpose: Shared TypeScript types (no runtime dependencies)

### Import Pattern Rules

Always use TypeScript path aliases. Never use relative paths across package boundaries.

```typescript
// ✅ Correct
import { CasinoLobbyService } from '@casinocore/platform/core';
import { JackpotRibbonComponent } from '@frontend/casino-ui/jackpot-ribbon';
import { CASINO_ROUTES } from '@frontend/casino/entrypoint-lib';

// ❌ Wrong
import { CasinoLobbyService } from '../../platform-lib/core/casino-lobby.service';
```

---

## Routing & URL Patterns

### Base Routes (Multiple Entry Points)

- `/{culture}/casino/*` - Main casino lobby
- `/{culture}/games/*` - Alternative casino entry
- `/{culture}/slots/*` - Slots-focused (German labels)
- `/{culture}/spins/*` - Gala-specific entry
- `/{culture}/dice/*` - Dice-specific entry

### Internal Routes (CASINO_INTERNAL_ROUTES)

All lobbies share these sub-routes:

- `/` - Home lobby (public)
- `/c/:categoryType` - Category view (public)
- `/game-info/:gameId` - Game details (public)
- `/launchng/:gameId` - Game launch (authenticated)
- `/g/:globaljackpotpath` - Global jackpot page (public)
- `/myfreespins/history` - Free spins history (authenticated)

### Lobby-Specific Routes

Each lobby inherits internal routes:
- `/casino/livecasino/c/roulette`
- `/casino/arcade/game-info/12345`
- `/casino/gameshows/launchng/67890`

### Routing Rules

- Use lazy-loaded standalone route configs
- All lobbies share `CASINO_INTERNAL_ROUTES` - changes affect ALL lobbies
- Protected routes require `data: { authorized: true }`
- Public routes use `data: { allowAnonymous: true }`
- No direct cross-product routing

---

## Dependencies & Boundaries

### Allowed Dependencies

- `@frontend/design-system/*` - DS components
- `@frontend/vanilla/core` - Shared services (auth, user, config)
- `@frontend/vanilla/features/*` - Cross-product features
- `@frontend/vanilla/shared/*` - Shared utilities
- `@angular/material` - Material components (entrypoint only)
- `hammerjs` - Touch gestures (platform-lib only)

### Forbidden Dependencies

- Other product feature libs (`@frontend/sports/*`, `@frontend/bingo/*`)
- Direct imports from other products' internal modules
- Legacy or deprecated packages outside Casino

### Boundary Guidelines

- Casino exports public APIs via `public-api.ts` or `index.ts`
- Never re-export private modules from external projects
- Never bypass public APIs with direct file imports

---

## State Management & Data Flow

### Service-Based State with Signals

Casino uses service-based state management:

- **CasinoLobbyService** - Lobby state, game lists, categories
- **ConfigProviderService** - Feature flags, API paths, runtime config
- **CasinoCoreGamelaunchService** - Game launch logic
- **JackpotService** - Jackpot data and updates
- **FavouriteService** - User favorites

### Data Flow Pattern

```
API → ConfigProviderService → Feature Services → Components
     ↓
  CasinoLobbyService (game data)
     ↓
  CasinoCoreGamelaunchService (launch logic)
     ↓
  Component (UI with signals)
```

### State Rules

- Use `signal()` for reactive state, `computed()` for derived state
- Never use `async` pipe - use `toSignal()` instead
- API state lives in services, not components
- Always inject `ConfigProviderService` for feature flags
- Enable SSR caching with `transferCache: true` on HTTP requests

---

## Configuration & Feature Flags

### ConfigProviderService (Central Configuration)

Always inject `ConfigProviderService` to access configuration:

```typescript
import { ConfigProviderService } from '@casinocore/platform/core';

export class MyComponent {
  private readonly configProvider = inject(ConfigProviderService);
  
  ngOnInit() {
    const features = this.configProvider.provideFeaturesConfig();
    const apiPaths = this.configProvider.provideApiPathsConfig();
    const casinoConfig = this.configProvider.provideCasinoConfig();
  }
}
```

### Feature Flag Pattern

Always check feature flags before implementing conditional features. Provide fallback values for SSR compatibility.

```typescript
const features = this.configProvider.provideFeaturesConfig();
if (features.enableImmersiveLobby ?? false) {
  this.loadImmersiveLobby();
}
```

### Dynacon Access (SSR-Safe)

Always use optional chaining and nullish coalescing:

```typescript
const brand = window.clientConfig?.vnAppInfo?.brand ?? '';
const culture = window.clientConfig?.vnPage?.culture ?? 'en';
const workflowType = window.clientConfig?.vnClaims?.['http://api.bwin.com/v3/user/workflowtype'] ?? '0';
```

---

## Design System Integration

### UI Component Rules

- Use Design System components for all standard UI elements
- Apply `inverse="true"` for dark backgrounds
- Use semantic tokens for application styling
- Never override DS component CSS

### Casino-Specific Components (NOT Design System)

These components are Casino-specific and should NOT be migrated to DS:

- `JackpotRibbonComponent` - Jackpot display banner
- `OnboardingComponent` - User onboarding flows
- `DesktopInstallerComponent` / `MobileInstallerComponent` - Geolocation installers

**Reason**: These are domain-specific business components, not reusable UI primitives.

---

## Authentication & Access Control

### Two Access Levels

**Public (anonymous users)**:
- Browse lobbies, view game details, see jackpots
- Routes: `data: { allowAnonymous: true }`

**Authenticated (logged-in users)**:
- Launch games, manage favorites, access free spins
- Routes: `data: { authorized: true }`

### Game Launch Pattern

Always check authentication before launching games:

```typescript
import { UserService } from '@frontend/vanilla/core';
import { CasinoCoreGamelaunchService } from '@casinocore/platform/core';

export class GameComponent {
  private readonly user = inject(UserService);
  private readonly gameLaunch = inject(CasinoCoreGamelaunchService);
  
  launchGame(gameId: string) {
    if (!this.user.isAuthenticated) {
      // Redirect to login
      return;
    }
    this.gameLaunch.launch(gameId);
  }
}
```

**Critical**: Never bypass authentication checks for protected game launches.

---

## Module Federation Integration

### Two Operating Modes

**Standalone Mode**:
- Entry: `/{culture}/casino/` routes directly to Casino
- Bootstrap: `CasinoRoutesModule` handles routing, auth, layout
- Use for: Direct access, independent deployment

**Module Federation Mode (Host App)**:
- Entry: Host routes via `casinoProductActivateGuard`
- Integration: Shared auth, layout, navigation from host
- Use for: Integrated multi-product experience

### Mode Detection

Always check which mode is active via route guards:
- `casinoProductActivateGuard` - Registers Casino with host
- `casinoProductDeactivateGuard` - Unregisters Casino from host

---

## Testing Strategy

### Unit Testing

- Framework: Jest
- Location: Co-located with source files (`*.spec.ts`)
- Pattern: Test services, components, utilities in isolation
- Mock data: `packages/casino/platform-lib/mocks/`

### E2E Testing

- Framework: Playwright
- Location: `packages/casino/e2e/`
- Core flows:
  - Browse lobbies (public)
  - Launch games (authenticated)
  - Manage favorites (authenticated)
  - View jackpots (public)

---

## Known Gotchas & FAQ

### Platform-Lib Complexity

Platform-lib contains 40+ sub-modules. Always check `public-api.ts` for available exports before creating new services.

### Multi-Lobby Routing

All lobbies share `CASINO_INTERNAL_ROUTES`. Changes to internal routes affect ALL lobbies. Test thoroughly across all lobby types.

### Game Launch Authentication

Game launches require authentication. Always check `UserService.isAuthenticated` before calling `CasinoCoreGamelaunchService`.

### IndexedDB Caching

Casino uses IndexedDB for game data caching. Always handle cache invalidation when game data changes.

### Hammerjs Global Side Effect

Platform-lib imports `hammerjs` for touch gestures. This is a global side effect - do not remove.

### When to Create New Feature vs Extend Existing

- **New feature**: If it's a new lobby type, game category, or standalone feature
- **Extend existing**: If it's a variation of existing lobby behavior or game display

### Where Shared Models/Helpers Belong

- Casino-specific: `packages/casino/type-utils/` or `packages/casino/platform-lib/core/`
- Cross-product: `packages/vanilla/lib/core/` or `packages/vanilla/shared/`

---

## See Also

- `.kiro/steering/topics/angular-performance/` - OnPush, signals, change detection
- `.kiro/steering/topics/ssr/` - SSR-safe patterns, browser API access
- `.kiro/steering/topics/design-system/` - DS component usage
- `.kiro/steering/04-monorepo-and-packages.md` - Nx workspace structure
- `.kiro/steering/01-project-context.md` - Overall monorepo context
