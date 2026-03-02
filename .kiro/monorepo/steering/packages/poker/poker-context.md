---
inclusion: fileMatch
fileMatchPattern: ['packages/poker/**/*']
---

# Poker Package Context

## 1. Role & Scope

### What this package does
- Poker product vertical with standalone application and core library
- Poker-specific UI components, widgets, and promotional features (tournaments, timers, feeds, live events)
- Integration with poker client downloads, web client, and third-party content (Twitch, blog feeds, social media)
- Product-specific routing, layouts, and content management for poker portal

### Package structure
- `app/` – Main application entrypoint, routing, and product shell
- `core-lib/` – Reusable poker-specific components, services, and features
- `e2e/` – End-to-end tests for poker application

### What this package does NOT do
- Cross-product features (auth, navigation, payments) → Use `@frontend/vanilla`
- Generic UI components → Use `@frontend/design-system`
- Theming and brand styling → Use `@frontend/themepark`
- Other product verticals (sports, casino, bingo) → Separate packages

**Decision rule:**  
If it's **poker-specific business logic or UI**, it belongs here.  
If it's **reusable across products**, it belongs in `vanilla` or `design-system`.

---

## 2. Public API & Intended Consumers

### poker-core-lib public surface
- Barrel file: `packages/poker/core-lib/src/public-api.ts`
- Key exports:
  - `providePokerSrc()` – Feature provider for poker framework
  - `providePokerAppBootstrap()` – App initialization provider
  - Widget components: `PokerTwitchFeedComponent`, `PokerUpcomingTournamentsComponent`, `PpBlogFeedComponent`
  - Timer components: `PokerSinglePromoTimerComponent`, `PokerDiscountTimerComponent`, `PokerTournamentRibbonComponent`
  - Game components: `PokerMyGameComponent`, `SimulatedHandsComponent`, `BigwinComponent`
  - Container components: `PromotionWrapperComponent`, `PpRibbonContainerComponent`
  - Bootstrap services for lazy-loaded widgets
  - Models and data services

### Who can import poker-core-lib
- ✅ Allowed:
  - `poker-app` (main consumer)
  - Other poker feature libraries within the package
- ❌ Not allowed:
  - Other product packages (sports, casino, bingo, etc.)
  - Global shared libraries (vanilla, design-system)

**Import paths:**  
Poker-core-lib provides multiple import paths:
- `@pokercore/module` – Main barrel export (from `src/public-api.ts`)
- `@pokercore/module/core` – Core services and utilities
- `@pokercore/module/homepage` – Homepage components
- `@pokercore/module/poker-promotions` – Promotions features
- `@pokercore/module/tournament-calendar` – Tournament calendar
- `@pokercore/module/logging` – Logging utilities
- And other feature-specific sub-modules (see `tsconfig.base.json` for complete list)

**Rule:**  
Always import from `@pokercore/module` or `@pokercore/module/{feature-area}` barrel exports, never deep imports into `src/lib/` or internal paths.

---

## 3. Internal Structure & Code Placement

### poker-core-lib directory layout
- `src/lib/` – Main library code
  - `poker-framework.component.ts` – Root framework component
  - `poker-framework.feature.ts` – Feature provider configuration
  - `root-services.module.ts` – Root-level service providers
  - Feature folders (40+ components):
    - `poker-{feature}/` – Self-contained feature modules (e.g., `poker-twitch-feed/`, `poker-my-game/`, `poker-upcoming-tournaments/`, `poker-tournament-widgets/`)
    - `pp-{feature}/` – PartyPoker-specific features (e.g., `pp-blog-feed/`, `pp-ribbon-container/`, `pp-cashier-options/`, `pp-modal-container/`)
    - `partypoker-live/` – PartyPoker Live event widgets
    - `poker-koseries/`, `poker-monsterseries/` – Promotional series features
    - `bigwin/`, `simulated-hands/` – Game-specific features
  - `shared-services/` – Cross-feature services
  - `api/` – API integration and data access
  - `composite-container/` – Wrapper components for promotions
  - `on-app-init/` – Application initialization logic
- Separate feature modules (with own `public-api.ts`):
  - `core/` – Core services, navigation, configurations
  - `homepage/` – Homepage components and wrappers
  - `poker-promotions/` – Promotions resources and pages
  - `tournament-calendar/` – Tournament calendar and scheduling
  - `hand-history/` – Hand history services
  - `logging/` – Logging infrastructure
  - `mobile-banner/`, `poker-download/`, `poker-web-client/` – Client integration features

### Placement rules
- **New widget/feature** → Create `poker-{name}/` or `pp-{name}/` folder in `src/lib/` with component, service, and bootstrap service
- **Shared poker logic** → Add to `shared-services/` in `src/lib/`
- **API integration** → Add to `api/` in `src/lib/`
- **Timer/countdown components** → Follow existing `poker-*-timer/` pattern in `src/lib/`
- **Feed integrations** → Follow existing `poker-{platform}-feed/` pattern (twitch, twitter, youtube, instagram, flickr) in `src/lib/`
- **Standalone feature modules** → Create separate folder at root level (e.g., `core/`, `homepage/`) with own `public-api.ts` if it needs independent import path

