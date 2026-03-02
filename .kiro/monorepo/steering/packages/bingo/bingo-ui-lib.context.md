---
inclusion: fileMatch
fileMatchPattern: ['packages/bingo/ui-lib/**/*']
---

# Bingo UI Lib – Angular Library Context

## 1. Role & Scope

### Responsibility
- **Type:** UI library (presentational and container components)
- **Purpose:**
  - Bingo-specific UI components (rooms list, room items, tickets, session bingo, packages)
  - Reusable widgets (BingoWidget, timers, sliders, toggles, dropdowns)
  - Bingo-specific pipes (time formatting, name truncation, search filtering)
  - Bingo-specific filters and sorting utilities
  - Guard services (auth, prebuy, tournaments)
  - UI-related services (favorites, toast messages, winners info, pre-buy)
- **Consumers:** `bingo/entrypoint-lib`, `bingo/lobby-lib`, bingo route components

### Out of scope
- Core bingo business logic (belongs in `frontend-lib`)
- Routing and app shell (belongs in `entrypoint-lib`)
- Cross-product shared components (belongs in `design-system` or `vanilla/features`)

---

## 2. Public API

**Barrel file:** `shared/public-api.ts`

**Main exports:**
- **Components:** RoomsListComponent, RoomsItemComponent, SessionBingoComponent, TicketsComponent, NewGameTileComponent, FavouriteComponent, BingoWidgetComponent, TimerComponent, ToastMessageComponent, WinnercardComponent, WinnersInfoComponent, PopupComponent, QuickInfoModalComponent, FilterAndSortingComponent, FacetsComponent, SliderComponent, TileSliderComponent, ToggleComponent, TouchSpinComponent, DropdownComponent, SelectDropdownComponent, CollapsibleContainerComponent, EmbeddedGameViewComponent, AlertMessageComponent, BonusSupressionComponent, SuperLinkPopupComponent, OpenerComponent, BtnToggleComponent, TrackingComponent, FeatureIconComponent
- **Services:** BingoFavouriteService, PreBuyService, SessionPackageService, ToastMessageService, WinnersInfoService, GlobalSearchService, ScreenNameService, BrandRoomDesignService, PerformanceMarkerService, AuthGuardService, PrebuyGuardService, BingoTournamentsGuardService, LoginService
- **Pipes:** BgFloatTruncatePipe, HighlightPipe, NameTruncatePipe, ReplacePipe, SearchGamesPipe, TimeAgoPipe, SitecoreImageResizePipe
- **Filters:** BallTypeFilter, BingoTournamentFilter, GameListSort, HiddenFilter, KeyValueFilter, SortFilter
- **Models:** FacetItems, Games, shared models

**Stability:** Stable (consumed by bingo entrypoint and lobby)

**Rule:** Consumers must import only from `@frontend/bingo/ui-lib/shared` barrel; no deep imports into `src/` internals.

---

## 3. Internal Structure

```
shared/src/
├── components/          # All UI components
│   ├── rooms-list/     # Main rooms list container
│   ├── rooms-item/     # Individual room card
│   ├── session-bingo/  # Session bingo UI
│   ├── tickets/        # Ticket display components
│   ├── new-game-tile/  # Game tile component
│   ├── favourite/      # Favorite button/indicator
│   ├── BingoWidget/    # Bingo widget
│   ├── timer/          # Timer display
│   ├── toast-message/  # Toast notifications
│   ├── winnercard/     # Winner card display
│   ├── winnersinfo/    # Winners information
│   ├── popup/          # Generic popup
│   ├── quick-info-modal/ # Quick info modal
│   ├── filter-and-sorting/ # Filter/sort controls
│   ├── facets/         # Faceted search
│   ├── slider/         # Slider component
│   ├── tile-slider/    # Tile slider
│   ├── toggle/         # Toggle switch
│   ├── touch-spin/     # Touch spin control
│   ├── dropdown/       # Dropdown component
│   ├── select-dropdown/ # Select dropdown
│   ├── collapsible-container/ # Collapsible container
│   ├── embedded-game-view/ # Embedded game view
│   ├── screen-name/    # Screen name display
│   ├── alert-message/  # Alert messages
│   ├── bonus-supression/ # Bonus suppression
│   ├── super-link-popup/ # Super link popup
│   ├── opener/         # Opener component
│   ├── btn-toggle/     # Button toggle
│   ├── Tracking/       # Tracking components
│   └── feature-icon/   # Feature icons
├── services/           # UI-related services
├── pipes/              # Bingo-specific pipes
├── filters/            # Filter and sort utilities
└── models/             # Shared models and types
styles/                 # Legacy SCSS (being migrated to DS)
```

