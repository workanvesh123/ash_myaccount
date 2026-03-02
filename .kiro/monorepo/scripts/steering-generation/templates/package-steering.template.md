---
inclusion: fileMatch
fileMatchPattern: ['packages/<project>/<lib>/**/*']
description: "Local steering file for <lib> inside <project>. Focus on this library's role, invariants, and safe extension patterns. Do not repeat project-level context."
---

# <Lib Name> – Library Context

## 1. Role & Scope of This Library

### What this library does
- {{ Short description of the library's core responsibility }}
- {{ Main feature areas or concerns it owns }}
- {{ Type of code it contains: UI / data-access / core logic / entrypoint }}

### What this library does NOT do
- {{ Things that belong in other libs (UI vs core vs data-access, etc.) }}
- {{ Cross-project concerns that should stay in shared or host libs }}

**Decision rule:**  
If the change is about **{{X}}**, it belongs here.  
If it’s about **{{Y}}**, it should go to **{{other lib}}** instead.

---

## 2. Public API & Intended Consumers

### Public surface
- Main barrel file: `packages/<project>/<lib>/src/public-api.ts` (or `index.ts`)
- Public exports:
  - {{ list the important exported types/services/components }}
- Stability:
  - {{ e.g. "Public exports are stable; breaking changes require deprecation first" }}

### Who is allowed to import this library
- ✅ Allowed:
  - {{ apps / specific libs (e.g. feature libs, ui libs) }}
- ❌ Not allowed:
  - {{ other products, legacy libs, etc. }}

**Rule:**  
Always import from the **public API** (barrel), never from deep internal paths.

---

## 3. Internal Structure & Where to Put New Code

### Directory layout (high-level)
- `core/` – {{ core services, base classes, shared logic }}
- `features/` – {{ feature-specific modules }}
- `components/` – {{ library-local UI components (if any) }}
- `mappers/` – {{ API ↔ domain mapping }}
- `testing/` – {{ test helpers / fixtures }}

### Placement rules
- Put **new feature logic** in: `{{ path }}`
- Put **shared helpers** in: `{{ path }}`
- Put **API mapping / DTO transforms** in: `{{ path }}`

**If unsure:**  
- Prefer **existing folder** with similar responsibility over creating a new one.
- If you must create a new folder, mirror the existing naming pattern.

---

## 4. Extension Patterns (How to Add or Change Things)

### When adding new functionality here
- Follow existing patterns in this library:
  - {{ signals vs RxJS, NgRx vs services, function style, etc. }}
  - {{ synchronous vs asynchronous flows }}
- Keep changes **local**:
  - Prefer composing existing public functions/services over creating new global concepts.

### Checklist for new code
- [ ] Uses the same state / DI pattern as existing code in this folder.
- [ ] Does not introduce new cross-library dependencies.
- [ ] Reuses existing types & helpers where possible.
- [ ] Extends the public API only if needed; otherwise stays internal.
- [ ] Includes tests (unit + any required integration).

---

## 5. Invariants & Contracts

### Business / domain invariants
- {{ Important rules that must always hold – e.g. "games with status X must never be displayed in list Y" }}
- {{ Any assumptions this lib makes about upstream data }}

### Data contracts
- Main input types:
  - {{ e.g. DTOs from API, config objects, feature flags }}
- Main output types:
  - {{ domain models, view models, events }}

**Rule:**  
Do not change shape or semantics of exported types without:
- Updating all consumers, and
- Updating tests and documentation.

---

## 6. Dependencies Inside This Library

### Allowed dependencies (within the monorepo)
- {{ list internal libs this one is allowed to import from }}
- {{ specific shared utilities }}

### Forbidden dependencies
- {{ libs that would create cycles or cross-domain coupling }}
- {{ any direct imports from other products / verticals }}

### Third-party usage
- {{ allowed libraries here (e.g. `date-fns`, `lodash-es`) }}
- {{ any 3rd-party libs that are explicitly banned or must be wrapped }}

**Rule:**  
If a new dependency is needed, prefer:
1. Using an existing shared lib.
2. Adding a wrapper in a shared lib rather than importing from app/other products.

---

## 7. Testing Expectations

### Unit tests
- Test files live alongside source: `*.spec.ts`.
- Focus:
  - {{ what must be covered: critical logic, mappers, core services }}
- Tools:
  - {{ Jest / Testing Library / Spectator, etc. }}

### Integration / contract tests (if applicable)
- {{ e.g. "API mappers have golden tests with fixtures in `testing/`" }}
- {{ e.g. "Public services have integration-style tests using fake backends" }}

**Rule:**  
Any change to public behavior or contracts must be accompanied by tests that would fail on regression.

---

## 8. Migration / Legacy Within This Library

### Legacy sub-areas (avoid extending)
- `legacy/` – {{ description }}
- `deprecated-*` – {{ description }}
- Any file or symbol marked with `@deprecated`.

### Migration guidelines
- New code must use:
  - {{ new patterns / APIs }}
- Old patterns are:
  - {{ read-only / to be refactored when touched }}

**If you touch legacy code:**
- Prefer **strangler** pattern: wrap with new code instead of rewriting everything at once.

---

## 9. Known Pitfalls & Local FAQ

### Known pitfalls
- {{ example: "Service X is instantiated eagerly – do not inject heavy dependencies into it." }}
- {{ example: "Function Y is hot path – avoid allocations or heavy computations in its loop." }}
- {{ example: "Config object is partially undefined on server – guard browser-only fields." }}

### FAQ-style notes
- **Q:** When should I create a new service vs extend an existing one?  
  **A:** {{ short answer }}

- **Q:** Where do I put shared types for this library?  
  **A:** {{ path / pattern }}

- **Q:** When should something move out of this lib into a shared lib?  
  **A:** {{ rules }}

---

Fill in this template for <package-name>, limit yourself to 350 lines max.