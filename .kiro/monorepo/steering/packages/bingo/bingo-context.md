---
inclusion: fileMatch
fileMatchPattern: ['packages/bingo/**/*']
---

# Bingo – Project Context

## 1. Purpose & Domain Scope

### What Bingo is responsible for
- Online bingo game rooms with multiple ball variants (90-ball, 80-ball, 75-ball, 50-ball, 40-ball, 36-ball, 30-ball)
- Bingo room scheduling, prebuy tickets, and session bingo
- Bingo tournaments (slot races integration)
- Package bingo and buy-now grid functionality
- Favorite rooms management (authenticated users only)
- Casino game integration within bingo context (side pane, categories)
- Bingo-specific search functionality

### What Bingo is NOT responsible for
- Standalone casino features (owned by `packages/casino`)
- Global authentication flows (owned by `packages/vanilla/features`)
- Cross-product promotions (owned by `packages/promo`)
- Payment processing (owned by `packages/payments`)
- Account management (owned by `packages/myaccount`)

> **TL;DR:** Bingo owns the complete bingo room experience, ticket purchasing, and bingo-specific game launches. Shared features like auth, payments, and global navigation live in vanilla.

---

## 2. Code Locations & Library Structure

### Primary libraries
- `packages/bingo/entrypoint-lib/` – App shell, routing, main layout, navigation, bootstrap
- `packages/bingo/frontend-lib/` – Core bingo services, business logic, tournaments integration
- `packages/bingo/ui-lib/` – Bingo-specific UI components (rooms list, tickets, session bingo, packages)
- `packages/bingo/lobby-lib/` – Lobby-specific functionality
- `packages/bingo/loader-lib/` – Bingo game loader utilities
- `packages/bingo/e2e/` – E2E test utilities and page objects

### Library purpose rules
- `entrypoint-lib` → Routing, guards, resolvers, main shell components
- `frontend-lib` → Services, state management, API integration, tournaments
- `ui-lib` → Presentational and container components for bingo features
- `lobby-lib` → Lobby-specific logic and components
- `loader-lib` → Game loading and iframe launcher utilities
- `e2e` → Test infrastructure (not imported by production code)

### Import patterns
```typescript
// ✅ Correct: Barrel exports
import { RoomsListComponent } from '@frontend/bingo/ui-lib/shared';
import { BingoSlotRacesWrapperComponent } from '@frontend/bingo/frontend-lib/bingo-tournaments';

// ❌ Wrong: Deep imports
import { RoomsListComponent } from '../../../bingo/ui-lib/shared/rooms-list.component';
```

---

## 3. Routing & URL Patterns

### Base route
- `/{culture}/bingo/...` (culture-based routing via host app)
- Standalone: `/bingo/...` (when mounted directly)

### Primary routes
- `/` – Home page (default bingo landing)
- `/schedule` – All rooms schedule view
- `/schedule/{ball-type}` – Filtered by ball variant (e.g., `/schedule/90-ball`)
- `/schedule/free-rooms` – Free bingo rooms only
- `/schedule/games-info/{room-name}` – Room details
- `/rooms` – Rooms list with nested ball-type routes
- `/myfavourites` – User's favorite rooms (requires auth)
- `/prebuy` – Prebuy tickets view
- `/sessionbingo` – Session bingo (requires prebuy guard)
- `/packagebingo` – Package bingo (requires prebuy guard)
- `/sessionpopup` – Buy now grid (requires prebuy guard)
- `/bingotournaments` – Bingo tournaments (requires tournaments guard)
- `/games/{categoryId}` – Casino games within bingo context
- `/search` – Bingo-specific search
- `/casinosidepane` – Casino side panel integration

### Forced redirects (legacy support)
- `/forcedgamelaunch/{gameName}` – Direct game launch
- `/forcedprebuy` – Force prebuy flow
- `/forcedfavourite` – Force favorite redirect

### Routing rules
- All routes use lazy-loaded standalone components
- `ConfigResolver` resolves bingo configuration for all routes
- Guards: `AuthGuard`, `PrebuyGuard`, `TournamentsGuard` control access
- Product activation/deactivation via `bingoProductActivateGuard` and `bingoProductDeactivateGuard`
- Use `routeData({ allowAnonymous: true })` for public routes

---

## 4. Dependencies & Boundaries

### Allowed dependencies
- `@frontend/design-system/*` – DS components (buttons, modals, cards, etc.)
- `@frontend/vanilla/core` – Shared services (ProductService, TimerService, etc.)
- `@frontend/vanilla/features/*` – Cross-product features (auth, navigation, etc.)
- `@frontend/vanilla/ssr` – SSR utilities and platform abstractions

### Forbidden dependencies
- `@frontend/casino/features/*` – Casino feature libraries (use casino entrypoint only)
- `@frontend/sports/*` – Sports-specific code
- `@frontend/poker/*` – Poker-specific code
- Other product feature libraries

### Boundary guidelines
- Bingo exports public APIs via barrel exports in each library
- Never import from other products' internal feature libraries
- Casino integration happens via iframe launchers and side panes, not direct imports
- Shared bingo logic should live in `frontend-lib` or `ui-lib`, not duplicated across components

---

## 5. State Management & Data Flow

