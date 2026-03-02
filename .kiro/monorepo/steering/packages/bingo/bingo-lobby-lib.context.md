---
inclusion: fileMatch
fileMatchPattern: ['packages/bingo/lobby-lib/**/*']
---

# Bingo Lobby Lib – Angular Library Context

## 1. Role & Scope

### Responsibility
- **Type:** Utility library (bingo lobby loader)
- **Purpose:**
  - Bingo lobby iframe loading and initialization
  - Directive-based lobby integration for embedding bingo lobby in components
  - Service for managing lobby lifecycle and communication
- **Consumers:** `bingo/entrypoint-lib` (home page, lobby routes), `bingo/ui-lib` components

### Out of scope
- Bingo game logic (belongs in `frontend-lib`)
- Room scheduling and ticket purchasing (belongs in `ui-lib`)
- Routing and navigation (belongs in `entrypoint-lib`)

---

## 2. Public API

**Barrel file:** `src/public-api.ts`

**Main exports:**
- `BingoloaderService` – Core service for lobby iframe management
- `BingoloaderDirective` – Directive for embedding lobby in templates
- `BingoLobbyLoaderComponent` – Component wrapper for lobby iframe

**Stability:** Stable (used by entrypoint and UI components)

**Rule:** Import only from barrel exports. Never deep import from `src/lib/` internals.

---

## 3. Internal Structure

```
src/lib/
├── bingoloader.service.ts           # Core lobby loader service
├── bingoloader.directive.ts         # Directive for lobby embedding
└── bingo-lobby-loader/
    └── bingo-lobby-loader.component.ts  # Component wrapper
```

**Placement rule:** This library has a focused purpose. New lobby-related utilities go in `src/lib/`. If adding unrelated bingo features, use `ui-lib` or `frontend-lib` instead.

---

## 4. Angular Patterns

### Components
- **Legacy NgModule-based** (migration to standalone pending)
- **Change detection:** Default (legacy pattern)
- **New code:** Should be standalone with OnPush when refactoring

### State
- **Service-based** – `BingoloaderService` manages lobby state
- **No signals yet** – Legacy pattern using direct service methods

### RxJS
- Use `pipe` + operators for async operations
- Clean up subscriptions with `takeUntilDestroyed()` in components
- Avoid manual `subscribe` where possible

**Rule:** Match existing patterns in this library. When refactoring, migrate to standalone + OnPush + signals together.

---

## 5. Invariants & Contracts

### Data assumptions
- Lobby URL is provided by bingo configuration (from `ConfigResolver`)
- Iframe sandbox permissions are configured appropriately
- Parent-child communication uses `postMessage` API

### Behavioral guarantees
- Service initializes lobby iframe with correct URL and parameters
- Directive handles iframe lifecycle (mount, unmount, cleanup)
- Component provides container for lobby with proper styling

### Error handling
- Lobby load failures are logged but don't crash the app
- Missing configuration falls back to safe defaults
- Communication errors are caught and logged

**Rule:** Don't change iframe initialization logic without testing across all lobby integration points (home page, lobby routes).

---

## 6. Dependencies

### Allowed
- `@frontend/bingo/frontend-lib` – Bingo configuration and services
- `@frontend/vanilla/core` – Shared utilities (TimerService, WINDOW token)
- `@frontend/vanilla/ssr` – SSR-safe platform abstractions
- `@angular/core`, `@angular/common` – Core Angular APIs

### Forbidden
- `@frontend/casino/*` – Casino-specific code
- `@frontend/sports/*` – Sports-specific code
- Other product libraries

**Rule:** Lobby loader is bingo-specific. If you need cross-product iframe utilities, create them in `vanilla/features` instead.

---

## 7. Testing Expectations

**Framework:** Karma (migration to Jest pending)

**Location:** `*.spec.ts` co-located with source files

**Focus:**
- Service initialization and iframe management
- Directive lifecycle (attach, detach, cleanup)
- Component rendering and iframe embedding
- Error handling for missing configuration

**Rule:** Test iframe lifecycle thoroughly. Lobby loading is critical for bingo user experience.

---

## 8. Known Gotchas

- **SSR compatibility** – Lobby uses iframes which don't exist on server. Always guard iframe access with platform checks or use `afterNextRender()`
- **Iframe communication** – `postMessage` requires proper origin validation. Never trust messages without verification
- **Cleanup critical** – Iframes must be properly destroyed to prevent memory leaks. Always clean up in `ngOnDestroy`
- **Configuration dependency** – Lobby URL comes from `ConfigResolver`. Ensure configuration is loaded before initializing lobby
- **Legacy code** – This library uses older patterns (NgModules, default change detection). When refactoring, migrate all patterns together, not piecemeal
- **Prefix `bgll`** – Component selector prefix is `bgll` (bingo lobby lib), not the standard `bg` prefix
