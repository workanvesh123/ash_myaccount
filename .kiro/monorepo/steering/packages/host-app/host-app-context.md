---
inclusion: fileMatch
fileMatchPattern: ['packages/host-app/**/*']
---

# host-app – Application Context

## 1. Role & Scope

### What host-app does
- **Application Shell**: Main entry point that composes all product modules (sports, casino, bingo, poker, lottery, myaccount, promo, engagement, horseracing) via Module Federation
- **Routing Orchestration**: Culture-based routing (`{culture}/{vertical}/{path}`) with lazy-loaded product routes
- **SSR Infrastructure**: Server-side rendering setup with Node.js Express server
- **Micro-App Platform**: Hosts standalone micro-applications under `/apps/*` routes (e.g., hello-world)
- **Global Configuration**: Manages client config, environment settings, and product-specific route configurations

### What host-app does NOT do
- Product-specific business logic (belongs in `packages/{product}/`)
- Shared UI components (belongs in `packages/design-system/`)
- Cross-product utilities (belongs in `packages/vanilla/`)
- Backend API implementation (belongs in `backend/`)

**Decision rule:**  
If the change affects **routing, SSR setup, app composition, or micro-apps**, it belongs here.  
If it's **product features, shared components, or utilities**, it belongs in the respective product or shared package.

---

## 2. Public API & Intended Consumers

### Public surface
- **No public API**: host-app is an application, not a library. It does not export reusable code.
- **Entry points**:
  - `src/main.ts` – Browser bootstrap
  - `src/main.server.ts` – SSR bootstrap
  - `src/server.ts` – Express server entry

### Who consumes this
- ✅ End users via browser
- ✅ Backend .NET services via SSR requests
- ❌ Other packages should NOT import from host-app

**Rule:**  
host-app is a **consumer** of other packages, never a dependency.

---

## 3. Internal Structure & Where to Put New Code

### Directory layout
```
src/
├── apps/                    # Micro-applications (hello-world, etc.)
│   ├── {app-name}/
│   │   ├── {app-name}.component.ts
│   │   ├── {app-name}.guard.ts
│   │   └── routes.ts
│   └── routes.ts           # Central app router
├── routes/                  # Product route configurations
│   ├── all.routes.ts       # Production: all products
│   ├── product.routes.ts   # Development: filtered products
│   ├── {product}.routes.ts # Individual product routes
│   └── routes-config.ts    # Route configuration utilities
├── server-overrides/        # SSR-specific providers
│   ├── interceptors/
│   ├── clientconfig.ts
│   ├── rx-render-strategies.ts
│   └── transfer-state-override.ts
├── view-transition/         # View transition animations
├── environments/            # Environment configs
├── maintenance/             # Maintenance mode feature
├── app.config.ts           # Client app configuration
├── app.config.server.ts    # Server app configuration
├── app.routes.ts           # Client routes
├── app.routes.server.ts    # Server routes
├── bootstrapper.ts         # App initialization
├── guards.ts               # Route guards
├── host-router.ts          # Custom router logic
└── provide.ts              # Provider utilities

test/
└── apps/                    # Micro-app tests
    └── {app-name}/
        ├── {app-name}.component.spec.ts
        └── {app-name}.guard.spec.ts
```

### Placement rules
- **New micro-app**: Create in `src/apps/{app-name}/` with component, guard, and routes
- **Product route config**: Add to `src/routes/{product}.routes.ts`
- **SSR overrides**: Add to `src/server-overrides/`
- **Global providers**: Add to `src/provide.ts` or `src/app.config.ts`
- **Tests**: Mirror structure in `test/` directory

---

## 4. Extension Patterns

### Adding a new micro-app
1. Create directory: `src/apps/{app-name}/`
2. Create component: `{app-name}.component.ts` with selector `ha-apps-{app-name}`
3. Create guard (optional): `{app-name}.guard.ts`
4. Create routes: `routes.ts` with lazy-loaded component
5. Register in `src/apps/routes.ts`:
   ```typescript
   {
     path: '{app-name}',
     loadChildren: () => import('./{app-name}/routes').then(m => m.ROUTES)
   }
   ```
6. Create tests in `test/apps/{app-name}/`

### Adding a new product route
1. Create `src/routes/{product}.routes.ts`
2. Define routes with Module Federation lazy loading:
   ```typescript
   {
     path: '{product}',
     loadChildren: () => import('@frontend/{product}/entrypoint-lib').then(m => m.ROUTES)
   }
   ```
3. Add to `src/routes/all.routes.ts` for production
4. Update `src/routes/product.routes.ts` for development filtering

### Adding SSR server overrides
1. Create provider in `src/server-overrides/`
2. Register in `src/app.config.server.ts`:
   ```typescript
   export const serverConfig: ApplicationConfig = {
     providers: [provideServerRendering(), yourNewProvider()]
   };
   ```

### Checklist for new code
- [ ] Follows standalone component pattern (no NgModules)
- [ ] Uses signals for reactive state
- [ ] SSR-compatible (no direct `window`/`document` access)
- [ ] Lazy-loaded where possible
- [ ] Includes unit tests with 100% coverage target
- [ ] Follows naming conventions (kebab-case files, PascalCase classes)
- [ ] Prefix unused parameters with underscore for ESLint

