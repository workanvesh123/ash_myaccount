---
inclusion: fileMatch
fileMatchPattern: ['packages/global-search/**/*']
---

# Global Search – Package Context

## 1. Role & Scope

### What Global Search is responsible for
- Cross-product search infrastructure providing unified search across all gaming products (sports, casino, bingo, poker, lottery)
- Plugin-based architecture for extensible search data collection from multiple sources
- Client-side search indexing and query execution (no backend dependency)
- Search UI presentation layer with results grouping and navigation
- Search context management and state coordination between products and search panel

### What Global Search is NOT responsible for
- Product-specific search implementations (products contribute data via plugins)
- Backend search APIs or server-side indexing
- Product-specific UI components (uses design system and vanilla components)
- Authentication or user management (uses vanilla services)

**Decision rule:**  
If the change is about **search infrastructure, indexing, or cross-product search UI**, it belongs here.  
If it's about **product-specific search logic or data**, it belongs in the **product package** as a search plugin/contributor.

---

## 2. Library Structure & Responsibilities

### Core libraries
- `context-lib/` – Shared types, interfaces, and context definitions for search system
- `indexer-lib/` – Client-side search indexing engine and query execution
- `collector-lib/` – Data collection orchestration from plugins and contributors
- `bridge-lib/` – Communication bridge between host app and search panel (ingress/egress)
- `service-lib/` – Core search services and business logic
- `presentation-lib/` – Search UI components and panel rendering
- `plugin-lib/` – Plugin system for extensible search data sources
- `data-contributors-lib/` – Built-in data contributors for common search sources
- `persistence-lib/` – Search index persistence and caching
- `proxy-lib/` – Proxy layer for search API abstraction
- `loaders-lib/` – Dynamic loading utilities for search plugins
- `styles-lib/` – Search-specific styling and theming
- `productstub-lib/` – Product integration stubs for testing
- `console-app/` – Development console for testing search functionality
- `test-app/` – Test application for search integration

### Library purpose rules
- `context-lib` → Types, interfaces, events shared across all search libraries
- `indexer-lib` → Search index creation, query parsing, result ranking
- `collector-lib` → Orchestrates data collection from plugins
- `bridge-lib` → Host ↔ Panel communication (events, state synchronization)
- `service-lib` → Core services (search execution, state management)
- `presentation-lib` → UI components (search panel, results, groups)
- `plugin-lib` → Plugin registration, lifecycle, and execution
- `data-contributors-lib` → Reusable data contributors (games, content, navigation)

### Import patterns
```typescript
// ✅ Correct: Barrel exports
import { SearchContext } from '@frontend/global-search/context-lib';
import { SearchIndexer } from '@frontend/global-search/indexer-lib';
import { bootstrap } from '@frontend/global-search/presentation-lib';

// ❌ Wrong: Deep imports
import { SearchContext } from '../../../global-search/context-lib/src/search';
```

---

## 3. Public API & Consumers

### Public exports by library
- `context-lib` – Types, interfaces, events, constants (stable)
- `presentation-lib` – `bootstrap()` function, event identifiers, host component
- `bridge-lib` – Ingress/egress communication interfaces
- `plugin-lib` – Plugin registration and lifecycle hooks
- `data-contributors-lib` – Built-in contributors for common data sources

### Who is allowed to import Global Search
- ✅ Allowed: All product packages (sports, casino, bingo, poker, lottery, myaccount, promo, engagement, horseracing)
- ✅ Allowed: Host app for search panel integration
- ✅ Allowed: Vanilla features for cross-product search integration
- ❌ Not allowed: Design system (DS is a dependency, not a consumer)

**Rule:**  
Products integrate via **plugins** and **data contributors**, not by importing internal search logic. Always use public APIs from barrel exports.

---

## 4. Architecture Patterns

### Plugin-based extensibility
- Products contribute search data via plugins registered with `plugin-lib`
- Plugins implement standard interfaces from `context-lib`
- Collector orchestrates plugin execution and data aggregation
- Indexer builds searchable index from collected data

### Bridge communication pattern
- Host app and search panel communicate via `bridge-lib` (ingress/egress)
- Events flow bidirectionally: host → panel (search requests), panel → host (navigation)
- State synchronization ensures consistent search context across products

### Client-side indexing
- Search index built entirely in browser (no backend dependency)
- Index persisted via `persistence-lib` for performance
- Query execution happens client-side using `indexer-lib`

### Presentation layer
- Search panel rendered via `presentation-lib` components
- Results grouped by type (games, content, navigation)
- Uses design system components for UI consistency

---

## 5. Extension Patterns

### Adding new search data sources
1. Create plugin in product package implementing `context-lib` interfaces
2. Register plugin with `plugin-lib` during product initialization
3. Implement data contributor using patterns from `data-contributors-lib`
4. Test with `console-app` or `test-app`

