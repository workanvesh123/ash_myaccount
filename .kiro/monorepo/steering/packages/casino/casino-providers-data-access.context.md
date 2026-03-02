---
inclusion: fileMatch
fileMatchPattern: 'packages/casino/providers-data-access/**/*'
---

# Casino Providers Data Access

**Location**: `packages/casino/providers-data-access/`

**Purpose**: Angular provider configuration for third-party integrations (currently Lottie animations)

**Context**: See `casino-context.md` for casino-wide patterns. This file covers providers-data-access specifics.

**Note**: Despite the name, this library currently only contains provider configuration, not game provider API clients. Consider renaming if scope expands.

## Public API

**Import from barrel only**:
```typescript
import { provideLottie } from '@frontend/casino/providers-data-access';
```

**Exports**:
- `provideLottie()` - Lottie animation library with Material Dialog mocks (SSR-safe)

Never use deep imports into `src/lib/`.

## Library Structure

```
src/
├── index.ts                        # Public barrel
└── lib/
    └── lottie-options.provide.ts   # Lottie provider config
```

Add new providers as separate files in `src/lib/`, export via `index.ts`.

## Provider Patterns

Always use `makeEnvironmentProviders()` for composable provider sets:

```typescript
export function provideThirdPartyLib(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideLibOptions({ 
      player: () => import('heavy-lib') // Lazy load heavy deps
    }),
    { provide: MOCK_TOKEN, useValue: {} }, // SSR-safe mocks
  ]);
}
```

**Critical rules**:
- Provider functions must be pure and side-effect-free
- Always lazy-load heavy dependencies with dynamic imports
- Include SSR-safe mocks for browser-only dependencies
- Return `EnvironmentProviders` for use in `app.config.ts` or route providers
- Never access browser APIs during provider creation

## SSR Compatibility

All providers must work in SSR context:

- Never access `window`, `document`, or browser APIs during provider creation
- Use `afterNextRender()` or platform checks in consuming components
- Provide mock implementations for browser-only tokens (e.g., `MatDialogRef`, `MAT_DIALOG_DATA`)
- Test providers in both browser and SSR contexts

## Dependencies

**Allowed**:
- `@angular/core` - DI primitives
- `@angular/material/dialog` - For mocks only
- `ngx-lottie`, `lottie-web` - Lazy-loaded
- Other `@frontend/casino/*` libs for shared tokens

**Forbidden**:
- Other product imports (`@frontend/sports/*`, `@frontend/bingo/*`)
- UI components, directives, or pipes
- State management libraries
- Direct browser or Node.js APIs

Keep this library lightweight and config-focused.

## Testing

**Framework**: Jest

**Test focus**:
- Provider function returns valid `EnvironmentProviders`
- Lazy imports resolve correctly
- Mock providers prevent DI errors
- No side effects during creation

```typescript
it('should provide Lottie with lazy-loaded player', () => {
  const providers = provideLottie();
  expect(providers).toBeDefined();
});
```

Integration testing happens in consuming applications.

## Known Issues

**Material Dialog mocks**: `MatDialogRef` and `MAT_DIALOG_DATA` are mocked with empty objects to prevent DI errors when Lottie is used outside dialogs. Code expecting real dialog instances may fail.

**Lottie lazy loading**: First animation render has slight delay while `lottie-web` loads dynamically.

**Library scope mismatch**: Name suggests game provider APIs, but currently only contains Lottie config. Restructure if adding actual data access logic.