---

## 5. Invariants & Contracts

### Routing invariants
- All routes must support culture prefix: `{culture}/{vertical}/{path}`
- Product routes must use Module Federation lazy loading
- Micro-app routes must be under `/apps/*` path
- Route guards must be SSR-compatible

### SSR invariants
- Server must respond within timeout (configurable)
- All async operations must complete before SSR response
- Transfer state must be used for HTTP caching
- Browser-only code must use `afterNextRender()` or platform checks

### Configuration contracts
- `ClientConfigService` provides runtime configuration
- Environment files control build-time settings
- Product routes can be filtered via `PRODUCT_ROUTES` env var

---

## 6. Dependencies

### Allowed dependencies
- ✅ All product entrypoint libraries (`@frontend/{product}/entrypoint-lib`)
- ✅ Vanilla shared features (`@frontend/vanilla/*`)
- ✅ Design system components (`@frontend/ui/*`)
- ✅ Themepark theming (`@frontend/themepark`)
- ✅ Angular core libraries (`@angular/*`)

### Forbidden dependencies
- ❌ Product internal libraries (only entrypoints allowed)
- ❌ Backend code (`backend/*`)
- ❌ Other applications

### Third-party usage
- `@angular/*` – Framework
- `express` – SSR server
- `hls.js` – Video streaming
- `@jumio/websdk` – Identity verification
- `@qwik.dev/partytown` – Third-party script optimization

**Rule:**  
Always use Module Federation for product imports. Never static imports across product boundaries.

---

## 7. Testing Expectations

### Unit tests
- **Location**: `test/` directory mirroring `src/` structure
- **Framework**: Jest with `jest-preset-angular`
- **Coverage target**: 100% for new code
- **Focus areas**:
  - Micro-app components and guards
  - Route configurations
  - Service initialization
  - SSR-specific logic

### Test patterns
```typescript
// Component test
describe('MyAppComponent', () => {
  let fixture: ComponentFixture<MyAppComponent>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyAppComponent]
    }).compileComponents();
    
    fixture = TestBed.createComponent(MyAppComponent);
  });
  
  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});

// Guard test
describe('MyAppGuard', () => {
  let guard: MyAppGuard;
  
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MyAppGuard] });
    guard = TestBed.inject(MyAppGuard);
  });
  
  it('should allow access', () => {
    const result = guard.canActivate({} as any, {} as any);
    expect(result).toBe(true);
  });
});
```

### Running tests
```bash
yarn nx test host-app              # Run all tests
yarn nx test host-app --watch      # Watch mode
yarn nx test host-app --coverage   # With coverage
```

---

## 8. SSR & Performance

### SSR requirements
- Use `DOCUMENT` and `WINDOW` injection tokens, never globals
- Use `Renderer2` for DOM manipulation
- Use `afterNextRender()` for browser-only initialization
- Provide server overrides for browser-dependent services in `src/server-overrides/`
- Use `transferCache: true` for HTTP requests

### Performance optimization
- Lazy load all product routes
- Use `vnSpeculativeLink` for route preloading
- Optimize bundle size with tree-shaking
- Use `ChangeDetectionStrategy.OnPush` for all components
- Avoid blocking operations in SSR

### Development modes
```bash
# Client-side only (faster development)
yarn nx serve host-app -c {theme}

# SSR development
yarn nx serve-ssr host-app -c {theme}

# Single product (faster builds)
PRODUCT_ROUTES=sports yarn nx serve host-app -c {theme}
```

---

## 9. Known Pitfalls & FAQ

### Known pitfalls
- **Module Federation timing**: Product modules load asynchronously; handle loading states
- **SSR timeout**: Long-running operations block server response; defer non-critical work
- **Route configuration**: Production uses `all.routes.ts`, development uses `product.routes.ts` with filtering
- **Theme configuration**: Must specify theme with `-c {theme}` flag
- **Memory usage**: Loading all products requires ~23GB RAM; use `PRODUCT_ROUTES` to filter

### FAQ

**Q: How do I add a new micro-app?**  
A: Follow the pattern in `src/apps/hello-world/`. Create component, guard, routes, register in `src/apps/routes.ts`, and add tests.

**Q: How do I test only one product during development?**  
A: Set `PRODUCT_ROUTES={product}` in `.env` or use inline: `PRODUCT_ROUTES=sports yarn nx serve host-app -c {theme}`

**Q: Why are my tests failing with ESLint errors?**  
A: Prefix unused parameters with underscore (e.g., `_route`, `_state`) and ensure files are in `tsconfig.spec.json`

**Q: How do I debug SSR issues?**  
A: Use `yarn nx serve-ssr host-app -c {theme} --inspect localhost:1234` and open `chrome://inspect`

**Q: Where do I add global providers?**  
A: Client providers in `src/app.config.ts`, server providers in `src/app.config.server.ts`

**Q: How do I handle maintenance mode?**  
A: Use `src/maintenance/` feature with interceptor and service

**Q: What's the component selector prefix?**  
A: `ha-` for host-app components, `ha-apps-` for micro-apps

**Q: How do I add view transitions?**  
A: Use utilities in `src/view-transition/` and apply guards to routes
