---
inclusion: fileMatch
fileMatchPattern: ['packages/geo-coordinator-lib/**/*']
---

# geo-coordinator-lib – Library Context

## 1. Role & Scope

### Responsibility
- **Type:** Shared library (cross-product geolocation integration)
- **Purpose:**
  - Angular wrapper for third-party geolocation/geocompliance services (GeoComply, Oobee)
  - Manages geolocation initialization, probing, and state coordination
  - Provides permissions management UI for location access
  - Handles device detection and location verification for regulated gaming
  - Supports multi-product activation (Casino, Horse Racing)
- **Consumers:** Casino, Horse Racing, and other products requiring geolocation compliance

### Out of scope
- Product-specific business logic (belongs in product libraries)
- Backend geolocation API implementation (belongs in `backend/`)
- General device detection (use `DeviceService` from `@frontend/vanilla/core`)
- User authentication (use `UserService` from `@frontend/vanilla/core`)

**Decision rule:**  
If the change is about **geolocation coordinator integration, permissions UI, or location state management**, it belongs here.  
If it's about **product features, general device detection, or authentication**, it belongs in the respective product or vanilla library.

---

## 2. Public API & Intended Consumers

### Public surface
Three sub-packages with separate barrel exports:

**client-models** (`client-models/src/index.ts`):
- `CoordinatorStates`, `PLCIdentifier`, `IIntegrationApp`, `IInitializationInput`
- `LocationInfoStatus`, `PermissionInfo`, `DeviceInfoResponse`
- `CasinoGeolocationClientConfig`, `GeoLocationConfig`

**client-stub** (`client-stub/src/index.ts`):
- `GeolocationCoordinatorService` – Main service wrapping third-party coordinator
- `GeolocationActivatorService` – Product-specific activation logic
- `CasinoGeolocationClientConfig`, `HorseRacingGeoLocationClientConfig`

**permissions-manager** (`permissions-manager/src/index.ts`):
- `GeoCoordinatorPermissionsManagerService` – Permissions dialog management
- `PermissionsManager`, `PermissionsManagerable` types

### Stability
- **Stable:** Public types and service interfaces (breaking changes require coordination with Casino/Horse Racing teams)
- **Internal:** Third-party coordinator hookup logic (implementation detail)

### Who is allowed to import this library
- ✅ Allowed:
  - Casino product (`@frontend/casino/*`)
  - Horse Racing product (`@frontend/horseracing/*`)
  - Other products requiring geolocation compliance
- ❌ Not allowed:
  - Design system components
  - Vanilla shared features (would create circular dependency)

**Rule:**  
Always import from sub-package barrels (`@frontend/geo-coordinator/client-models`, `@frontend/geo-coordinator/client-stub`, `@frontend/geo-coordinator/permissions-manager`). Never import from deep paths.

---

## 3. Internal Structure

```
packages/geo-coordinator-lib/
├── client-models/src/          # Shared types and interfaces
│   ├── coordinator.models.ts   # Core coordinator types
│   ├── device-info.model.ts    # Device detection models
│   ├── location-info.ts        # Location status types
│   ├── permissions.ts          # Permission types
│   └── client-config/          # Product-specific configs
├── client-stub/src/            # Coordinator service wrapper
│   ├── coordinator.service.ts  # Main coordinator wrapper
│   ├── activator.service.ts    # Product activation logic
│   ├── client-config/          # Config implementations
│   └── device-info/            # Device info serialization
└── permissions-manager/src/    # Permissions UI
    ├── geocoordinator-permissions-manager.service.ts
    ├── permissions-manager.component.ts
    └── types.ts
```

### Placement rules
- **New coordinator types/interfaces**: Add to `client-models/src/`
- **Product-specific config**: Add to `client-stub/src/client-config/`
- **Coordinator service logic**: Extend `client-stub/src/coordinator.service.ts`
- **Permissions UI**: Modify `permissions-manager/src/`

**Rule:** Never create new top-level directories. Use existing sub-packages.

---

## 4. Angular Patterns

### Services
- **Singleton services** with `providedIn: 'root'`
- **Dependency injection** via `inject()` function
- **Event-driven** via callbacks (`onInitialized`, `onError`, `onProbed`)

### State Management
- **Callback-based** (legacy pattern from third-party coordinator)
- **EventEmitter** for `onAvailable` notifications
- **Pending flags** (`_initializePending`, `_uninitializePending`) for deferred initialization

### Browser Integration
- **SSR-safe**: Uses `WINDOW` injection token, never direct `window` access
- **Third-party script**: Coordinator loaded via external script, hooked up via `window.geolocationCoordinator`
- **Event listeners**: Uses `addEventListener` with cleanup on unload

### UI Components
- **Material Dialog** for permissions manager
- **Standalone component** (`PermissionsManagerComponent`)
- **Global overlay** with custom panel class (`geo-permission-manager-popup`)

**Rule:** New code must use `inject(WINDOW)` for browser APIs. Never access `window` directly (SSR compatibility).

---

## 5. Invariants & Contracts

