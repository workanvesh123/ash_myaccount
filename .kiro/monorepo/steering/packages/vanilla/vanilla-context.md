---
inclusion: fileMatch
fileMatchPattern: ['packages/vanilla/**/*']
---

# Vanilla – Package Context

## 1. Role & Scope

### What Vanilla is responsible for
- Cross-product shared features used by all gaming products (sports, casino, bingo, poker, lottery, myaccount, promo, engagement, horseracing)
- Core browser utilities and SSR-safe abstractions (`TimerService`, `WINDOW` token, `ResizeObserver`, `IntersectionObserver`)
- Authentication and authorization (login, session management, guards, interceptors)
- Global navigation components (header, footer, menus, navigation layouts)
- Responsible gaming features (session limits, play breaks, deposit limits, self-exclusion)
- User account features (balance, profile, inbox, documents, preferences)
- Cross-product UI patterns (modals, tooltips, forms, dialogs, popovers)
- Third-party integrations (analytics, tracking, live chat, geolocation)
- Platform services (feature flags, configuration, routing, meta tags)

### What Vanilla is NOT responsible for
- Product-specific business logic (belongs in product packages)
- Product-specific UI components (belongs in product ui-libs)
- Design system components (belongs in `packages/design-system`)
- Game-specific features (belongs in respective product packages)
- Backend API implementations (belongs in `backend/`)

**Decision rule:**  
If the feature is used by **3+ products** and has **no product-specific logic**, it belongs in Vanilla.  
If it's **product-specific** or **only used by 1-2 products**, it belongs in the product package.

---

## 2. Public API & Consumers

### Package structure
Vanilla is organized into multiple sub-packages:

- `packages/vanilla/lib/core/` – Core services, utilities, browser abstractions
- `packages/vanilla/lib/features/` – 150+ cross-product feature libraries
- `packages/vanilla/lib/shared/` – Shared UI components and utilities
- `packages/vanilla/lib/ssr/` – SSR-specific utilities and platform abstractions
- `packages/vanilla/testing/` – Test utilities and mocks
- `packages/vanilla/tracking-feature/` – Analytics and tracking integration

### Import patterns
```typescript
// ✅ Correct: Barrel exports
import { TimerService, WINDOW } from '@frontend/vanilla/core';
import { LoginComponent } from '@frontend/vanilla/features/login';
import { PLATFORM, tapIfBrowser } from '@frontend/vanilla/ssr';
import { VnDialogService } from '@frontend/vanilla/shared/dialog';

// ❌ Wrong: Deep imports
import { TimerService } from '../../../vanilla/lib/core/src/browser/timer.service';
```

### Who is allowed to import Vanilla
- ✅ Allowed: All product packages (sports, casino, bingo, poker, lottery, myaccount, promo, engagement, horseracing)
- ✅ Allowed: Host app and shared infrastructure
- ❌ Not allowed: Design system (DS is a dependency of Vanilla, not the reverse)
- ❌ Not allowed: Backend services

**Critical rule:**  
Vanilla is a **shared dependency** of products. Products must never be imported into Vanilla. Vanilla → Products is forbidden.

---

## 3. Internal Structure & Code Organization

### Core library (`lib/core/`)
- `browser/` – Browser API abstractions (TimerService, ResizeObserverService, WINDOW token)
- `config/` – Configuration services and providers
- `guards/` – Route guards (AuthGuard, etc.)
- `interceptors/` – HTTP interceptors
- `services/` – Platform services (ProductService, UserService, etc.)
- `utils/` – Shared utilities and helpers

### Features library (`lib/features/`)
150+ feature directories, each containing:
- Standalone components and directives
- Feature-specific services and state
- Public API barrel export (`index.ts`)

**Key features:**
- Authentication: `login/`, `logout/`, `single-sign-on/`
- Navigation: `header/`, `footer/`, `navigation-layout/`, `menus/`
- Responsible gaming: `session-limits/`, `play-break/`, `deposit-limits/`, `self-exclusion/`
- User account: `balance-breakdown/`, `inbox/`, `user-documents/`, `user-summary/`
- UI patterns: `dialog/`, `popper/`, `datepicker/`, `range-datepicker/`
- Third-party: `google-analytics/`, `adobe-target/`, `launch-darkly/`, `live-person/`

### Shared library (`lib/shared/`)
- Reusable UI components used across features
- Shared services and utilities
- Form controls and validation

### SSR library (`lib/ssr/`)
- `PLATFORM` token for platform detection
- SSR-safe operators (`tapIfBrowser`, `tapIfServer`)
- Server-side utilities and abstractions