### State pattern
- **Services with Signals** – Primary pattern for reactive state
- **BehaviorSubject** – Legacy pattern (being migrated to signals)
- **Local component state** – Use `signal()` for component-scoped state

### Where state lives
- `frontend-lib/core/` – Global bingo state (room data, configuration, user preferences)
- `frontend-lib/bingo-tournaments/` – Tournament-specific state
- `ui-lib/shared/` – Component-level state (UI interactions, local filters)
- Components – Local UI state using signals

### Data flow
```
API → BingoService (frontend-lib) → Component (ui-lib) → Template
```

### State management rules
- Never store bingo-specific state in vanilla global stores
- Use `toSignal()` to convert observables to signals in components
- Always use `ChangeDetectionStrategy.OnPush` with signals
- Clean up subscriptions with `takeUntilDestroyed()`

---

## 6. Design System & UI Conventions

### UI patterns to follow
- Use DS components for all interactive elements (buttons, modals, cards)
- Apply `inverse="true"` to DS components on dark backgrounds
- Use semantic tokens for custom styling (never hardcode colors)
- Never apply utility classes directly to DS component hosts

### Bingo-specific patterns
- Room cards use `DsCard` with appropriate variants
- Navigation uses `DsButton` or `DsListItem` for menu items
- Modals use `DsModal` for overlays and confirmations
- Loading states use `DsLoadingSpinner`

### What to avoid
- Custom button implementations (use `DsButton`)
- Custom modal implementations (use `DsModal`)
- Overriding DS component CSS with `::ng-deep` or host styles
- Mixing legacy CSS classes with DS components

---

## 7. Migrations & Legacy Areas

### Active migrations
- **Karma → Jest/Vitest** – Test framework migration in progress
- **NgModules → Standalone** – Most components migrated, some legacy modules remain
- **Legacy CSS → Design System** – Ongoing migration to DS components

### Legacy patterns (do not extend)
- `BingoRoutesModule` – NgModule-based routing (use standalone routes for new features)
- Direct DOM manipulation – Use `Renderer2` and SSR-safe patterns
- `async` pipe – Use `toSignal()` instead
- Manual change detection – Use signals for automatic updates

### Migration rules
- New components must be standalone with `ChangeDetectionStrategy.OnPush`
- New features must use DS components, not legacy CSS
- New state must use signals, not BehaviorSubject
- New tests must use Jest, not Karma

---

## 8. Non-Functional Priorities

### Performance considerations
- Bingo rooms list is data-heavy (optimize with virtual scrolling if needed)
- Game iframe launches must be fast (preload critical resources)
- Schedule views load many rooms (use lazy loading and pagination)
- Casino integration should not block bingo rendering

### Reliability concerns
- Ticket purchasing is critical (ensure proper error handling)
- Session bingo requires stable WebSocket connections
- Room availability must be real-time accurate
- Prebuy flows must handle payment failures gracefully

### Accessibility notes
- Room cards must be keyboard navigable
- Game launches must announce state changes to screen readers
- Modals must trap focus and restore on close
- All interactive elements must have proper ARIA labels

---

## 9. Testing Strategy

### Unit testing
- **Framework:** Jest (migrating from Karma)
- **Location:** Co-located with source files (`*.spec.ts`)
- **Pattern:** Test services and components in isolation
- **Coverage:** Focus on business logic in `frontend-lib` and `ui-lib`

### E2E testing
- **Framework:** Playwright
- **Location:** `packages/bingo/e2e/`
- **Critical flows:**
  - Room browsing and filtering by ball type
  - Ticket purchasing (prebuy, session, package)
  - Favorite rooms management
  - Game launching from schedule
  - Tournament participation

### Test data
- E2E utilities: `packages/bingo/e2e/core/`, `packages/bingo/e2e/data-access/`
- Mock services and fixtures in `*.spec.ts` files

---

## 10. Known Gotchas & Local FAQ

### Known gotchas
- **ConfigResolver runs on every route** – Bingo configuration is resolved for all routes, ensure it's cached appropriately
- **Multiple ball-type routes** – Schedule and rooms have duplicate route definitions for each ball variant (30, 36, 40, 50, 75, 80, 90)
- **Guard dependencies** – `PrebuyGuard` and `TournamentsGuard` control feature access, check guard logic before adding routes
- **Casino integration** – Casino games in bingo context use iframe launchers, not direct component imports
- **Legacy forced redirects** – Support old URL patterns for backward compatibility

### FAQ

**Q: When should I create a new library vs adding to existing ones?**
A: Add to `ui-lib` for new UI components, `frontend-lib` for new services/state, `entrypoint-lib` for routing changes. Only create new libraries for distinct feature domains.

**Q: Where do shared bingo models belong?**
A: Shared models live in `frontend-lib/core/` and are exported via barrel exports.

**Q: How does bingo interact with the host app?**
A: Via `BingoRoutesModule` which registers the product with `ProductService` and provides route guards for activation/deactivation.

**Q: Can I import casino components directly?**
A: No. Casino integration happens via iframe launchers and side panes. Never import casino feature libraries directly.

**Q: Why are there so many duplicate routes for ball types?**
A: Legacy URL structure support. Consider refactoring to use route parameters instead of separate routes for each ball type.
