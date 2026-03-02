---
inclusion: fileMatch
fileMatchPattern: ['packages/poker/core-lib/**/*']
---

# Poker Core-Lib Context

## 1. Role & Scope

### Responsibility
- Type: Multi-module feature library (widgets, promotions, client integration, utilities)
- Poker-specific reusable components, services, and features for poker-app
- Widget components (feeds, timers, tournaments, leaderboards, game features)
- Promotions infrastructure (50+ tournament/game type pages with routing and resolvers)
- Web client integration (poker game client, lobby, simulated hands)
- Core services (navigation, API integration, logging, configuration)

### Typical consumers
- `poker-app` (primary consumer)
- Other poker-core-lib feature modules (internal cross-module dependencies)

### Out of scope
- Cross-product features → Use `@frontend/vanilla`
- Generic UI components → Use `@frontend/design-system`
- Other product verticals → Separate packages

---

## 2. Public API

### Barrel exports structure
- Main: `src/public-api.ts` (framework, widgets, providers from `src/lib/`)
- Feature modules (each with own `public-api.ts`):
  - `core/` → `@pokercore/module/core`
  - `homepage/` → `@pokercore/module/homepage`
  - `poker-promotions/` → `@pokercore/module/poker-promotions`
  - `tournament-calendar/` → `@pokercore/module/tournament-calendar`
  - `hand-history/`, `logging/`, `mobile-banner/`, `poker-download/`, `poker-web-client/`, etc.

### Key exports
- Providers: `providePokerSrc()`, `providePokerAppBootstrap()`
- Widgets: `PokerTwitchFeedComponent`, `PpBlogFeedComponent`, `PokerMyGameComponent`
- Timers: `PokerSinglePromoTimerComponent`, `PokerDiscountTimerComponent`
- Services: Navigation, API, logging, modal, scroll utilities
- Routing modules for 50+ promotion pages

**Rule:** Always import from `@pokercore/module` or `@pokercore/module/{feature}` barrel exports. Never deep import from `src/lib/` or internal paths.

---

## 3. Internal Structure

### Root-level feature modules (with own `public-api.ts`)
- `core/` – Navigation, services, configuration, root providers
- `homepage/` – Homepage sections, teasers, blog, social feeds
- `poker-promotions/` – 50+ promotion pages (routing, resolvers, components)
- `tournament-calendar/` – Tournament calendar, filters, details
- `hand-history/` – Hand history viewer
- `poker-web-client/` – Web client integration (game, lobby, simulated hands)
- `logging/`, `mobile-banner/`, `poker-download/`, `leaderboard/`, etc.

### `src/lib/` structure (main barrel)
- `poker-framework.component.ts`, `poker-framework.feature.ts` – Root framework
- `root-services.module.ts` – Root-level service providers
- Feature folders (40+ widgets): `poker-{feature}/`, `pp-{feature}/`
- `shared-services/` – Cross-feature services
- `api/` – API integration
- `composite-container/` – Promotion wrappers
- `on-app-init/` – App initialization

### Placement rules
- **New widget** → `src/lib/poker-{name}/` or `src/lib/pp-{name}/` with component, service, bootstrap
- **Large feature domain** → Root-level folder with own `public-api.ts` (e.g., `my-feature/`)
- **Shared poker logic** → `src/lib/shared-services/`
- **API integration** → `src/lib/api/` or within feature folder

---

## 4. Angular Patterns

### Components
- Mix of NgModule-based (legacy) and standalone (new code)
- Change detection: Default (legacy), OnPush for new components
- Component prefix: `pl` (defined in `project.json`)

### State management
- RxJS `BehaviorSubject` + observables (dominant pattern)
- Services with `@Injectable({ providedIn: 'root' })` for shared state
- NgRx store available but rarely used

### RxJS patterns
- Bootstrap services return `Observable<void>` for lazy initialization
- Prefer `pipe` + operators over manual `subscribe` in components
- Use `TimerService` from `@frontend/vanilla/core` (SSR-safe)

### Async & lifecycle
- Use `TimerService` for all timers (never raw `setTimeout`/`setInterval`)
- Clean up subscriptions in `ngOnDestroy()` with `DestroyRef.onDestroy()`
- Use `moment-timezone` for timezone conversions

**Rule:** Match existing patterns in the feature you're modifying. New code should follow project standards (standalone, signals, OnPush) but poker-core-lib has legacy patterns.

---

## 5. Invariants & Contracts

### Data assumptions
- Bootstrap services must return `Observable<void>` for lazy initialization
- Resolvers provide data before route activation
- API responses follow poker backend contracts (coordinate changes with backend team)

### Behavioral guarantees
- Bootstrap services initialize widgets before rendering
- Timer components handle timezone conversions correctly
- Navigation services maintain state across route changes

### Error handling
- HTTP errors logged via logging service
- Bootstrap failures prevent widget rendering
- Resolver errors redirect to error pages

**Rule:** Don't change public API contracts without updating poker-app and all tests.

---

## 6. Dependencies

### Allowed monorepo dependencies
- `@frontend/vanilla/core` – Platform services, timers, utilities
- `@frontend/vanilla/features/*` – Cross-product features
- `@frontend/vanilla/shared/*` – Shared utilities
- `@frontend/design-system` – UI components
- `@frontend/themepark` – Theming

### Allowed third-party libraries
- UI/Animation: `@angular/material`, `primeng`, `gsap`, `pixi.js`
- Carousels: `@ngu/carousel`, `swiper`, `ngx-slider-v2`
- Data tables: `@swimlane/ngx-datatable`
- Date/Time: `moment`, `moment-timezone`
- Audio: `howler`
- Utilities: `lodash-es`, `hammerjs`

### Forbidden
- Other product packages (sports, casino, bingo, lottery, myaccount, promo)
- Circular dependencies within poker package

**Rule:** Prefer vanilla utilities over new third-party dependencies. Coordinate with poker team before adding dependencies.

---

## 7. Testing

### Unit tests
- Framework: Karma (legacy, migrating to Jest/Vitest)
- Location: `*.spec.ts` next to source files
- Config: `karma.conf.cjs`
- Run: `nx test poker-core-lib`
- Focus: Bootstrap services, API services, timer logic, widget rendering

**Rule:** Any public API change must include tests that would fail if behavior regresses.

---

## 8. Known Gotchas

### SSR compatibility
- Poker app runs with SSR. Never access `window`/`document` directly.
- Use `inject(WINDOW)`, `inject(DOCUMENT)`, or `PLATFORM.runOnBrowser()`.
- Use `TimerService` from `@frontend/vanilla/core` (SSR-safe).

### Heavy dependencies
- Poker uses many UI libraries (pixi.js, gsap, primeng). Be mindful of bundle size.

### Legacy patterns
- Some components use NgModules and manual subscriptions. New code should use standalone + signals + OnPush.

### Timer cleanup
- Always clean up timers in `ngOnDestroy()` using `DestroyRef.onDestroy()`.

### Theme-specific logic
- `pp-*` prefix indicates PartyPoker-specific features. Ensure new features work across all poker brands.

### Multiple barrel exports
- Check `tsconfig.base.json` for available import paths. Use `@pokercore/module/{feature}` for feature modules, `@pokercore/module` for main exports.
