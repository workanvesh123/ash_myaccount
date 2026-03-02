---
inclusion: fileMatch
fileMatchPattern: ['packages/bingo/entrypoint-lib/**/*']
---

# Bingo Entrypoint Lib – Angular Library Context

## 1. Role & Scope

### Responsibility
- **Type:** Entrypoint library (app shell)
- **Purpose:**
  - Routing configuration and route guards for all bingo features
  - Main layout components (navigation, home, main shell)
  - Bootstrap services for bingo product initialization
  - Casino integration components (side pane, category views, game launchers)
  - Legacy redirect handlers for backward compatibility
- **Consumers:** Host app (gantry-app) via Module Federation, bingo standalone app

### Out of scope
- Bingo business logic (belongs in `frontend-lib`)
- Reusable bingo UI components (belongs in `ui-lib`)
- Shared cross-product features (belongs in `vanilla/features`)

---

## 2. Public API

**Barrel file:** `src/public-api.ts`

**Main exports:**
- `HtmlBootstrapService` – SSR-safe HTML bootstrap service
- `APP_ROUTES` – Internal app routes configuration
- `BINGO_ROUTES` – Public bingo routes for host app integration

**Stability:** Stable (consumed by host app and bingo standalone)

**Rule:** Host app must import only from barrel exports. Internal route components are not part of the public API.

---

## 3. Internal Structure

```
src/lib/
├── app.routes.ts                    # Internal app routes
├── bingo.routes.ts                  # Public routes export
├── bingo-internal.routes.ts         # Internal route definitions
├── route.guard.ts                   # Route guards
├── host-app-provide.ts              # Host app providers
├── Bootstrap/                       # Bootstrap services
├── host-app/                        # Host app integration
├── resolver/                        # ConfigResolver (runs on all routes)
├── main/                            # Main shell component
├── home/                            # Home page component
├── navigation/                      # Navigation components
├── rooms/                           # Rooms list route component
├── my-favourite/                    # Favorites route component
├── search/                          # Search route component
├── casino-games-lobby/              # Casino lobby integration
├── casino-category/                 # Casino category view
├── casino-side-pane/                # Casino side pane
├── game-Iframe-launcher/            # Game iframe launcher
├── force-redirect/                  # Legacy redirect handlers
├── teasers/                         # Teaser components
├── promotions-banner/               # Promotions banner
├── playing-now/                     # Playing now widget
├── parallax-animation/              # Parallax effects
├── seoboxes/                        # SEO content boxes
├── BingoWidget/                     # Bingo widget component
├── html/                            # HTML bootstrap
├── client-config/                   # Client config models
└── models/                          # Shared models
```

**Placement rule:** Route components live in feature-named folders. Shared services go in appropriately named folders. Only create new folders for distinct routing features.

---

## 4. Angular Patterns

### Components
- **Mix of standalone and NgModule-based** (migration in progress)
- **Change detection:** Default (legacy), OnPush for new components
- **New components:** Must be standalone with OnPush

### State
- **Services with signals** (preferred for new code)
- **BehaviorSubject** (legacy pattern, being migrated)
- **Local component state** via `signal()`

### RxJS
- Use `pipe` + operators, avoid manual `subscribe` in components
- Convert observables to signals with `toSignal()` in components
- Clean up subscriptions with `takeUntilDestroyed()`

### Routing
- All routes use lazy loading
- `ConfigResolver` runs on every route (ensure caching)
- Guards: `AuthGuard`, `PrebuyGuard`, `TournamentsGuard`
- Use `routeData({ allowAnonymous: true })` for public routes

**Rule:** New route components must be standalone. Match existing patterns for route configuration (see `bingo-internal.routes.ts`).

---

## 5. Invariants & Contracts

### Data assumptions
- `ConfigResolver` provides bingo configuration on all routes
- Casino integration expects iframe-based game launching
- Navigation service expects room data from `frontend-lib`

### Behavioral guarantees
- Routes are lazy-loaded for performance
- Guards prevent unauthorized access to protected features
- Legacy redirects maintain backward compatibility

### Error handling
- Route guards redirect to appropriate fallback routes
- Bootstrap failures are logged but don't block app initialization
- Game launch errors are surfaced via notification service

**Rule:** Don't change route structure or guard behavior without coordinating with host app and backend teams.

---

## 6. Dependencies

### Allowed
- `@frontend/bingo/frontend-lib` – Core bingo services and state
- `@frontend/bingo/ui-lib` – Bingo UI components
- `@frontend/bingo/loader-lib` – Game loader utilities
- `@frontend/design-system/*` – DS components
- `@frontend/vanilla/core` – Shared services (ProductService, TimerService)
- `@frontend/vanilla/features/*` – Cross-product features (auth, navigation)
- `@frontend/vanilla/ssr` – SSR utilities

### Forbidden
- `@frontend/casino/features/*` – Casino feature libraries (use iframe launchers)
- `@frontend/sports/*` – Sports-specific code
- `@frontend/poker/*` – Poker-specific code
- Other product internal libraries

**Rule:** Casino integration must use iframe launchers, never direct component imports. If you need shared bingo logic, add it to `frontend-lib`.

---

## 7. Testing Expectations

**Framework:** Jest (migrating from Karma)

**Location:** `*.spec.ts` co-located with source files

**Focus:**
- Route configuration and guard behavior
- Bootstrap service initialization
- Resolver logic (ConfigResolver)
- Navigation component interactions

**Rule:** Route changes must include tests verifying guard behavior and lazy loading. Bootstrap changes must verify SSR compatibility.

---

## 8. Known Gotchas

- **ConfigResolver runs on every route** – Ensure configuration is cached to avoid redundant API calls
- **Multiple ball-type routes** – Schedule and rooms have duplicate route definitions for each ball variant (legacy pattern)
- **SSR compatibility** – This library runs on server, avoid direct `window`/`document` access (use injection tokens)
- **Casino iframe launchers** – Game launches use iframes, not direct component rendering
- **Legacy redirects** – Force redirect routes (`/forcedgamelaunch`, `/forcedprebuy`, `/forcedfavourite`) must be maintained for backward compatibility
- **Host app integration** – Changes to public exports (`BINGO_ROUTES`, `HtmlBootstrapService`) require coordination with host app team
- **Guard dependencies** – `PrebuyGuard` and `TournamentsGuard` have complex logic, test thoroughly when modifying routes

---

## Quick Reference

**Adding a new route:**
1. Add route definition to `bingo-internal.routes.ts`
2. Create route component in appropriately named folder
3. Add guards if authentication/authorization required
4. Update tests to verify route configuration
5. Ensure component is standalone with OnPush

**Modifying navigation:**
1. Update components in `navigation/` folder
2. Coordinate with `frontend-lib` if state changes needed
3. Test keyboard navigation and accessibility

**Casino integration:**
1. Use `game-Iframe-launcher/` for game launches
2. Never import casino feature libraries directly
3. Use `casino-side-pane/` for side panel integration
