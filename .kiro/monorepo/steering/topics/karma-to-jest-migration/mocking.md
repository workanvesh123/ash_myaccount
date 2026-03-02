---
inclusion: manual
description: "Topic steering for Mocking in this Angular monorepo. Read when working on mocking-related changes."
---

# Mocking – Topic Steering

## 1. Scope – When to Read This

### This file applies when you:
- refactor unit tests from karma/jasmine to jest
- create new mocks for dependencies and providers
- expose new or existing mocks via public api or barrel files

### This file does NOT cover:
- other refactoring efforts in the non-spec files

**Rule:** If your primary concern is **mocking**, consult this file. Otherwise, defer to project/library contexts.

---

## 2. Core Principles

- **P1 – Consistent mocking strategy:** Always use ng-mocks and Jest to create mock objects out of services or components that are used in the test files.
- **P2 – Separation of mocks per project:** Always store the mocks outside the spec files, based on the library that contains the actual implementation of the tested file
- **P3 – Mock location hierarchy:** Place new mocks in the appropriate location based on this priority:
    1. If a `tests` folder exists in the package (e.g., `packages/promo/entrypoint-lib/tests/jest-mocks/promo/`), place mocks there
    2. If the service is from a shared library with a jest-mocks export (e.g., `@frontend/vanilla/testing`, `@frontend/promo-utils/jest-mocks`), use those
    3. Otherwise, create a `tests` folder in the appropriate package
- **P4 – Share the mocks if possible:** Look for existing mocks before creating new ones

> These principles should be stable over time and guide decisions when trade-offs appear.

---

## 3. Do / Don’t Guidelines

### Do
- use the `MockProvider` function from `ng-mocks`
- use `jest.fn()` to mock the methods
- replace jasmine and moxxi mocks by ng-mocks and jest alternative
- try to re-use existing mocks exposed from other libs in case they are part of the public api or barrel file
- prefer `jest.spyOn(mockObject, 'methodName').mockReturnValue(value)` over type casting `(mockObject.methodName as jest.Mock).mockReturnValue(value)`

### Don’t
- never change existing `jest` and `ng-mocks` that might be used by other libs

---

## 4. Standard Patterns (How We Usually Do It)

Step-by-step to-do list to follow:
1. Identify moxxi mocks
2. Look for existing jest alternatives, and use them if there are some
3. If there's no alternative, create a separate file and implement the mock using `ng-mocks` and `jest` based on the existing jasmine and moxxi implementation
4. Place the new mock in the correct location:
    - **For package-specific services:** Use `packages/{package}/tests/{category}/` (e.g., `packages/promo/entrypoint-lib/tests/jest-mocks/promo/`)
    - **For shared library services:** Check if the library already exports mocks (e.g., `@frontend/vanilla/testing`)
5. Expose the new mock if there's a related barrel file (index.ts)
6. Import the newly created mock via tsconfig path alias (if there's one)
---

## 5. Implementation Checklist

A short checklist devs (or AI) can tick mentally when working on this topic.

- [ ] Have you replaced all the moxxi and jasmine mocks with their jest and ng-mocks alternatives
- [ ] Have you removed all the moxxi and jasmine references?
- [ ] Have you stored the mocks in the correct location (`tests/{category}/` for package-specific mocks)?
- [ ] Have you checked the existing mocks of required providers before creating new ones?
- [ ] Have you exposed new mocks via barrel files (index.ts) where appropriate?

---

## 6. Common Pitfalls & Anti-Patterns

List the **real-world mistakes** you’ve actually seen:

- ❌ Creating vanilla-related mocks in other libraries
    - The vanilla mocks always live in vanilla-testing lib and are consumed from there via `@frontend/vanilla/testing` tsconfig path alias
- ❌ Placing mocks in the wrong location
    - Package-specific mocks should go in `packages/{package}/tests/{category}/`, not alongside the source files or in random locations
- ❌ Mixing up jasmine and jest mocks
    - Always make sure to separate obsolete mocks from the new ones and store them separately (e.g. in a new jest-mocks folder)
- ❌ Avoid moxxi and jasmine references
    - Such references break the unit tests execution process

Whenever you discover a new “we keep breaking this”, add it here.

---

## 7. Small Examples

One or two **small, focused** examples that embody the topic’s rules.  
(Keep them tiny – this file is not a cookbook.)

- This is how the obsolete mock's usage looks like usually:
```ts
import { RouteDateServiceMock } from '@frontend/promo-utils-tests';
import { MockContext } from 'moxxi';

// ...

beforeEach(() => {
        MockContext.useMock(RouteDataServiceMock);

        TestBed.configureTestingModule({
          providers: [MockContext.providers]
        }).compileComponents();
});
```

This is how the obsolete mock's implementation looks like usually:
```ts
import { RouteDataService } from '@frontend/vanilla/shared/routing';
import { Mock, Stub } from 'moxxi';

@Mock({ of: RouteDataService })
export class RouteDataServiceMock {
    @Stub() get: jasmine.Spy;
    @Stub() getInitData: jasmine.Spy;
}
```

This is the new way of usage:
```ts
import { RouteDataServiceMock } from '@frontend/vanilla/testing';
import { MockProvider } from 'ng-mocks';
import { RouteDataService } from '@frontend/vanilla/shared/routing';

let routeDataServiceMock: RouteDataService;
// ...
beforeEach(() => {
 await TestBed.configureTestingModule({
            providers: [MockProvider(RouteDataService, routeDataServiceMock)],
        }).compileComponents();
});
```

- This is the new way of implementation:
```ts
import { RouteDataService } from '@frontend/vanilla/shared/routing';
import { MockService } from 'ng-mocks';

export const RouteDataServiceMock = MockService(RouteDataService, {
    getInitData: jest.fn(),
    get: jest.fn(),
});
```
---

## 8. Escalation & Trade-offs

- If mocking conflicts with:
    - existing jest mocks that have a different behavior
- Prefer:
    - try to re-use and override different parts in the spec file directly
      or
    - keep the existing ones and create a brand new one that satisfies the functionality of the jasmine/moxxi mock precisely, but store it within the same library even though it mocks a provider that is implemented elsewhere

**Rule:** When trade-offs are unclear, favor duplication over breaking changes in existing mocks and leave a short comment explaining the decision.