### Placement rules
- **New cross-product feature**: Create in `lib/features/{feature-name}/`
- **New core utility**: Add to `lib/core/utils/` or appropriate core subdirectory
- **New shared UI component**: Add to `lib/shared/{component-name}/`
- **New SSR utility**: Add to `lib/ssr/`

**Naming conventions:**
- Feature directories: kebab-case (e.g., `session-limits/`, `balance-breakdown/`)
- Component selectors: `vn-{component}` prefix (e.g., `vn-dialog`, `vn-header`)
- Service classes: `{Name}Service` suffix (e.g., `TimerService`, `UserService`)

---

## 4. Development Patterns

### Component architecture
- Use **standalone components** with explicit imports
- Use **ChangeDetectionStrategy.OnPush** for all components
- Use **signals** for reactive state, **computed** for derived state
- Use **toSignal()** to convert observables to signals in components
- Support **SSR** – never access `window`/`document` directly

### Service patterns
- Use **dependency injection** via `inject()` function
- Use **signals** for reactive state in services
- Use **RxJS** for async streams and HTTP calls
- Provide services at appropriate level (root, feature, component)
- Clean up subscriptions with `takeUntilDestroyed()`

### SSR-safe patterns
```typescript
// ✅ Correct: Use injection tokens
private readonly window = inject(WINDOW);
private readonly document = inject(DOCUMENT);

// ✅ Correct: Use platform detection
private readonly platform = inject(PLATFORM);
this.platform.runOnBrowser(() => this.initBrowserFeature());

// ✅ Correct: Use afterNextRender for browser-only code
afterNextRender(() => this.initThirdPartyLibrary());

// ❌ Wrong: Direct browser API access
window.localStorage.setItem('key', 'value');
document.querySelector('.element');
```

### Timer management
```typescript
// ✅ Correct: Use TimerService
private readonly timerService = inject(TimerService);
private readonly destroyRef = inject(DestroyRef);
private timeoutId: ReturnType<typeof setTimeout> | undefined;

constructor() {
  this.destroyRef.onDestroy(() => {
    this.timerService.clearTimeout(this.timeoutId);
  });
}

scheduleAction() {
  this.timeoutId = this.timerService.setTimeoutOutsideAngularZone(() => {
    this.ngZone.run(() => this.performAction());
  }, 1000);
}
```

---

## 5. Feature Development Guidelines

### Creating a new feature
1. Create directory in `lib/features/{feature-name}/`
2. Add `src/` subdirectory with implementation
3. Create `index.ts` barrel export for public API
4. Add `project.json` for Nx configuration
5. Add `README.md` with feature documentation
6. Add unit tests co-located with source

### Feature structure
```
lib/features/{feature-name}/
├── src/
│   ├── {feature}.component.ts
│   ├── {feature}.component.html
│   ├── {feature}.component.scss
│   ├── {feature}.component.spec.ts
│   ├── {feature}.service.ts
│   ├── {feature}.service.spec.ts
│   └── index.ts              # Public API
├── project.json
└── README.md
```

### Public API guidelines
- Export only what consumers need (components, services, types, utilities)
- Keep internal implementation details private
- Document exported APIs with JSDoc comments
- Mark deprecated APIs with `@deprecated` tag and migration path

---

## 6. Dependencies & Boundaries

### Allowed dependencies
- `@angular/*` – Angular framework packages
- `@frontend/design-system/*` – DS components for UI
- `@frontend/themepark` – Theming integration
- RxJS – Reactive programming
- Standard browser APIs (via SSR-safe abstractions)

### Forbidden dependencies
- Any product package (`@frontend/sports`, `@frontend/casino`, etc.)
- Product-specific libraries
- Backend packages
- Heavy third-party UI libraries (prefer native or DS components)

### Third-party integrations
- Wrap third-party libraries in services for testability
- Provide SSR-safe overrides for browser-only libraries
- Document peer dependencies in feature README
- Minimize bundle impact (lazy load when possible)

**Dependency rule:**  
Vanilla provides utilities TO products, never imports FROM products. This ensures Vanilla remains product-agnostic and reusable.

---

## 7. Testing Requirements

### Unit tests
- Framework: **Jest** (migrating from Karma)
- Location: Co-located `*.spec.ts` files
- Coverage focus:
  - Core services and utilities (high coverage required)
  - Feature components and services
  - SSR compatibility (test both browser and server modes)
  - Guard and interceptor logic

