# Common Karma to Jest Migration Patterns

## Purpose

This document captures common patterns, issues, and solutions encountered during Karma/Jasmine to Jest/ng-mocks migrations. Use this as a reference guide when migrating test files to avoid repeating solved problems.

## Table of Contents

1. [Import Patterns](#import-patterns)
2. [Mock Instantiation Patterns](#mock-instantiation-patterns)
3. [Common Test Fixes](#common-test-fixes)
4. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
5. [Troubleshooting Guide](#troubleshooting-guide)

---

## Import Patterns

### Standard Import Structure

```typescript
// Angular testing utilities
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';

// Service types (always import alongside mocks)
import { 
    UserService, 
    NavigationService,
    WINDOW 
} from '@frontend/vanilla/core';

// Jest mocks from vanilla
import {
    UserServiceMock,
    NavigationServiceMock,
    // ... other mocks
} from '@frontend/vanilla/testing';
```

## Mock Instantiation Patterns

### Function vs Object Mocks

Some mocks are **functions** that return mock instances, others are **objects**:

```typescript
// ✅ Function mocks (call with parentheses)
MockProvider(UserService, UserServiceMock())
MockProvider(CommonService, CommonServiceMock())
MockProvider(ApiServiceFactory, ApiServiceFactoryMock())
MockProvider(NLRegulatoryHelperService, NLRegulatoryHelperServiceMock())

// ✅ Object mocks (no parentheses)
MockProvider(NavigationService, NavigationServiceMock)
MockProvider(MediaQueryService, MediaQueryServiceMock)
MockProvider(OfferContentConfiguration, OfferContentConfigurationMock)
MockProvider(ClientConfigService, ClientConfigServiceMock)
MockProvider(DesignSystemHelperService, DesignSystemHelperServiceMock)
```

**How to identify:** Check the mock file or let TypeScript errors guide you. If you get "X is not a function", remove the `()`.

### Mock Naming Conventions

**Critical Rule:** Always follow consistent naming patterns for mocks:

1. **Mock names must start with the service name followed by "Mock"**
    - Service: `MyService` → Mock: `MyServiceMock`
    - Service: `MyService` → Mock variable: `myServiceMock`
    - Service: `HeaderBarService` → Mock: `HeaderBarServiceMock`

2. **Search for existing mocks before creating new ones**
    - Check `@frontend/vanilla/testing` for vanilla service mocks
    - Check `@frontend/{package}/test-utils` for package-specific mocks
    - Check `packages/{package}/tests/mocks` or `packages/{package}/tests/jest-mocks` for local package mocks
    - Only create a new mock if none exists

3. **Always use MockProvider for all class-based services**
   ```typescript
   // ✅ Preferred: Use MockProvider with ng-mocks for ALL services
   MockProvider(DeviceService, DeviceServiceMock)
   MockProvider(UserService, UserServiceMock())
   MockProvider(CommonService, CommonServiceMock())
   MockProvider(NLRegulatoryHelperService, NLRegulatoryHelperServiceMock())
   MockProvider(HeaderBarService, HeaderBarServiceMock)
   
   // ❌ Avoid: Plain provider objects for class-based services
   { provide: 'DeviceService', useValue: DeviceServiceMock }
   { provide: DeviceService, useValue: DeviceServiceMock }
   { 
       provide: NLRegulatoryHelperService, 
       useValue: {
           ...NLRegulatoryHelperServiceMock(),
           displayPromoDetails$: displayPromoDetailsSubject.asObservable(),
       }
   }
   
   // ✅ Exception: Only use plain providers for injection tokens
   { provide: WINDOW, useValue: WindowMock }
   { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 1 } } } }
   ```

**When to use plain providers vs MockProvider:**
- **Use `MockProvider`** (default): ALL class-based services, no exceptions
- **Use plain providers** (exceptions only):
    - Injection tokens (e.g., `WINDOW`, `DOCUMENT`, `ActivatedRoute`) - these are NOT class-based services

**Key Learning:** MockProvider handles all scenarios correctly, including event emitters. No need to create test-controlled Subjects or override properties - the mock's default implementation works as-is. This has been verified in production migrations.

---

## Common Test Fixes

### 1. Replace MockContext with MockProvider

**Before (Karma/Moxxi):**
```typescript
beforeEach(waitForAsync(() => {
    MockContext.useMock(UserService, UserServiceMock());
    MockContext.useMock(NavigationService, NavigationServiceMock);
    
    TestBed.configureTestingModule({
        // ...
    });
}));
```

**After (Jest/ng-mocks):**
```typescript
beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
        providers: [
            MockProvider(UserService, UserServiceMock()),
            MockProvider(NavigationService, NavigationServiceMock),
            // ...
        ],
    });
}));
```

### 2. Replace Jasmine Matchers with Jest

| Jasmine | Jest |
|---------|------|
| `.toBeEmptyObject()` | `.toEqual({})` |
| `.toBeEmptyString()` | `.toBe('')` |
| `.toContainText('text')` | `.textContent.toContain('text')` |
| `.toHaveText('text')` | `.textContent.toContain('text')` |
| `.toHaveClass('class')` | `.classList.contains('class')` to be `true` |
| `spyOn(obj, 'method').and.returnValue(value)` | `jest.spyOn(obj, 'method').mockReturnValue(value)` |
| `spyOn(obj, 'method').and.callThrough()` | `jest.spyOn(obj, 'method')` |
| `jasmine.createSpy()` | `jest.fn()` |
| `jasmine.clock().install()` | `jest.useFakeTimers()` |
| `jasmine.clock().tick(ms)` | `jest.advanceTimersByTime(ms)` |
| `jasmine.clock().uninstall()` | `jest.useRealTimers()` |

### 3. Use jest.spyOn() for Mock Method Overrides

**Critical Rule:** Always use `jest.spyOn()` to override mock methods, never use type assertions like `as jest.Mock`.

```typescript
// ✅ Correct: Use jest.spyOn() for mock method overrides
jest.spyOn(serviceMock, 'methodName').mockReturnValue(of(true));
jest.spyOn(serviceMock, 'getData').mockReturnValue(of({ data: 'test' }));

// ✅ Correct: Clear spy before assertions to avoid cross-test pollution
const spy = jest.spyOn(serviceMock, 'methodName');
spy.mockClear();
// ... test code ...
expect(serviceMock.methodName).not.toHaveBeenCalled();

// ❌ Wrong: Type assertion as jest.Mock
(serviceMock.methodName as jest.Mock).mockReturnValue(of(true));
(serviceMock.getData as jest.Mock).mockReturnValue(of({ data: 'test' }));
```

**Why jest.spyOn() is preferred:**
- Type-safe: TypeScript validates the method name exists on the object
- Cleaner syntax: No type assertions needed
- Better IDE support: Autocomplete for method names
- Easier to clear: `spy.mockClear()` resets call history between tests

### 4. Remove Unused Mock Imports

TypeScript will warn about unused imports:

```typescript
// ❌ Remove if not used in providers
import { NativeAppServiceMock } from '@frontend/vanilla/testing';

// ✅ Only import what you actually use
import { UserServiceMock, NavigationServiceMock } from '@frontend/vanilla/testing';
```

---

## Anti-Patterns to Avoid

### 1. Never Create Inline Mock Factory Functions

**Critical Rule:** Never create inline functions that generate mocks when existing mocks are available.

**Why this matters:**
- Existing mocks are tested and maintained centrally
- Inline mocks duplicate code and can drift from the real service interface
- MockProvider with existing mocks ensures type safety
- Reduces test maintenance burden

### 2. Never Wrap beforeEach in Setup Functions

**Critical Rule:** Never wrap `beforeEach` logic in a custom `setup()` or `setupTest()` function. Modify mock properties directly on the injected service per test instead.

```typescript
// ❌ Wrong: Wrapping beforeEach in setup function
const setupTest = (isMobile: boolean) => {
    TestBed.configureTestingModule({
        providers: [
            MockProvider(DeviceService, { ...DeviceServiceMock, isMobile }),
        ],
    }).compileComponents();
    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
};

it('should work on mobile', () => {
    setupTest(true);
    // ...
});

// ✅ Correct: Use beforeEach and modify injected service per test
let deviceService: DeviceService;

beforeEach(() => {
    TestBed.configureTestingModule({
        providers: [
            MockProvider(DeviceService, DeviceServiceMock),
        ],
    }).compileComponents();
    
    deviceService = TestBed.inject(DeviceService);
    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
});

it('should work on desktop', () => {
    (deviceService as any).isMobile = false;
    fixture.detectChanges();
    // ...
});

it('should work on mobile', () => {
    (deviceService as any).isMobile = true;
    fixture.detectChanges();
    // ...
});
```

**Why this is a heavy violation:**
- Breaks Jest's test isolation model
- Makes tests harder to read and understand
- Prevents proper use of `beforeEach`/`afterEach` hooks
- Complicates debugging when tests fail
- Direct property assignment on injected mock is the standard way to modify mock behavior per test

### 3. Never Use Plain Provider Objects for Class-Based Services

```typescript
// ❌ Wrong: Plain provider object
{ provide: DeviceService, useValue: deviceMock }
{ provide: EdsService, useValue: edsServiceMock }

// ✅ Correct: Always use MockProvider
MockProvider(DeviceService, DeviceServiceMock)
MockProvider(EdsService, EdsServiceMock)
```

**Why MockProvider is required:**
- MockProvider from ng-mocks properly handles Angular's dependency injection
- Ensures the mock is correctly typed and integrated
- Provides better error messages when mocks are misconfigured
- Only exception: injection tokens like `WINDOW`, `DOCUMENT`, `ActivatedRoute`

### 4. Never Spread Mocks into New Objects

```typescript
// ❌ Wrong: Spreading creates empty object with wrong type
let designSystemHelperServiceMock: typeof DesignSystemHelperServiceMock;
designSystemHelperServiceMock = { ...DesignSystemHelperServiceMock }; // Empty if mock is MockService result

// ✅ Correct: Use the mock directly with MockProvider
MockProvider(DesignSystemHelperService, DesignSystemHelperServiceMock)
```

**Why this fails:**
- `MockService()` from ng-mocks returns a special mock object
- Spreading it creates a plain object that loses the mock's functionality
- TypeScript may not catch this because the spread result has the wrong type

---

## Troubleshooting Guide

### Issue: "X is not a function"

**Cause:** Trying to call a mock object as a function.

**Solution:** Remove `()` from the mock:
```typescript
// ❌ Wrong
MockProvider(NavigationService, NavigationServiceMock())

// ✅ Correct
MockProvider(NavigationService, NavigationServiceMock)
```

## Migration Checklist

Use this checklist for each file migration:

- [ ] **Search for existing mocks** before creating new ones
- [ ] **Follow mock naming conventions** (ServiceName → serviceNameMock → ServiceNameMock)
- [ ] Replace all `MockContext.useMock()` with `MockProvider()`
- [ ] Import service types alongside mocks
- [ ] **Prefer `MockProvider()` over `{ provide: ..., useValue: ... }`** when possible
- [ ] Update all Jasmine matchers to Jest equivalents
- [ ] Replace `spyOn().and.returnValue()` with `jest.spyOn().mockReturnValue()`
- [ ] Fix mock instantiation (function vs object)
- [ ] Add WINDOW mock if component uses `window` APIs
- [ ] Create Subject mocks for event emitters
- [ ] Remove unused imports
- [ ] Run tests: `yarn nx test {package} --testFile={filename}`
- [ ] Verify all tests pass
- [ ] Check diagnostics for TypeScript errors
- [ ] Verify no console warnings or errors
- [ ] Perform a cleanup of unused `karma.conf.js` and `test.ts` files

---

## Related Documentation

- Main workflow: `.kiro/steering/workflows/karma-to-jest-migration.md`
- Mocking patterns: `.kiro/steering/topics/karma-to-jest-migration/mocking.md`
- Package-specific mocks: `packages/{package}/tests/mocks/` or `packages/{package}/tests/jest-mocks/`

---

## Quick Reference

### Most Common Fixes

1. **Search for existing mocks**: Check vanilla/testing, package jest-mocks, and local tests before creating new mocks
2. **Follow naming conventions**: ServiceName → serviceName → ServiceNameMock (consistent naming)
3. **Prefer MockProvider**: Use `MockProvider(Service, ServiceMock())` over `{ provide: Service, useValue: ... }`
4. **MockContext → MockProvider**: Replace all `MockContext.useMock()` calls
5. **Import service types**: Always import alongside mocks for `MockProvider`
6. **Mock instantiation**: Check if mock needs `()` or not
7. **Jasmine matchers**: Replace with Jest equivalents
8. **WINDOW mock**: Add when component uses browser APIs
9. **Use jest.spyOn()**: Always use `jest.spyOn(mock, 'method').mockReturnValue()` instead of `(mock.method as jest.Mock).mockReturnValue()`
10. **Clear spies between tests**: Use `spy.mockClear()` to reset call history and avoid cross-test pollution
11. **Remove unused imports**: Clean up imports that aren't used
12. **Never create inline mock factories**: Always use existing mocks from jest-mocks directories
13. **Never spread mocks**: Use mocks directly with MockProvider, don't spread them into new objects
14. **Never wrap beforeEach**: Use `jest.spyOn()` to modify mock behavior per test, not setup functions

### Test Command

```bash
yarn nx test {package-name} --testFile={filename}
```

### Mock Discovery Workflow

Before creating any mock, follow this workflow:

1. **Identify the service** you need to mock (e.g., `MyService`)
2. **Search for existing mock** in this order:
    - `@frontend/vanilla/testing` (for vanilla services)
    - `@frontend/{package}/test-utils` (for package-exported mocks)
    - `packages/{package}/tests/mocks/` or `packages/{package}/tests/jest-mocks/` (for local package mocks)
3. **If found**: Import and use with `MockProvider(MyService, MyServiceMock())`
4. **If not found**: Create a reusable mock following conventions:
    - Name: `MyServiceMock`
    - Location: `packages/{package}/tests/mocks/{category}/my-service.mock.ts`
    - Export for reuse
5. **Only use inline mocks** for one-off test-specific scenarios
