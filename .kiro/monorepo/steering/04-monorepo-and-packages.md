---
inclusion: always
---

# Monorepo Architecture & Package Organization

## Workspace Structure

This Nx monorepo contains multiple gaming products with shared libraries. Key directories:

- `packages/{product}/` - Product applications (casino, sports, bingo, lottery, poker, myaccount, promo, engagement, horseracing)
- `packages/design-system/` - Shared UI component library (40+ components)
- `packages/vanilla/` - Cross-product shared features and utilities
- `packages/themepark/` - Multi-brand theming system (30+ brands)
- `packages/host-app/` - Application shell, Module Federation orchestration, SSR server
- `packages/loaders-lib/` - Dynamic feature loading, strategy-based execution, SSR preloading
- `packages/global-search/` - Cross-product search infrastructure, plugin-based indexing
- `packages/payments/` - Cashier, quick deposit, payment provider integrations
- `packages/geo-coordinator-lib/` - Geolocation/geocompliance wrapper (GeoComply, Oobee)
- `backend/` - .NET backend services (coordinate API changes with backend team)
- `native/` - iOS/Android native app wrappers
- `tools/` - Build tooling, scripts, and custom Nx plugins

## Package Classification

| Package | Type | Purpose |
|---------|------|---------|
| `design-system` | Global/Shared | 40+ reusable UI components, semantic tokens, theming |
| `vanilla` | Global/Shared | Cross-product features (auth, navigation, responsible gaming, core utilities) |
| `themepark` | Global/Shared | Multi-brand theming, design tokens, SCSS infrastructure |
| `host-app` | Global/Shared | Application shell, Module Federation orchestration, SSR server |
| `loaders-lib` | Global/Shared | Dynamic feature loading, strategy-based execution, SSR preloading |
| `global-search` | Global/Shared | Cross-product search infrastructure, plugin-based indexing |
| `payments` | Global/Shared | Cashier, quick deposit, payment provider integrations |
| `geo-coordinator-lib` | Global/Shared | Geolocation/geocompliance wrapper |
| `{product}` packages | Product | Product-specific business logic, UI, and state |

**Classification rule:**  
If used by **3+ products** with **no product-specific logic**, it's **global/shared**.  
If it's **product-specific** or **only used by 1-2 products**, it's **product**.

## Product Package Structure

Each product follows this standard pattern:

```
packages/{product}/
├── entrypoint-lib/        # Main app shell, routing, layout
├── features/              # Feature modules (lazy-loaded routes)
│   ├── {feature}-feature/ # Individual feature libraries
├── libs/                  # Product-specific shared code
│   ├── core/             # Services, state, business logic
│   ├── ui/               # Presentational components
│   └── utils/            # Utilities, helpers, pipes
```

**Navigation tip:** When working on a feature, start in `packages/{product}/entrypoint-lib/` for routing, then navigate to `features/{feature}-feature/` for implementation.

## Library Types & Import Rules

### Buildable Libraries

Libraries with `"buildable": true` in `project.json` have strict dependency constraints. Always check `nx graph` before adding imports to buildable libraries.

### Import Paths

Always use `@frontend/{package}` barrel exports, never relative paths across package boundaries.

```typescript
// ✅ Correct
import { DsButton } from '@frontend/ui-button';
import { TimerService } from '@frontend/vanilla/core';

// ❌ Wrong
import { DsButton } from '../../../design-system/ui/button/src/button.component';
```

### Circular Dependencies

Nx enforces an acyclic dependency graph. If an import fails, check `nx graph` for circular references.

## Dependency Rules & Boundaries

### Dependency Direction

```
Products → Global/Shared → Framework
   ↓           ↓
   └─────→ Design System
```

**Critical rule:** Dependencies flow **product → global**, never **global → product**. Breaking this creates circular dependencies and prevents code reuse.

### Global/Shared Package Rules

- ✅ May depend on: Angular framework, RxJS, other global/shared packages, design-system
- ❌ Must NOT depend on: Product packages (sports, casino, bingo, etc.)

### Product Package Rules

- ✅ May depend on: Global/shared packages, design-system, Angular framework
- ❌ Should NOT depend on: Other product packages (use vanilla for shared code)

