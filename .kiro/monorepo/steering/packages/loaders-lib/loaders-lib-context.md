---
inclusion: fileMatch
fileMatchPattern: ['packages/loaders-lib/**/*']
---

# Loaders Library – Context

## 1. Role & Scope

### What this library does
- **Dynamic feature loading orchestration**: Manages lazy loading of vanilla features based on configurable strategies (preload, login, events, document ready)
- **Strategy-based execution**: Coordinates when features load using strategies like `Preload`, `JustLoggedIn`, `AlreadyLoggedIn`, `Complete`, and `Event`
- **Style injection management**: Handles dynamic CSS loading for features (themes, external URLs, inline content)
- **SSR-aware preloading**: Tracks server-side loader usage and preloads those features on client hydration
- **Event-driven loading**: Responds to Vanilla, RTMS, and Native app events to trigger feature loading

### What this library does NOT do
- Does not contain feature implementations (those live in `@frontend/vanilla/features/*`)
- Does not handle routing or navigation (that's in product entrypoints)
- Does not manage authentication logic (uses `UserService` from `@frontend/vanilla/core`)
- Does not provide UI components (pure orchestration layer)

**Decision rule:**  
If the change is about **when/how features load**, it belongs here.  
If it's about **what a feature does**, it belongs in the feature library itself.

---

## 2. Public API & Intended Consumers

### Public surface
- Main barrel: `packages/loaders-lib/public_api.ts`
- Public exports:
  - `provideLoaders()` – Provider function to register loader system
  - `registerLoaderFn()` – Register custom loader functions
  - `LoaderFnConfig` – Type for loader function configuration
  - `LoadOptions`, `StyleOptions` – Configuration types
  - `LoaderStylesService` – Service for dynamic style injection

### Who is allowed to import this library
- ✅ Allowed:
  - Host applications (`packages/host-app`)
  - Product entrypoints (`packages/*/entrypoint-lib`)
  - Feature libraries registering custom loaders
- ❌ Not allowed:
  - Individual feature libraries (they are loaded BY this system, not consumers of it)
  - Backend services
  - Other products directly

**Rule:**  
Always import from `@frontend/loaders`, never from internal paths like `@frontend/loaders/src/loader.service`.

---

## 3. Internal Structure & Where to Put New Code

### Directory layout
- `src/` – All implementation files (flat structure)
  - `loader.service.ts` – Core orchestration logic
  - `loaders-bootstrap.service.ts` – Initialization hook
  - `loader-styles.service.ts` – Dynamic CSS injection
  - `module.service.ts` – Feature bootstrapping
  - `loaders.models.ts` – Types and tokens
  - `loaders.client-config.ts` – Configuration schema
  - `loaders-map.ts` – Registry of vanilla feature loaders
  - `loaders.feature.ts` – Provider function

### Placement rules
- **New load strategies**: Extend `LoadStrategy` enum in `loaders.models.ts`
- **New style injection logic**: Modify `loader-styles.service.ts`
- **New event sources**: Add subscriptions in `LoaderService.init()`
- **New vanilla feature registrations**: Update `loaders-map.ts`

**If unsure:**  
This library has a flat structure. New files should only be created for entirely new subsystems (e.g., a new style loading mechanism).

---

## 4. Extension Patterns

### When adding new functionality
- **RxJS-based**: All async flows use observables with `takeUntilDestroyed()`
- **Injector-based feature loading**: Features are loaded via dynamic imports and injector creation
- **DSL-driven conditions**: Feature enablement uses DSL expressions evaluated by `DslService`
- **Event-driven architecture**: Subscribes to multiple event streams (Vanilla, RTMS, Native)

### Checklist for new code
- [ ] Does not block server rendering (use `PLATFORM.runOnBrowser()` for browser-only logic)
- [ ] Cleans up subscriptions with `takeUntilDestroyed()`
- [ ] Uses `Logger` for debugging (not `console.log`)
- [ ] Evaluates DSL conditions via `DslService.evaluateExpression()`
- [ ] Registers loader usage on server for SSR preloading
- [ ] Handles product-specific loading via `ProductService.isSingleDomainApp` check

---

## 5. Invariants & Contracts

### Business invariants
- **Load strategies execute in order**: `Preload` → `AlreadyLoggedIn`/`JustLoggedIn` → `Complete` → `Event`
- **One-time strategies**: `Preload`, `JustLoggedIn`, `AlreadyLoggedIn`, `Complete` fire only once per session
- **Event strategies**: `Event` strategy can fire multiple times based on event triggers
- **SSR preloading**: Features loaded on server are preloaded on client hydration (strategy overridden to `Preload`)
- **DSL re-evaluation**: Loaders are re-evaluated when DSL environment or product changes

### Data contracts
- **Input**: `LoadersConfig` from client config (DSL-based rules)
- **Output**: Loaded feature injectors with bootstrapped services
- **Loader function signature**: `(injector: Injector) => Promise<any>`
- **Style options**: `{ id: string, type: 'theme' | 'url' | 'content', htmlCssClass?: string }`

**Rule:**  
Do not change `LoadStrategy` enum values or `LoaderFnConfig` interface without coordinating with all products using loaders.

---

## 6. Dependencies

### Allowed dependencies
- `@frontend/vanilla/core` – Core services (UserService, EventsService, DslService, Logger, etc.)
- `@frontend/vanilla/ssr` – SSR utilities (PLATFORM, linkedTransferState)
- `@frontend/vanilla/features/*` – Feature libraries (loaded dynamically, not imported statically)
- `@angular/core` – Angular DI and lifecycle
- `rxjs` – Reactive streams

### Forbidden dependencies
- Product-specific libraries (`@frontend/sports/*`, `@frontend/casino/*`)
- Design system components (this is infrastructure, not UI)
- Backend services (this is frontend-only)

### Third-party usage
- Only RxJS and Angular core dependencies
- No additional third-party libraries allowed without architectural review

**Rule:**  
This library is foundational infrastructure. New dependencies must be justified and approved.

---

## 7. Testing Expectations

### Unit tests
- Test files: `*.spec.ts` alongside source
- Focus areas:
  - Strategy execution order and state transitions
  - DSL condition evaluation
  - Event-driven loading triggers
  - SSR preloading logic
  - Style injection and deduplication
- Tools: Jest

### Critical test scenarios
- Loader state transitions: `Created` → `Scheduled` → `Enabled` → `Loaded`
- Login-based strategies: `JustLoggedIn` fires on client login, `AlreadyLoggedIn` fires on SSR
- Event strategy: Correct loaders fire for Vanilla/RTMS/Native events
- DSL re-evaluation: Loaders restart when DSL environment changes
- Product filtering: Loaders respect `ProductService.isSingleDomainApp` constraints

**Rule:**  
Any change to load strategy logic or state transitions must include tests verifying the new behavior.

---

## 8. SSR Considerations

### Server-side behavior
- **Loader tracking**: `_usedLoaders` transfer state tracks which loaders executed on server
- **Client preloading**: Server-loaded features are preloaded on client (strategy overridden to `Preload`)
- **Platform guards**: `PLATFORM.isBrowser` guards browser-only operations (e.g., `WebWorkerService` delays)
- **Document events**: `ReadyStateChange` listener only fires on browser

### Critical SSR rules
- Never run delayed loaders on server (delays are browser-only via `WebWorkerService`)
- Always register loader usage on server via `registerLoaderUsage()`
- Use `linkedTransferState` for server-to-client data transfer
- Guard `DOCUMENT` event listeners with platform checks

**Rule:**  
Any new loader strategy must consider SSR implications and test both server and client execution paths.

---

## 9. Known Pitfalls & FAQ

### Known pitfalls
- **Eager service instantiation**: `LoaderService` is `providedIn: 'root'` and instantiated early. Avoid heavy dependencies in constructor.
- **Event strategy timing**: Event-based loaders may fire before DSL environment is ready. Always check `DslEnvService.change` subscriptions.
- **Style deduplication**: `LoaderStylesService` must prevent duplicate style injection. Check `id` before loading.
- **Logout reset**: Only `JustLoggedIn` and `LoggedIn` strategies reset on logout. Other strategies remain loaded.

### FAQ

**Q:** When should I create a new load strategy vs use an existing one?  
**A:** Only create new strategies for fundamentally different timing requirements (e.g., a new lifecycle hook). Most cases fit existing strategies with DSL conditions.

**Q:** Where do I register a new vanilla feature loader?  
**A:** Add it to `VANILLA_LOADERS_MAP` in `loaders-map.ts` with a unique ID and loader function.

**Q:** How do I debug why a loader isn't firing?  
**A:** Check: (1) DSL condition in client config, (2) strategy timing, (3) product filtering, (4) logger output for "Scheduled X loader(s)".

**Q:** Can I use loaders for product-specific features?  
**A:** Yes, but register them in the product entrypoint using `registerLoaderFn()`, not in `loaders-map.ts`.

**Q:** Why are some loaders preloaded on client after SSR?  
**A:** Features loaded on server are tracked in `_usedLoaders` transfer state and preloaded on client to ensure consistent hydration.