**Naming conventions:**
- Component prefix: `pl` for poker-core-lib components (defined in `core-lib/project.json`)
- Component prefix: `pa` for poker-app components (defined in `app/project.json`)
- Feature folders: `poker-{feature-name}/` or `pp-{feature-name}/` in `src/lib/`
- Bootstrap services: `{feature}-bootstrap.service.ts` for lazy-loaded widgets
- Separate modules: `{module-name}/` at root level with own `public-api.ts`

---

## 4. Extension Patterns

### Adding new poker features

**For features in `src/lib/`:**
- Create self-contained feature folder: `poker-{name}/` or `pp-{name}/`
- Include:
  - Component: `{feature}.component.ts`
  - Service: `{feature}.service.ts` (if needed)
  - Bootstrap: `{feature}-bootstrap.service.ts` (for lazy loading)
  - Models: `{feature}.models.ts` (if needed)
- Export from `src/public-api.ts` if consumed by poker-app
- Follow existing widget patterns (see `poker-twitch-feed/`, `poker-my-game/`)

**For standalone feature modules:**
- Create root-level folder: `{module-name}/`
- Include own `public-api.ts` for exports
- Add path mapping to `tsconfig.base.json`: `@pokercore/module/{module-name}`
- Use for large, self-contained domains (see `core/`, `homepage/`, `poker-promotions/`)

### State management patterns
- Use RxJS `BehaviorSubject` and observables for state (existing pattern)
- Services with `@Injectable({ providedIn: 'root' })` for shared state
- Component-level state for isolated features
- NgRx store available but not widely used in poker package

### Async patterns
- Bootstrap services return observables for lazy initialization
- Use `TimerService` from `@frontend/vanilla/core` for timers (SSR-safe)
- HTTP calls via Angular `HttpClient` with proper error handling

### Checklist for new features
- [ ] Self-contained in feature folder with clear naming (`poker-{name}/` or `pp-{name}/`)
- [ ] Bootstrap service if lazy-loaded
- [ ] Exported from appropriate `public-api.ts`:
  - Main `src/public-api.ts` for features in `src/lib/`
  - Feature-specific `{module}/public-api.ts` for separate modules
- [ ] Uses existing shared services where applicable
- [ ] Follows SSR compatibility rules (no direct `window`/`document` access)
- [ ] Uses `TimerService` from `@frontend/vanilla/core` for timers
- [ ] Includes unit tests (`*.spec.ts`)

---

## 5. Dependencies

### Allowed monorepo dependencies
- `@frontend/vanilla/core` – Core utilities, platform services, timers
- `@frontend/vanilla/features/*` – Cross-product features (balance, content, header, menus, navigation)
- `@frontend/vanilla/shared/*` – Shared utilities (browser, routing, swiper, current-session)
- `@frontend/design-system` – UI components (migrate to DS where applicable)
- `@frontend/themepark` – Theming and brand styles

### Forbidden dependencies
- Other product packages (sports, casino, bingo, lottery, myaccount, promo)
- Direct imports from other verticals
- Circular dependencies within poker package

### Third-party libraries (from package.json)
- **UI/Animation:** `@angular/material`, `@ng-bootstrap/ng-bootstrap`, `primeng`, `gsap`, `pixi.js`, `pixi-multistyle-text`
- **Carousels/Sliders:** `@ngu/carousel`, `swiper`, `@angular-slider/ngx-slider`, `ngx-slider-v2`
- **Data tables:** `@swimlane/ngx-datatable`
- **Date/Time:** `moment`, `moment-timezone`
- **Audio:** `howler`
- **Utilities:** `lodash-es`, `hammerjs`, `fontfaceobserver-es`, `custom-event-js`
- **State:** `@ngrx/store` (available but not primary pattern)

**Rule:**  
Prefer `@frontend/design-system` for UI elements (buttons, modals, forms, badges, etc.) over third-party UI libraries. Prefer vanilla shared utilities over adding new third-party dependencies. If a new dependency is needed, coordinate with poker team and ensure it doesn't conflict with monorepo standards.

---

## 6. Testing Expectations

### Unit tests
- Framework: Karma (legacy, migrating to Jest/Vitest)
- Location: `*.spec.ts` next to source files
- Configuration: `karma.conf.cjs` in poker-core-lib and poker-app
- Run: `nx test poker-core-lib` or `nx test poker-app`
- Focus areas:
  - Bootstrap services initialization logic
  - Data services and API mappers
  - Timer and countdown logic
  - Widget component rendering and interactions