### Coordinator lifecycle
- Coordinator must be initialized before location probing
- Initialization requires SSO token from `UserService`
- Uninitialization must be called on window unload
- Pending operations are queued if coordinator not yet available

### Product activation
- Each product (Casino, Horse Racing) has separate config
- Activation can be disabled via `?_disableFeature=geolocation` query param
- Config must be ready (`whenReady` observable) before activation check

### Permissions flow
- Permissions dialog is modal and non-dismissible (`disableClose: true`)
- Dialog can only reopen if status or reason changes
- Dialog adds global CSS classes for overlay styling

### Device detection
- PLC identifier determined by device type: `geocomply` (desktop), `oobeeAndroid`, `oobeeiOS`
- Device service from vanilla/core provides platform detection

**Rule:** Never bypass initialization lifecycle. Always check `isActive()` before using coordinator.

---

## 6. Dependencies

### Allowed
- `@frontend/vanilla/core` – `DeviceService`, `UserService`, `WINDOW`, `Logger`, `ProductService`, `AppInfoConfig`
- `@angular/material/dialog` – Permissions dialog UI
- `@angular/core` – Angular framework
- `@angular/router` – Route query param detection
- `rxjs` – Observables for async config loading

### Forbidden
- Other product libraries (would create circular dependencies)
- Design system components (this is a low-level integration library)
- Direct `window` access (use `WINDOW` token)

### Third-party integration
- **GeoComply/Oobee coordinators** – Loaded via external script, accessed via `window.geolocationCoordinator`
- **No npm dependencies** – Third-party code loaded at runtime

**Rule:** This library wraps external geolocation services. Never add direct dependencies on third-party geolocation libraries.

---

## 7. Testing Expectations

### Unit tests
- **Framework:** Jest
- **Location:** `*.spec.ts` co-located with source
- **Focus:**
  - Service initialization and lifecycle
  - Product activation logic
  - Permissions dialog state management
  - Device detection logic

### Mocking strategy
- Mock `WINDOW` for browser API tests
- Mock `UserService` for SSO token
- Mock `DeviceService` for platform detection
- Mock `window.geolocationCoordinator` for third-party integration

**Rule:** Test coordinator lifecycle without relying on external scripts. Mock `window.geolocationCoordinator` interface.

---

## 8. SSR Compatibility

### Browser-only operations
- Coordinator hookup waits for `geolocationcoordinator:bootstrapped` event
- Window event listeners (`unload`, `message`) for synchronization
- Direct access to `window.geolocationCoordinator` global

### SSR-safe patterns
- Uses `inject(WINDOW)` instead of direct `window` access
- Uses `inject(DOCUMENT)` for DOM manipulation in permissions manager
- Services are `providedIn: 'root'` but coordinator hookup deferred to browser

**Critical:** Coordinator initialization must be guarded. Third-party script only loads in browser.

---

## 9. Known Pitfalls & FAQ

### Known pitfalls
- **Coordinator not immediately available:** Third-party script loads asynchronously. Service queues operations until `geolocationcoordinator:bootstrapped` event fires.
- **SSO token required:** Initialization fails without valid session token from `UserService.ssoToken`.
- **Permissions dialog reopening:** Dialog only reopens if status/reason changes. Same error won't trigger new dialog.
- **Query param disabling:** `?_disableFeature=geolocation` bypasses activation. Test with and without this param.
- **Synchronization events:** Cross-tab coordination uses `postMessage`. Ensure `synchronizeCoordination` config is correct.
- **Device detection timing:** `DeviceService` must be available before `getPLCIdentifier()` call.

### FAQ

**Q: When should I use `GeolocationCoordinatorService` vs `GeolocationActivatorService`?**  
A: Use `GeolocationActivatorService.isActive()` to check if geolocation is enabled for current product. Use `GeolocationCoordinatorService` for actual coordinator operations (initialize, probe, uninitialize).

**Q: Where do I add product-specific geolocation config?**  
A: Create new config class in `client-stub/src/client-config/` following `CasinoGeolocationClientConfig` pattern. Register in `GeolocationActivatorService.isActive()` service map.

**Q: How do I handle coordinator errors?**  
A: Set `onError` callback on `GeolocationCoordinatorService`. Error data includes `errorCode`, `errorMessage`, and `errorType` (APP_ERROR, COMM_ERROR, etc.).

**Q: Why is coordinator undefined?**  
A: Third-party script hasn't loaded yet. Use `onAvailable` EventEmitter or wait for initialization to complete. Service queues operations automatically.

**Q: How do I test without external geolocation script?**  
A: Mock `window.geolocationCoordinator` in tests. Service wraps external API, so mock the interface defined in `IIntegrationApp`.

**Q: Can I use this library in SSR?**  
A: Service is SSR-safe (uses `WINDOW` token), but coordinator operations are browser-only. Initialization is automatically deferred to browser.

---

## See Also

- `.kiro/steering/topics/ssr/` – SSR-safe browser API access patterns
- `packages/vanilla/lib/core/` – Shared services (DeviceService, UserService, WINDOW token)