**Placement rule:** Add new UI components to `components/`, new pipes to `pipes/`, new filters to `filters/`. Only create new folders for distinct component families.

---

## 4. Angular Patterns

### Components
- **Mix of standalone and NgModule-based** (migration in progress)
- **Change detection:** Default (legacy), OnPush for new components
- **New components:** Must be standalone with OnPush

### State
- **Local component state** via `signal()` (preferred)
- **Services with BehaviorSubject** (legacy pattern, being migrated to signals)
- **No global state** – UI state is component-scoped or service-scoped

### RxJS
- Use `pipe` + operators, avoid manual `subscribe` in components
- Convert observables to signals with `toSignal()` in components
- Clean up subscriptions with `takeUntilDestroyed()`

### Inputs/Outputs
- Use `input()` and `output()` for new components
- Legacy components use `@Input()` and `@Output()` decorators

**Rule:** New components must be standalone with OnPush. Match existing patterns for similar components (e.g., room cards, game tiles).

---

## 5. Invariants & Contracts

### Data assumptions
- Room data comes from `frontend-lib` services
- User authentication state is managed by vanilla auth services
- Configuration is resolved via `ConfigResolver` in entrypoint

### Behavioral guarantees
- Components are presentational and don't directly call APIs
- Services handle UI-specific logic (favorites, toast messages, pre-buy flows)
- Filters and pipes are pure functions (no side effects)

### Error handling
- Services surface errors via toast messages or return empty results
- Components display error states via conditional rendering
- Guard services redirect to appropriate routes on failure

**Rule:** Don't change component inputs/outputs or service method signatures without updating all consumers and tests.

---

## 6. Dependencies

### Allowed
- `@frontend/bingo/frontend-lib` – Core bingo services and state
- `@frontend/design-system/*` – DS components (migrate legacy components to DS)
- `@frontend/vanilla/core` – Shared services (TimerService, etc.)
- `@frontend/vanilla/features/*` – Cross-product features (auth, navigation)
- `@frontend/vanilla/ssr` – SSR utilities

### Forbidden
- `@frontend/casino/features/*` – Casino feature libraries
- `@frontend/sports/*` – Sports-specific code
- `@frontend/poker/*` – Poker-specific code
- Other product internal libraries

**Rule:** If you need shared UI logic, add it to this library. If it's cross-product, add it to `vanilla/features`.

---

## 7. Testing Expectations

**Framework:** Jest (migrating from Karma)

**Location:** `*.spec.ts` co-located with components/services

**Focus:**
- Component rendering and user interactions
- Service logic (favorites, pre-buy, toast messages)
- Pipe transformations
- Filter and sort utilities

**Rule:** New components must have tests covering rendering and key interactions. Service changes must verify behavior with unit tests.

---

## 8. Known Gotchas

- **Legacy SCSS styles** – `styles/` folder contains legacy styles being migrated to DS components; avoid extending these styles
- **Mix of standalone and NgModule components** – Some components are still NgModule-based; new components must be standalone
- **Guard services in UI lib** – Auth, prebuy, and tournaments guards live here (consider moving to entrypoint or frontend-lib)
- **SSR compatibility** – Components run on server; avoid direct `window`/`document` access (use injection tokens)
- **Rooms list performance** – Rooms list can be data-heavy; consider virtual scrolling for large datasets
- **Toast message service** – Global singleton for notifications; ensure proper cleanup on component destruction
- **Favorite service** – Requires authentication; handle unauthenticated state gracefully
- **Pre-buy flows** – Complex multi-step flows; ensure proper state management and error handling
