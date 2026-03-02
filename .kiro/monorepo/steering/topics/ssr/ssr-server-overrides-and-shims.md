---
inclusion: manual
---

# SSR Server Overrides and Shims

## Scope – When to Read This

### This file applies when you:
- Create `.provide.server.ts` files for services requiring browser APIs
- Add server shims for browser-only APIs (`ResizeObserver`, `IntersectionObserver`, `location`)
- Register server overrides in `vanilla-server-overrides.ts` or `app.config.server.ts`
- Debug `ReferenceError: {API} is not defined` errors on server
- Provide minimal server implementations for browser-dependent services
- Provide alternative behavior on server for implementations that are not important to run server side

### This file does NOT cover:
- General SSR patterns (see `ssr-integration.md`)
- DOM manipulation (see `ssr-dom-and-browser-apis.md`)
- Platform detection (see `ssr-platform-and-execution-context.md`)

**Rule:** If you're creating server-side replacements for browser APIs or services, consult this file.

---

## Core Principles

- **P1 – Minimal Server Implementations:** Server overrides provide minimal, no-op implementations that prevent crashes. They don't replicate full browser behavior.
- **P2 – Two Override Types:** Use **shims** for global API monkeypatches (`window.location`) and **service overrides** for Angular services requiring browser APIs.
- **P3 – Centralized Registration:** Register all overrides in `packages/vanilla/lib/core/src/vanilla-server-overrides.ts` or `packages/host-app/src/app.config.server.ts`.
- **P4 – Prevent Server Execution:** Server overrides are a last resort. Prefer `afterNextRender()` or `PLATFORM.runOnBrowser()` to skip browser-only code entirely.

---

## Do / Don't Guidelines

### Do
- Create `.provide.server.ts` files next to services requiring browser APIs
- Return no-op functions or resolved promises for async methods
- **Always register overrides in server config** (`vanilla-server-overrides.ts` or `app.config.server.ts`) - they must be provided in the server configuration to take effect
- Use `provideEnvironmentInitializer()` for global API shims
- Test that server overrides prevent crashes without breaking functionality

### Don't
- Don't replicate full browser behavior in server overrides (keep minimal)
- **Don't forget to register overrides in server config** - creating `.provide.server.ts` files alone is insufficient; they must be added to the server providers array
- Don't use server overrides when `afterNextRender()` or `PLATFORM.runOnBrowser()` suffices
- Don't create server overrides for services that should never run on server (analytics, tracking)

---

## Standard Patterns

### Service Override Pattern
```typescript
// my-service.provide.server.ts
export function provideMyServiceServerOverride(): Provider {
  return {
    provide: MyBrowserService,
    useValue: {
      method: () => void 0,
      asyncMethod: () => Promise.resolve(null)
    }
  };
}

// Register in vanilla-server-overrides.ts
export function provideVanillaCoreServerOverride() {
  return [
    provideMyServiceServerOverride(),
    // ... other overrides
  ];
}
```

### Global API Shim Pattern
```typescript
// window-location.provider.server.ts
export function provideWindowLocation() {
  return provideEnvironmentInitializer(() => {
    const context = inject<VnRequestContext>(REQUEST_CONTEXT);
    if (context) {
      const location = inject(WINDOW).location;
      const path = location.pathname.replace('ClientDist/browser/', '');
      const { href, pathname, origin } = new URL(`${context.host}${path}`);
      Object.assign(inject(WINDOW), {
        location: { href, pathname, origin, reload: location.reload }
      });
    }
  });
}
```

---

## Implementation Checklist

- [ ] Did you create `.provide.server.ts` file next to the service?
- [ ] Does the override provide minimal no-op implementations?
- [ ] **Did you register the override in the server config?** Add to `provideVanillaCoreServerOverride()` in `vanilla-server-overrides.ts` or the providers array in `app.config.server.ts`
- [ ] Did you verify the override prevents server crashes?
- [ ] Did you consider using `afterNextRender()` or `PLATFORM.runOnBrowser()` instead?

---

## Common Pitfalls & Anti-Patterns

- ❌ **Forgetting to Register Override:** Creating `.provide.server.ts` but not adding to the server providers array in `vanilla-server-overrides.ts` or `app.config.server.ts` causes crashes to persist. The override file alone does nothing - it must be imported and included in the server configuration.
- ❌ **Complex Server Implementations:** Replicating full browser behavior increases maintenance burden and may cause unexpected server-side execution.
- ❌ **Overriding Analytics/Tracking:** Services that should never run on server need `PLATFORM.runOnBrowser()` guards, not server overrides.
- ❌ **Missing REQUEST_CONTEXT Check:** Global shims must check for `REQUEST_CONTEXT` availability before patching APIs.

---

## Small Examples

```typescript
// ✅ Correct: Minimal service override
export function provideTrackingServerOverride(): Provider {
  return {
    provide: TrackingService,
    useValue: { onAppInit: () => {}, track: () => {} }
  };
}
```

```typescript
// ❌ Wrong: Complex server implementation
export function provideTrackingServerOverride(): Provider {
  return {
    provide: TrackingService,
    useClass: ServerTrackingService // Don't replicate full behavior!
  };
}
```

---

## Escalation & Trade-offs

- If service requires browser APIs:
  - Prefer `afterNextRender()` or `PLATFORM.runOnBrowser()` over server overrides
  - Use server overrides only when service must be injectable on server
- If global API is needed:
  - Create shim with `provideEnvironmentInitializer()` for minimal patching
  - Check `REQUEST_CONTEXT` availability before patching

**Rule:** Server overrides are a last resort. Only use it when major parts of a service are either ssr incompatible or useless to execute on the server.
Favor preventing server execution over providing server implementations.

---

## Related Steering Files

- `ssr-integration.md` – General SSR patterns and principles
- `ssr-platform-and-execution-context.md` – Platform detection and conditional execution
- `ssr-dom-and-browser-apis.md` – Safe DOM access patterns
- `vanilla-context.md` – Vanilla package structure and server override registry
- `docs/ssr-development-guide/README.md` – Comprehensive SSR guide with override examples
