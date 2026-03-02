---
inclusion: manual
---

# SSR Logging and Testing

## Scope – When to Read This

### This file applies when you:
- Add server-side logging to track SSR rendering behavior
- Write unit tests for components with platform-specific code
- Want to track data on datadog via the `REQUEST_LOGGER` 
- Test services that use PLATFORM token for conditional execution
- Mock platform-specific behavior in tests

### This file does NOT cover:
- General SSR patterns (see `ssr-integration.md`)
- DOM manipulation (see `ssr-dom-and-browser-apis.md`)

---

## Core Principles

- **P1 – Server Logs Go to DataDog:** Use `REQUEST_LOGGER` token for server-side structured logging that gets sent to DataDog for monitoring and debugging SSR rendering issues in deployed environments.
- **P2 – Logger is Null in Browser:** `REQUEST_LOGGER` is `null` in browser context and route exploration phase. Always use optional chaining when calling logger methods to prevent runtime crashes.
- **P3 – Test Platform Behavior:** Mock the `PLATFORM` token in tests to verify browser-specific and server-specific code paths execute correctly.
- **P4 – Console Logs Work Everywhere:** Use `console.log()` for local debugging. Use `tapIfBrowser()`/`tapIfServer()` for platform-specific RxJS logging.

---

## Do / Don't Guidelines

### Do
- Use `REQUEST_LOGGER` with optional chaining: `this.logger?.info?.({ data }, 'message')`
- Use `REQUEST_LOGGER` only when tracking issues in deployed environments (production/staging)
- Use `console.log()` for local development debugging
- Mock `PLATFORM` token in tests to verify conditional execution paths
- Use `tapIfBrowser()` and `tapIfServer()` for platform-specific RxJS side effects
- Test both browser and server code paths when using platform checks

### Don't
- Don't call logger methods without optional chaining (breaks the build)
- Don't use `REQUEST_LOGGER` for browser-side logging (it's null)
- Don't use `REQUEST_LOGGER` for local debugging (use console.log instead)
- Don't forget to test platform-specific code paths in unit tests
- Don't rely solely on console.log for production server monitoring

---

## Standard Patterns

### Server-Side Logging

```typescript
import { REQUEST_LOGGER } from '@frontend/vanilla/ssr';

export class MyService {
  private logger = inject(REQUEST_LOGGER);
  
  initialize() {
    // ✅ Structured logging for DataDog (deployed environments only)
    // Use console.log for local debugging
    this.logger?.info?.({ config: this.config }, 'SSR config loaded');
    this.logger?.warn?.({ routes: this.routes }, 'Missing route configuration');
  }
}
```

### Platform-Specific RxJS Logging

```typescript
import { tapIfBrowser, tapIfServer } from '@frontend/vanilla/ssr';

export class AnalyticsService {
  trackEvent(event: string) {
    return this.eventStream$.pipe(
      tapIfServer(value => console.log('Server event:', value)),
      tapIfBrowser(value => this.analyticsProvider.track(value))
    );
  }
}
```

### Testing Platform-Specific Code

```typescript
import { TestBed } from '@angular/core/testing';
import { PLATFORM } from '@frontend/vanilla/ssr';

describe('MyComponent', () => {
  it('should run browser-specific code', () => {
    // Note: Without proper mocking, tests will fail or skip platform-specific logic
    const mockPlatform = {
      runOnBrowser: jasmine.createSpy('runOnBrowser').and.callFake((fn) => fn()),
      runOnServer: jasmine.createSpy('runOnServer'),
      isBrowser: true,
      isServer: false
    };
    
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM, useValue: mockPlatform }]
    });
    
    const component = TestBed.createComponent(MyComponent).componentInstance;
    component.ngOnInit();
    
    expect(mockPlatform.runOnBrowser).toHaveBeenCalled();
    expect(mockPlatform.runOnServer).not.toHaveBeenCalled();
  });
});
```

---

## Implementation Checklist

- [ ] Did you use optional chaining when calling `REQUEST_LOGGER` methods? (Required for type safety and prevents build failures)
- [ ] Did you use `REQUEST_LOGGER` only for tracking issues in deployed environments (not local debugging)?
- [ ] Did you mock `PLATFORM` token in tests for components with platform-specific code?
- [ ] Did you test both browser and server execution paths?
- [ ] Did you use `tapIfBrowser()`/`tapIfServer()` for platform-specific RxJS side effects?
- [ ] Did you verify logger is only used for server-side monitoring, not browser logging?

---

## Common Pitfalls & Anti-Patterns

- ❌ **Calling logger without optional chaining**
  - `this.logger.info()` crashes in browser. Always use `this.logger?.info?.()`
- ❌ **Using REQUEST_LOGGER in browser code**
  - Logger is null in browser. Use console.log or browser-specific logging services
- ❌ **Not testing platform-specific code paths**
  - Components with `platform.runOnBrowser()` need tests that verify both paths execute correctly
- ❌ **Forgetting to mock PLATFORM in tests**
  - Tests fail or skip platform-specific logic without proper mocking

---

## Small Examples

```typescript
// ✅ Correct: Optional chaining for REQUEST_LOGGER
export class RouterService {
  private logger = inject(REQUEST_LOGGER);
  
  logRouteConfig() {
    this.logger?.info({ routes: this.router.config }, 'Router configured');
  }
}
```

```typescript
// ❌ Wrong: No optional chaining
export class BadService {
  private logger = inject(REQUEST_LOGGER);
  
  logData() {
    this.logger.info({ data: 'test' }, 'Data logged'); // Crashes in browser!
  }
}
```

---

## Related Steering Files

- `ssr-integration.md` - General SSR patterns and platform checks
- `.kiro/steering/topics/ssr/ssr-dom-and-browser-apis.md` - Safe DOM access patterns
- `.kiro/steering/topics/angular-performance/` - Performance optimization patterns
- `docs/ssr-development-guide/README.md` - Comprehensive SSR documentation
