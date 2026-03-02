---
inclusion: fileMatch
fileMatchPattern: ['packages/bingo/frontend-lib/**/*']
---

# Bingo Frontend Lib – Angular Library Context

## 1. Role & Scope

### Responsibility
- **Type:** Core business logic library (data-access + feature services)
- **Purpose:**
  - Core bingo services (manager, platform API, NPM integration, URL utilities)
  - Client configuration models and providers (15+ config types)
  - Bingo tournaments integration (slot races, tracking, state)
  - Game launching, ticket management, schedule services
  - IndexedDB storage for offline/caching capabilities
  - Shared utilities (helper services, event emitters, window refs)
- **Consumers:** `bingo/entrypoint-lib`, `bingo/ui-lib`, `bingo/lobby-lib`

### Out of scope
- UI components (belongs in `ui-lib`)
- Routing and guards (belongs in `entrypoint-lib`)
- Cross-product features (belongs in `vanilla/features`)
- Payment processing (belongs in `payments`)

---

## 2. Public API

**Barrel files:** `core/public-api.ts`, `bingo-tournaments/public-api.ts`

**Main exports:**
- **Services:** `BingoManagerService`, `BingoPlatformApiService`, `BingoTournamentsService`, `GameLaunchService`, `ScheduleService`, `TicketsResourceService`, `BingoStorageService`
- **Config models:** 15+ client config interfaces (bingo, casino, tournaments, features, etc.)
- **Utilities:** `BingoHelperService`, `BingoUrlUtilityService`, `EventEmitService`, `WindowRefService`
- **Components:** `ConfirmMessageComponent`, `CustomButtonComponent` (legacy DS enabler)

**Stability:** Stable (consumed by entrypoint-lib and ui-lib)

**Rule:** Import only from `@frontend/bingo/frontend-lib/core` or `@frontend/bingo/frontend-lib/bingo-tournaments`. Never deep import from `src/`.

---

## 3. Internal Structure

```
core/src/
├── bingo-manager/              # Core bingo manager service
├── bingo-platform-api/         # Platform API integration
├── bingo-npm-manager/          # NPM integration services
├── bingo-npm-params/           # NPM parameter models/services
├── bingo-tournaments/          # Tournament models/services
├── bingo-config-provider/      # Configuration provider
├── bingo-client-configs/       # Client config service
├── bingo-invoker-product/      # Product invoker service
├── bingo-url-utility/          # URL utility services
├── bingo-indexdb/              # IndexedDB storage
├── game-launch/                # Game launching services
├── schedule/                   # Schedule services
├── my-tickets/                 # Ticket resource services
├── client-config/              # 15+ config model files
├── on-app-init/                # App initialization handler
└── shared/                     # Shared components/services/pipes/directives
```

**Placement rule:** Services go in feature-named folders. Config models in `client-config/`. Shared utilities in `shared/`. Only create new folders for distinct service domains.

---

## 4. Angular Patterns

### Components
- **Mix of standalone and NgModule-based** (legacy components exist)
- **Change detection:** Default (legacy), OnPush for new components
- **New components:** Must be standalone with OnPush

### State
- **Services with BehaviorSubject** (dominant legacy pattern)
- **Signals** (preferred for new code, migration in progress)
- **Local state:** Use `signal()` for component-scoped state

### RxJS
- Use `pipe` + operators, avoid manual `subscribe` where possible
- Convert observables to signals with `toSignal()` in consuming components
- Clean up subscriptions with `takeUntilDestroyed()`

**Rule:** Match existing service patterns (BehaviorSubject) when extending legacy services. Use signals for new services.

---

## 5. Invariants & Contracts

### Data assumptions
- Client configuration is resolved before services initialize
- IndexedDB is available for storage operations (browser-only)
- NPM parameters are provided by platform integration
- Tournament data comes from slot races API

### Behavioral guarantees
- Services are singletons provided at root level
- Configuration services cache resolved configs
- Storage service handles IndexedDB failures gracefully
- Event emitter service broadcasts bingo-specific events

### Error handling
- API errors are logged and surfaced via notification service
- Storage failures fall back to in-memory state
- Configuration errors prevent app initialization (fail fast)

**Rule:** Don't change service contracts without updating all consumers in entrypoint-lib and ui-lib.

---

## 6. Dependencies

### Allowed
- `@frontend/vanilla/core` – Shared services (ProductService, TimerService, HttpClient wrappers)
- `@frontend/vanilla/ssr` – SSR utilities (PLATFORM, WINDOW, DOCUMENT tokens)
- `@frontend/vanilla/features/*` – Cross-product features (auth, notifications)
- `@frontend/design-system/*` – DS components (for shared components only)
- Angular core, common, router, forms

### Forbidden
- `@frontend/bingo/ui-lib` – UI library (creates circular dependency)
- `@frontend/bingo/entrypoint-lib` – Entrypoint library (creates circular dependency)
- `@frontend/casino/features/*` – Casino feature libraries
- Other product libraries (`sports`, `poker`, etc.)

**Rule:** Frontend-lib is a dependency of ui-lib and entrypoint-lib, never the reverse. If you need shared logic, add it here.

---

## 7. Testing Expectations

**Framework:** Karma (migrating to Jest)

**Location:** `*.spec.ts` co-located with source files

**Focus:**
- Service initialization and dependency injection
- API integration and error handling
- Configuration resolution and caching
- IndexedDB storage operations
- Tournament state management

**Rule:** Test public service methods and critical business logic. Mock external dependencies (HTTP, storage, platform APIs).

---

## 8. Known Gotchas

- **SSR compatibility** – This library runs on server. Use `WINDOW`, `DOCUMENT` injection tokens, never direct globals. IndexedDB operations must be browser-only.
- **Configuration dependencies** – Many services depend on resolved client config. Ensure `BingoConfigProviderService` initializes first.
- **IndexedDB async operations** – Storage service methods are async. Always handle promises/observables properly.
- **Legacy WindowRefService** – Provides `window` access. Migrate to `WINDOW` token from `@frontend/vanilla/ssr` for new code.
- **Tournament integration** – Slot races API has specific data contracts. Don't modify tournament models without backend coordination.
- **NPM parameter parsing** – NPM params come from URL query strings. Validate and sanitize before use.
- **Circular dependency risk** – Never import from ui-lib or entrypoint-lib. This library is their foundation.