### E2E tests
- Framework: Playwright
- Location: `packages/poker/e2e/`
- Tests: Download flows, scroll-to-top, response links
- Run: `nx e2e poker-app`

**Rule:**  
Any new public API or critical business logic must include unit tests. E2E tests for user-facing flows.

---

## 7. Build & Serve

### Development workflow
```bash
# Build core library
nx build poker-core-lib

# Build application
nx build poker-app

# Serve with theme (default port: 9999)
nx serve poker-app -c party-poker

# Run tests
nx test poker-core-lib
nx test poker-app

# E2E tests
nx e2e poker-app
```

### Backend integration
- Backend: .NET service at `backend/poker/Frontend.Poker.Host`
- Run backend: `cd backend/poker/Frontend.Poker.Host && dotnet run`
- Dev proxy: `http://localhost:9999` (poker-app) → Backend API

### Hosts file entry
```
127.0.0.1   dev.www.partypoker.com
```

---

## 8. Known Patterns & Conventions

### Widget bootstrap pattern
Many poker widgets use lazy-loading with bootstrap services:
```typescript
// Bootstrap service returns observable for initialization
export class PokerTwitchFeedBootstrapService {
  bootstrap(): Observable<void> {
    // Initialization logic
  }
}

// Component uses bootstrap service
export class PokerTwitchFeedComponent implements OnInit {
  constructor(private bootstrap: PokerTwitchFeedBootstrapService) {}
  
  ngOnInit() {
    this.bootstrap.bootstrap().subscribe();
  }
}
```

### Timer components
- Use `TimerService` from `@frontend/vanilla/core` (SSR-safe)
- Follow existing patterns in `poker-*-timer/` folders
- Support countdown to specific dates/times
- Handle timezone conversions with `moment-timezone`

### Feed integrations
- Social media feeds: Twitch, Twitter, Instagram, YouTube, Flickr
- Blog feed: PartyPoker blog integration
- Schedule feeds: Tournament schedules and calendars
- Leaderboard feeds: Tournament leaderboards
- All feeds follow similar component + service + bootstrap pattern

---

## 9. Known Pitfalls & FAQ

### Known pitfalls
- **Heavy third-party dependencies:** Poker uses many UI libraries (pixi.js, gsap, primeng). Be mindful of bundle size when adding features.
- **Legacy patterns:** Some components use older Angular patterns (NgModules, manual subscriptions). New code should follow project standards (standalone, signals, OnPush).
- **SSR compatibility:** Poker app runs with SSR. Never access `window`/`document` directly. Use `inject(WINDOW)`, `inject(DOCUMENT)`, or `PLATFORM.runOnBrowser()`.
- **Timer cleanup:** Always clean up timers in `ngOnDestroy()` using `DestroyRef.onDestroy()`.
- **Theme-specific logic:** Some features are PartyPoker-specific (`pp-*` prefix). Ensure new features work across all poker brands.

### FAQ

**Q:** When should I create a new feature folder vs extend an existing one?  
**A:** Create a new folder if it's a distinct widget or feature with its own lifecycle. Extend existing if adding functionality to an existing widget.

**Q:** Where do I put shared types used across multiple poker features?  
**A:** Add to `shared-services/` in `src/lib/` or to the `core/` module if it's truly cross-cutting. Export from appropriate `public-api.ts` if needed by poker-app.

**Q:** When should I create a separate feature module (like `core/`, `homepage/`) vs a folder in `src/lib/`?  
**A:** Create a separate module with its own `public-api.ts` when:
- The feature needs an independent import path (`@pokercore/module/{feature}`)
- It's a large, self-contained domain (promotions, tournament calendar, hand history)
- It's used across multiple parts of the poker app and benefits from isolated imports
Otherwise, keep it in `src/lib/` and export from the main `public-api.ts`.

**Q:** Should I use signals or RxJS observables?  
**A:** Follow project standards (signals for new code), but poker-core-lib currently uses RxJS extensively. Match the pattern in the feature you're modifying.

**Q:** How do I know which import path to use for poker-core-lib?  
**A:** Check `tsconfig.base.json` for available paths. Use `@pokercore/module` for main exports, or `@pokercore/module/{feature}` for specific modules like `core`, `homepage`, `poker-promotions`, etc. Never import directly from file paths.

**Q:** How do I integrate with the poker backend API?  
**A:** Add services to `api/` folder in `src/lib/` or within feature folders. Use Angular `HttpClient` with proper error handling and type safety.

**Q:** When should something move to vanilla instead of staying in poker?  
**A:** If 3+ products need it, it's cross-product logic (auth, payments, navigation), or it's product-agnostic, move it to vanilla. Keep poker-specific business logic here.

---

## 10. Contact & Ownership

**Project Owner:** Poker Team  
**Email:** pokerportal@entaingroup.com, poker.webproduct@EntainGroup.com  
**Scope Tags:** `scope:poker`, `type:app`, `type:lib`
