---
inclusion: fileMatch
fileMatchPattern: 'packages/casino/entrypoint-lib/**/*'
---

# Casino Entrypoint-Lib – Angular Library Context

## 1. Role & Scope

### Responsibility
- Type: **Entrypoint** (application shell, routing, Module Federation integration)
- Application entry point for Casino product with multi-lobby support
- Routing configuration for 15+ lobby types (casino, livecasino, arcade, gameshows, etc.)
- Module Federation integration with host app via product guards
- Lobby shell components and section wrappers

### Out of scope
- Game business logic (belongs in `platform-lib`)
- Casino-specific UI components (belongs in `ui-lib`)
- Game provider API clients (belongs in `providers-data-access`)
- Shared types (belongs in `type-utils`)

---

## 2. Public API

- Barrel file: `src/index.ts`
- Main exports:
  - `CASINO_ROUTES` - Main route configuration
  - `CasinoRoutesModule` - NgModule for standalone mode
- Stability: **Stable** (used by host app and standalone deployments)

**Rule:** Only `CASINO_ROUTES` is exported. All internal routes, components, and services are private to this library.

---

## 3. Internal Structure

Key directories:

- `casino.routes.ts` / `casino-internal.routes.ts` - Route definitions (ALL lobbies share internal routes)
- `route-guards.ts` - Product activation/deactivation guards for Module Federation
- `home-lobby-mod/` - Main lobby shell component
- `mod-casino/` - 30+ lobby section components (nav, games, jackpots, teasers, widgets)
- `sections/` - Shared sections (freespins, seoboxes, play-redirect)
- `host-app/` - Module Federation integration logic
- `bootstrap/` - App initialization services
- `shared/services/` - Entrypoint-specific services (lobby, API, freespins)

**Placement rule:** New lobby sections go in `mod-casino/`. New shared sections go in `sections/`. New route logic goes in route files.

---

## 4. Angular Patterns to Follow

- Components: **Standalone** components with lazy loading
- Change detection: **OnPush** for all new components
- State: **Signals** for reactive state, inject `ConfigProviderService` from `platform-lib` for feature flags
- RxJS: Use `toSignal()` instead of `async` pipe, always use `takeUntilDestroyed()`
- Routing: Lazy-load all feature routes, use `data: { authorized: true }` for protected routes

**Critical:** All lobbies share `CASINO_INTERNAL_ROUTES`. Changes to internal routes affect ALL 15+ lobby types.

---

## 5. Invariants & Contracts

- Route structure: All lobbies inherit `CASINO_INTERNAL_ROUTES` (/, /c/:categoryType, /game-info/:gameId, /launchng/:gameId, etc.)
- Module Federation: `casinoProductActivateGuard` registers Casino with host, `casinoProductDeactivateGuard` unregisters
- Authentication: Protected routes require `data: { authorized: true }`, public routes use `data: { allowAnonymous: true }`
- SSR compatibility: All components must be SSR-safe (no direct `window`/`document` access)

**Rule:** Never modify `CASINO_INTERNAL_ROUTES` without testing ALL lobby types. Never bypass authentication guards.

---

## 6. Dependencies

### Allowed
- `@casinocore/platform/*` - Core business logic, services, game management
- `@frontend/casino-ui/*` - Casino-specific UI components
- `@frontend/design-system/*` - DS components
- `@frontend/vanilla/core` - Shared services (auth, user, config)
- `@frontend/vanilla/features/*` - Cross-product features (public-page)
- `@angular/material` - Material components (dialog, etc.)

### Forbidden
- Other product entrypoints (`@frontend/sports/*`, `@frontend/bingo/*`)
- Direct imports from `platform-lib` internals (use public API)
- Legacy or deprecated packages

**Rule:** Always use TypeScript path aliases. Never use relative paths across package boundaries.

---

## 7. Testing Expectations

- Unit tests: **Jest**, co-located `*.spec.ts` files
- Focus: Route guards, component initialization, service integration
- Mock data: Use mocks from `platform-lib/mocks/`
- E2E: Playwright tests in `packages/casino/e2e/` cover lobby navigation and game launch flows

**Rule:** Test route guard logic and Module Federation integration. Test lobby component rendering with mocked services.

---

## 8. Known Gotchas

- **Multi-lobby routing:** All 15+ lobbies share `CASINO_INTERNAL_ROUTES`. A change to `/c/:categoryType` affects casino, livecasino, arcade, gameshows, etc.
- **Module Federation modes:** Casino runs in standalone mode (direct access) or host app mode (integrated). Test both modes.
- **SSR compatibility:** Components run on server. Use `WINDOW` token, `Renderer2`, and `afterNextRender()` for browser APIs.
- **ConfigProviderService:** Always inject from `@casinocore/platform/core` for feature flags and API paths.
- **Material Dialog:** Providers for `MatDialogRef` and `MAT_DIALOG_DATA` are included in `CasinoRoutesModule` for compatibility.
- **Lazy loading:** All sections use lazy loading. Never import section components directly in route files.

---

## See Also

- `casino-context.md` - Casino product patterns, state management, configuration
- `.kiro/steering/topics/angular-performance/` - OnPush, signals, change detection
- `.kiro/steering/topics/ssr/` - SSR-safe patterns