### Adding new result types
1. Define new types in `context-lib`
2. Update indexer in `indexer-lib` to handle new types
3. Add presentation components in `presentation-lib` for new result rendering
4. Update bridge communication if new events are needed

### Checklist for new code
- [ ] Uses plugin system for product-specific data (never hardcode product logic)
- [ ] Follows existing patterns in `context-lib` for types and interfaces
- [ ] Maintains SSR compatibility (search may initialize on server)
- [ ] Does not introduce circular dependencies between libraries
- [ ] Includes tests for plugin registration and data collection
- [ ] Updates `console-app` or `test-app` for manual testing

---

## 6. Invariants & Contracts

### Architecture invariants
- Search index is built client-side (never depends on backend search APIs)
- Plugins are isolated and cannot access other plugins' data
- Bridge communication is asynchronous and event-driven
- Search panel is product-agnostic (products contribute data, not UI)

### Data contracts
- Plugin data must conform to `context-lib` interfaces
- Search results must include required fields (id, type, title, url)
- Events must follow bridge communication protocol
- Index structure is internal to `indexer-lib` (consumers use query API)

**Rule:**  
Do not change `context-lib` interfaces without coordinating with all products. Breaking changes require migration path for all plugins.

---

## 7. Dependencies & Boundaries

### Allowed dependencies
- `@frontend/design-system/*` – DS components for search UI
- `@frontend/vanilla/core` – Shared services (TimerService, WINDOW token)
- `@frontend/vanilla/ssr` – SSR-safe utilities
- `@angular/*` – Angular framework packages
- RxJS – Reactive programming for events and state

### Forbidden dependencies
- Product packages (`@frontend/sports`, `@frontend/casino`, etc.) – Products depend on search, not the reverse
- Backend packages – Search is client-side only
- Heavy third-party libraries – Keep bundle size minimal

### Third-party usage
- Minimal external dependencies (prefer native browser APIs)
- Any new dependencies must be justified for bundle size impact

**Rule:**  
Global Search is a **shared infrastructure** package. Products integrate via plugins, never by importing product code into search.

---

## 8. Testing Strategy

### Unit tests
- Framework: **Jest**
- Location: Co-located `*.spec.ts` files
- Focus:
  - Indexer query execution and ranking
  - Plugin registration and lifecycle
  - Bridge communication (ingress/egress)
  - Data collection orchestration

### Integration testing
- `console-app` – Manual testing of search functionality with mock data
- `test-app` – Automated integration tests for search panel
- Product E2E tests cover search integration from product perspective

### Test data
- Mock plugins in `productstub-lib` for testing
- Fixtures in `console-app/mocks/` for development

**Rule:**  
Test plugin isolation (plugins cannot interfere with each other). Test bridge communication bidirectionally.

---

## 9. Known Gotchas & FAQ

### Known pitfalls
- **Plugin execution order is not guaranteed** – Plugins must be independent and not rely on execution sequence
- **Search index is rebuilt on data changes** – Avoid frequent plugin data updates (batch changes)
- **Bridge communication is asynchronous** – Never assume immediate response from host or panel
- **SSR compatibility required** – Search may initialize on server, guard browser-only operations
- **Bundle size impact** – Search loads on every page, keep libraries minimal

### Performance considerations
- Index building is CPU-intensive – use web workers if index size grows
- Plugin execution happens on main thread – keep plugins fast
- Persistence reduces index rebuild cost – ensure persistence works correctly
- Search panel lazy loads – only presentation layer loads on demand

### FAQ

**Q: When should I create a new library vs adding to existing ones?**  
A: Add to existing libraries for related functionality. Only create new libraries for distinct architectural layers (e.g., new persistence strategy, new indexing algorithm).

**Q: Where do shared search types belong?**  
A: In `context-lib`. All types, interfaces, and events shared across search libraries live here.

**Q: How do products contribute search data?**  
A: Via plugins registered with `plugin-lib`. Products implement plugin interfaces from `context-lib` and register during initialization.

**Q: Can I import product code into search libraries?**  
A: No. Search is product-agnostic. Products contribute data via plugins, not by importing product code.

**Q: How does search handle SSR?**  
A: Search must be SSR-safe. Use `WINDOW` token, `PLATFORM.runOnBrowser()`, and guard browser-only operations (indexing, persistence).

**Q: Why is search client-side only?**  
A: To avoid backend dependency and enable fast, offline-capable search. Index builds from product-contributed data at runtime.

---

## 10. Related Steering Files

- `01-project-context.md` – Monorepo structure and conventions
- `.kiro/steering/topics/angular-performance/` – Performance patterns (signals, OnPush)
- `.kiro/steering/topics/ssr/` – SSR-safe patterns for browser APIs
- `04-monorepo-and-packages.md` – Dependency boundaries and import rules
