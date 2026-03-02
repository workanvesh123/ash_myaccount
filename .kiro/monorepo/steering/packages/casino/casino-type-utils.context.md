---
inclusion: fileMatch
fileMatchPattern: 'packages/casino/type-utils/**/*'
---

# Casino Type Utils – Shared TypeScript Types

## 1. Role & Scope

### Responsibility
- **Type**: Utility library (pure TypeScript, no Angular dependencies)
- **Purpose**: Shared TypeScript types, interfaces, and utility classes for all Casino packages
- **Key principle**: Framework-agnostic - contains only native TypeScript (no Angular imports)
- **Typical consumers**: All Casino libraries (entrypoint-lib, platform-lib, ui-lib, providers-data-access)

### Out of scope
- Angular-specific code (components, services, directives, pipes)
- Runtime logic or business rules (belongs in platform-lib/core)
- API client implementations (belongs in providers-data-access)
- UI components (belongs in ui-lib)

**Decision Rule**: If it's a pure type definition or lightweight utility class with no framework dependencies, it belongs here. If it requires Angular or has runtime behavior, it belongs elsewhere.

---

## 2. Public API

- **Barrel file**: `src/index.ts`
- **Main exports**:
  - `ContentImageType` - Image content type definitions
  - `OnboardingType` - User onboarding flow types
  - `WizardType` - Wizard/stepper flow type definitions
  - `WizardClass` - Lightweight wizard state utility class
- **Stability**: Stable (shared across all Casino packages)

**Rule**: Consumers must import only from `@casinocore/type-utils` barrel export. Never use deep imports into `src/lib/` internals.

```typescript
// ✅ Correct
import { WizardType, WizardClass } from '@casinocore/type-utils';

// ❌ Wrong
import { WizardType } from '@casinocore/type-utils/src/lib/types/wizard.type';
```

---

## 3. Internal Structure

```
src/
├── index.ts              # Barrel export
└── lib/
    ├── types/            # TypeScript type definitions and interfaces
    │   ├── content-image.type.ts
    │   ├── onboarding.type.ts
    │   └── wizard.type.ts
    └── classes/          # Lightweight utility classes (no Angular)
        └── wizard.class.ts
```

**Placement rule**:
- New type definitions → `lib/types/`
- New utility classes (pure TypeScript) → `lib/classes/`
- Always export from `index.ts` barrel

---

## 4. Code Patterns to Follow

### Pure TypeScript Only
- **No Angular imports**: Never import from `@angular/*` packages
- **No framework dependencies**: No RxJS, no third-party UI libraries
- **No runtime side effects**: Types and classes should be stateless utilities

### Type Definition Style
```typescript
// ✅ Correct: Pure type definitions
export type ContentImageType = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
};

export interface OnboardingStep {
  id: string;
  title: string;
  completed: boolean;
}

// ❌ Wrong: Angular-specific code
import { Injectable } from '@angular/core';
export class OnboardingService { } // Belongs in platform-lib
```

### Utility Class Pattern
```typescript
// ✅ Correct: Lightweight stateless utility
export class WizardClass {
  static getNextStep(current: number, total: number): number {
    return Math.min(current + 1, total - 1);
  }
}

// ❌ Wrong: Stateful service-like class
export class WizardManager {
  private currentStep = 0; // State belongs in Angular service
}
```

---

## 5. Invariants & Contracts

### Data Assumptions
- All exported types are immutable contracts
- Types represent data shapes, not runtime behavior
- Utility classes are stateless and side-effect-free

### Behavioral Guarantees
- Types are stable across Casino packages
- Breaking changes require coordinated updates across all consumers
- Utility classes produce deterministic outputs for given inputs

### Error Handling
- Types cannot throw errors (compile-time only)
- Utility classes should validate inputs and return safe defaults or throw descriptive errors

**Rule**: Never change exported type shapes without updating all known consumers. Use deprecation warnings for gradual migrations.

---

## 6. Dependencies

### Allowed
- **TypeScript standard library only**
- `tslib` (TypeScript runtime helpers)

### Forbidden
- `@angular/*` packages (this is NOT an Angular library)
- `rxjs` (use in platform-lib instead)
- Any UI framework dependencies
- Runtime dependencies that increase bundle size

**Rule**: If you need Angular or RxJS, the code belongs in platform-lib/core, not type-utils.

---

## 7. Testing Expectations

- **Framework**: Jest (configured via `jest.config.ts`)
- **Location**: `*.spec.ts` next to source files
- **Focus**: 
  - Type inference correctness (TypeScript compiler tests)
  - Utility class logic (if any runtime behavior exists)
  - Edge cases for utility functions

**Rule**: Since this library is primarily types, testing focuses on ensuring type definitions compile correctly and utility classes behave as expected.

---

## 8. Known Gotchas

### No Angular Allowed
This library must remain framework-agnostic. If you need Angular features, move the code to platform-lib/core.

### Shared Across All Casino Packages
Changes to exported types affect entrypoint-lib, platform-lib, ui-lib, and providers-data-access. Always check consumers before making breaking changes.

### Build Target is TSC, Not ng-packagr
This library uses `@nx/js:tsc` executor (not Angular's ng-packagr). It produces plain JavaScript, not Angular-compatible metadata.

### Import Path is @casinocore/type-utils
Unlike other Casino libraries that use `@frontend/casino/*`, this library uses `@casinocore/type-utils` for historical reasons. Do not change this without coordinating with all consumers.