### Specific Boundaries

- **Design System → Products**: Design system is a dependency of products, never the reverse
- **Vanilla → Products**: Vanilla shared libraries can be used by all products
- **Product ↔ Product**: Products should NOT depend on each other directly (use vanilla for shared code)
- **Backend → Frontend**: Frontend calls backend APIs, never imports backend code

## Module Federation

Products use Module Federation for runtime composition. Never import remote modules statically.

```typescript
// ✅ Correct: Dynamic import
const { CasinoModule } = await import('casino/Module');

// ❌ Wrong: Static import
import { CasinoModule } from '@frontend/casino/entrypoint-lib';
```

**Configuration:** Module federation configs are in each product's `module-federation.config.ts`.

## Placement Guidelines

### When to Use Global/Shared Packages

- **Cross-product features**: Auth, navigation, responsible gaming → `vanilla`
- **UI components**: Buttons, modals, forms → `design-system`
- **Theming**: Brand-specific styles, tokens → `themepark`
- **Infrastructure**: App composition, feature loading → `host-app`, `loaders-lib`
- **Cross-product search**: Unified search → `global-search`
- **Payment flows**: Deposits, withdrawals → `payments`
- **Geolocation**: Compliance, location verification → `geo-coordinator-lib`

### When to Use Product Packages

- **Product-specific business logic**: Betting rules, game mechanics
- **Product-specific UI**: Custom layouts, product-specific components
- **Product-specific state**: Domain models, product-specific services

### Decision Heuristics

1. **Reuse test**: Will 3+ products use this? → Global/shared
2. **Coupling test**: Does this require product-specific knowledge? → Product
3. **Abstraction test**: Can this be made product-agnostic? → Global/shared with configuration

## Editing Global Packages

### Before Modifying Global Packages

- **Impact**: Assume all products depend on it
- **Breaking changes**: Require coordination with all consuming products
- **Testing**: Test changes across multiple products (not just one)

### Design Principles

- **Configuration over hardcoding**: Use inputs, config objects, feature flags
- **Extension points**: Provide hooks, plugins, or callbacks for product-specific behavior
- **Product-agnostic APIs**: Never reference product-specific types or logic
- **Backward compatibility**: Deprecate before removing, provide migration paths

### Anti-Patterns to Avoid

- ❌ Importing product packages into global packages
- ❌ Product-specific conditionals in global code (`if (product === 'sports')`)
- ❌ Hardcoding product-specific values in global packages
- ❌ Breaking changes without deprecation warnings

## Finding Code

**By Feature**: Use `yarn nx graph` to visualize dependencies and find related libraries

**By Component**: Design system components are in `packages/design-system/ui/{component}/`

**By Product**: Product-specific code is isolated in `packages/{product}/`

**By Shared Logic**: Cross-product utilities are in `packages/vanilla/lib/core/` or `packages/vanilla/features/`

## Build & Test Commands

**Important:** Always run Nx commands through Yarn: `yarn nx` (not `nx` directly). This ensures the correct Nx version and workspace configuration is used.

```bash
# Build affected projects
yarn nx affected -t build

# Test affected projects
yarn nx affected -t test

# Visualize dependency graph
yarn nx graph

# Run specific project
yarn nx run {project}:build
```

**Nx Cloud**: Caching is enabled. Never disable it. Builds use distributed task execution.

## Critical Constraints

- Never create circular dependencies between packages
- Never import from `src/` directly, always use barrel exports
- Never break buildable library boundaries (check `nx graph`)
- Never import product code into design-system or vanilla
- Always coordinate breaking changes to shared libraries with all consuming products

## Quick Reference

**Need cross-product UI?** → `design-system`  
**Need cross-product feature?** → `vanilla`  
**Need theming/branding?** → `themepark`  
**Need payment flows?** → `payments`  
**Need search infrastructure?** → `global-search`  
**Need geolocation?** → `geo-coordinator-lib`  
**Need product-specific logic?** → Product package  

**Check dependencies:** `yarn nx graph` or `yarn nx graph --affected`  
**Find package details:** `.kiro/steering/packages/{package}/{package}-context.md`