### Test patterns
```typescript
// Test SSR compatibility
it('should work in SSR mode', () => {
  TestBed.configureTestingModule({
    providers: [
      { provide: PLATFORM_ID, useValue: 'server' }
    ]
  });
  // Test server-side behavior
});

// Test browser-only features
it('should initialize in browser', () => {
  TestBed.configureTestingModule({
    providers: [
      { provide: PLATFORM_ID, useValue: 'browser' }
    ]
  });
  // Test browser-side behavior
});
```

### Integration testing
- E2E tests in product packages cover Vanilla feature integration
- Vanilla provides test utilities in `packages/vanilla/testing/`
- Mock services and fixtures for product testing

---

## 8. Migration & Legacy Patterns

### Active migrations
- **Karma → Jest** – Test framework migration in progress
- **NgModules → Standalone** – Most features migrated, some legacy modules remain
- **BehaviorSubject → Signals** – Migrating reactive state to signals
- **async pipe → toSignal()** – Migrating template subscriptions

### Legacy patterns (do not extend)
- NgModule-based features (use standalone components)
- Direct DOM manipulation (use `Renderer2`)
- Manual change detection (use signals)
- Direct browser API access (use SSR-safe abstractions)

### Migration guidelines
- New features must be standalone with OnPush
- New state must use signals, not BehaviorSubject
- New browser API usage must be SSR-safe
- New tests must use Jest, not Karma

**Strangler pattern:**  
When touching legacy code, wrap with new patterns instead of full rewrites. Gradual migration reduces risk.

---

## 9. Known Gotchas & FAQ

### Known pitfalls
- **TimerService is eagerly instantiated** – Avoid injecting heavy dependencies into core services
- **WINDOW token is null on server** – Always check platform before accessing browser APIs
- **Feature flags may be undefined** – Guard feature flag access with defaults
- **Dimensional properties return 0 on server** – Use `ResizeObserver` or `IntersectionObserver` instead of direct DOM reads
- **Multiple products import same feature** – Breaking changes affect all products, coordinate carefully

### Performance considerations
- Core services are shared across products – optimize for minimal overhead
- Features may be loaded on every page – keep bundle size small
- Use lazy loading for heavy features (analytics, third-party integrations)
- Run timers outside Angular zone when change detection is not needed

### SSR compatibility
- All Vanilla features must be SSR-safe
- Test both browser and server rendering modes
- Provide server overrides for browser-only services
- Use `afterNextRender()` for browser-only initialization

### FAQ

**Q: When should I create a new feature vs extend an existing one?**  
A: Create a new feature if it's a distinct cross-product concern. Extend existing features for related functionality (e.g., add to `session-limits/` for new limit types).

**Q: Where do shared types belong?**  
A: In the feature that owns them. If shared across features, create in `lib/core/types/`.

**Q: When should something move from a product to Vanilla?**  
A: When it's used by 3+ products, has no product-specific logic, and provides reusable value across the platform.

**Q: How do I handle product-specific variations?**  
A: Use configuration inputs or feature flags. Vanilla provides generic functionality; products customize via configuration.

**Q: Can I import from other Vanilla features?**  
A: Yes, but avoid circular dependencies. Check `nx graph` before adding cross-feature imports.

**Q: How do I test SSR compatibility?**  
A: Provide both browser and server platform IDs in tests. Verify behavior in both modes.

---

## 10. Key Services & Utilities Reference

### Core services (`@frontend/vanilla/core`)
- `TimerService` – SSR-safe setTimeout/setInterval with zone control
- `ResizeObserverService` – SSR-safe ResizeObserver wrapper
- `ProductService` – Product registration and activation
- `UserService` – User state and authentication
- `ConfigService` – Application configuration

### SSR utilities (`@frontend/vanilla/ssr`)
- `PLATFORM` – Platform detection and conditional execution
- `tapIfBrowser()` / `tapIfServer()` – RxJS operators for platform-specific side effects
- `REQUEST_LOGGER` – Server-side structured logging

### Browser abstractions (`@frontend/vanilla/core`)
- `WINDOW` – SSR-safe window token
- `DOCUMENT` – SSR-safe document token (from `@angular/common`)
- `INTERSECTION_OBSERVER` – SSR-safe IntersectionObserver token

### Shared UI (`@frontend/vanilla/shared`)
- `VnDialogService` – Dialog management
- `VnTooltipDirective` – Tooltip functionality
- `VnFormsModule` – Form controls and validation

**Reference documentation:**  
See individual feature README files in `lib/features/{feature-name}/` for detailed API documentation.
