---
inclusion: always
---

# Project Context

## Domain & Purpose

**Industry:** iGaming / Online Gaming Platform

**Primary Products:**
- Sports Betting (packages/sports)
- Casino (packages/casino)
- Bingo (packages/bingo)
- Poker (packages/poker)
- Lottery (packages/lottery)
- My Account (packages/myaccount)
- Promotions (packages/promo)
- Engagement (packages/engagement)
- Horse Racing (packages/horseracing)

**Target Platforms:** Web (desktop + mobile web), native mobile wrappers (iOS/Android)

**Multi-Brand Architecture:** Themepark system supports multiple white-label brands with shared codebase and brand-specific theming

## Tech Stack

**Framework:** Angular 20.x with standalone components

**Monorepo:** Nx with Module Federation for runtime composition

**Language:** TypeScript (strict mode)

**Build:** Angular's esbuild-based application builder with Module Federation support, ng-packagr for libraries

**Backend:** .NET services (coordinate API changes with backend team)

**State Management:** Angular Signals (primary), RxJS for async streams

**Testing:**
- Unit: Jest + Vitest
- E2E: Playwright
- Linting: ESLint

**Rendering:** Server-Side Rendering (SSR) enabled for SEO and performance

## Architecture Overview

**Monorepo Structure:** Nx workspace with Module Federation for runtime composition. See `04-monorepo-and-packages.md` for detailed package organization, dependency rules, and import conventions.

**Key Patterns:**
- **Module Federation:** Products composed at runtime (never static imports)
- **Dependency Flow:** Products → Global/Shared → Framework (one-way only)
- **Routing:** Culture-based URLs with lazy loading (`{culture}/{vertical}/{path}`)
- **API Integration:** REST APIs via data-access libraries
- **Authentication:** Centralized in vanilla/features with guards and interceptors

## Design System Integration

**Location:** `packages/design-system/ui/{component}/`

**Usage:** All product UIs must use DS components for consistency and accessibility

**Theming:** Semantic tokens via Themepark, brand-specific configurations

**Migration:** Active migration from legacy CSS to standardized DS components (see `.kiro/steering/topics/design-system/`)

**Critical Rules:**
- Use component inputs, never override DS component styles
- Apply `inverse="true"` for dark backgrounds
- Use semantic tokens for application styling
- Never apply utility classes to DS component hosts

## Performance & SSR Requirements

**Critical Metrics:** LCP < 2.5s, INP < 200ms, CLS < 0.1

**SSR Constraints:**
- Never access `window`/`document` directly (use injection tokens)
- Always use `Renderer2` for DOM manipulation
- Use `afterNextRender()` for browser-only initialization
- Provide server overrides for browser-dependent services

**Change Detection:**
- Use `ChangeDetectionStrategy.OnPush` for all new components
- Use signals for reactive state, `computed()` for derived state
- Never use `async` pipe (use `toSignal()` instead)
- Never use getters in templates

**Image Optimization:** Always use `NgOptimizedImage` with `ngSrc`, `width`, `height`, `priority`, `sizes`, and `ngSrcset`

## Active Migrations & Conventions

**Current Migrations:**
- Legacy CSS → Design System components (ongoing)
- NgModules → Standalone components (completed for most products)
- Karma → Jest/Vitest (ongoing)

**Deprecated Patterns:**
- Direct DOM manipulation (use `Renderer2`)
- `async` pipe (use `toSignal()`)
- `ngClass`/`ngStyle` (use direct bindings)
- Manual change detection (use signals)

**Git Workflow:**
- Branch format: `f/{initials}-{ticket}-{description}`
- Commit format: `<type>(<scope>): <subject>`
- Always run `yarn nx format:write --base=main` before committing

## Domain Vocabulary

**FFW:** Frontend Framework (ticket prefix)
**DS:** Design System
**MF:** Module Federation
**SSR:** Server-Side Rendering
**Vanilla:** Cross-product shared libraries
**Themepark:** Multi-brand theming system
**Entrypoint:** Main application shell for a product
**Buildable Library:** Library with strict dependency constraints

## Documentation References

- Monorepo & Packages: `.kiro/steering/04-monorepo-and-packages.md`
- Coding Standards: `.kiro/steering/02-coding-standards.md`
- Git Conventions: `.kiro/steering/03-working-with-git.md`
- Design System: `.kiro/steering/topics/design-system/`
- Performance: `.kiro/steering/topics/angular-performance/`
- SSR Patterns: `.kiro/steering/topics/ssr/`
- Architecture Docs: `docs/nx-architecture/`