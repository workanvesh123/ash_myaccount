---
inclusion: fileMatch
fileMatchPattern: ['packages/bingo/loader-lib/**/*']
---

# Bingo Loader Lib – Angular Library Context

## 1. Role & Scope

### Responsibility
- **Type:** Utility library (dynamic module loading)
- **Purpose:**
  - Lazy load legacy bingo game modules at runtime
  - Dynamically resolve and instantiate bingo game components
  - Bridge between modern Angular architecture and legacy bingo game implementation
  - Provide observable-based module loading status tracking
- **Consumers:** `bingo/entrypoint-lib` (game iframe launcher), legacy bingo game integration points

### Out of scope
- Bingo business logic (belongs in `frontend-lib`)
- UI components for bingo features (belongs in `ui-lib`)
- Routing and navigation (belongs in `entrypoint-lib`)

---

## 2. Public API

**Barrel file:** `src/public-api.ts`

**Main exports:**
- `BingoloaderService` – Core service for dynamic module loading
- `BingoloaderDirective` – Directive for declarative component loading
- `FrontendBingoLoaderComponent` – Internal loader component (dynamically imported)

**Stability:** Internal (used only within bingo package)

**Rule:** Only `entrypoint-lib` and legacy integration points should import from this library. Never expose loader internals to other products.

---

## 3. Internal Structure

```
src/lib/
├── bingoloader.service.ts           # Core dynamic loading service
├── bingoloader.directive.ts         # Declarative loading directive
└── bingo-frontend-loader/
    └── frontend-bingo-loader.component.ts  # Lazy-loaded loader component
```

**Placement rule:** This library has a fixed structure for legacy compatibility. Do not add new folders or significantly refactor without coordinating with bingo team.

---

## 4. Angular Patterns

### Components
- **Legacy NgModule-based** (not standalone)
- **Change detection:** Default (legacy pattern)
- **Do not migrate to standalone** – This library bridges legacy code

### State
- **BehaviorSubject** for module loading status (`bingoModuleLoadedSubject`)
- **Observable** for external consumption (`bingoModuleLoadedObservable`)
- **Boolean flag** for synchronous checks (`bingoModuleLoaded`)

### RxJS
- Exposes `Observable<boolean>` for module load status
- Consumers should use `pipe` + operators when subscribing
- No automatic cleanup (consumers must manage subscriptions)

### Dynamic Loading Pattern
```typescript
// Service dynamically imports and instantiates components
import('./bingo-frontend-loader/frontend-bingo-loader.component').then(m => {
  const componentRef = m.FrontendBingoLoaderComponent;
  // Resolve factory and create instance
});
```

**Rule:** This library uses legacy Angular patterns (ComponentFactoryResolver, NgModuleRef). Do not refactor to modern patterns without full regression testing.

---

## 5. Invariants & Contracts

### Data assumptions
- `environment` string and `configs` object must be provided to `loadBingoNpmModule()`
- `BingoNpmParams` from `@frontend/bingo/frontend-lib/core` must be available
- Legacy bingo module must export `dynamicComponentsMap` for component resolution

### Behavioral guarantees
- `bingoModuleLoadedObservable` emits `true` once module is loaded
- `isBingoModuleLoaded()` returns synchronous boolean status
- `getBingoNpmManagerService()` returns loaded service or undefined
- Module loading is idempotent (calling `loadBingoNpmModule()` multiple times is safe)

### Error handling
- Errors during component resolution are logged to console
- `GetComponent()` returns `void` on error (no throw)
- No retry logic (caller must handle failures)

**Rule:** Do not change loading sequence or service initialization order without verifying legacy bingo game compatibility.

---

## 6. Dependencies

### Allowed
- `@frontend/bingo/frontend-lib/core` – `BingoNpmParams` model
- Angular core (`@angular/core`) – DI, component factories, module refs

### Forbidden
- `@frontend/design-system/*` – This is a utility library, no UI
- `@frontend/vanilla/features/*` – No cross-product features
- Other product libraries (`casino`, `sports`, etc.)

**Rule:** This library must remain minimal with no UI dependencies. It exists solely for dynamic module loading.

---

## 7. Testing Expectations

**Framework:** Karma (legacy, not yet migrated to Jest)

**Location:** `*.spec.ts` co-located with source files

**Focus:**
- Module loading state transitions
- Observable emission behavior
- Service retrieval after module load
- Error handling for missing components

**Rule:** Any changes to loading logic must include tests verifying module load status and service availability. Test with actual legacy bingo module if possible.

---

## 8. Known Gotchas

- **Legacy ComponentFactoryResolver usage** – Uses deprecated Angular APIs for backward compatibility with legacy bingo games
- **No SSR support** – Dynamic imports and component factories don't work server-side; ensure this code only runs in browser
- **Singleton service** – `providedIn: 'root'` means one instance per app; multiple loads reuse same instance
- **No cleanup** – Once loaded, module stays in memory; no unload mechanism
- **Async initialization** – `loadBingoNpmModule()` is fire-and-forget; use observable to wait for completion
- **Legacy bingo dependency** – Tightly coupled to legacy bingo game implementation; changes may break game loading
- **ComponentFactoryResolver deprecated** – This API is deprecated in Angular 13+, but required for legacy compatibility
- **No error recovery** – Failed loads require page refresh; no automatic retry

**Migration note:** This library is a temporary bridge to legacy bingo games. Long-term goal is to migrate legacy games to modern Angular and eliminate this loader entirely.
