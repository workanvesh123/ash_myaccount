---
inclusion: fileMatch
fileMatchPattern: ['packages/<project>/<lib>/**/*']
description: "Local context for the <lib> Angular library inside <project>. Focus on role, patterns, and invariants. Global/project rules live elsewhere."
---

# <Lib Name> – Angular Library Context

## 1. Role & Scope

### Responsibility
- Type: {{ feature / ui / data-access / util / entrypoint }}
- What this lib is for: {{ 1–3 bullets describing its job }}
- Typical consumers: {{ which apps/libs use it }}

### Out of scope
- Logic that belongs in: {{ other libs or shared modules }}
- Cross-project concerns: {{ auth, payments, global layout, etc. }}

---

## 2. Public API

- Barrel file: `src/public-api.ts` (or `index.ts`)
- Main exports:
  - {{ list key components/services/tokens }}
- Stability:
  - {{ stable / internal / experimental }}

**Rule:** Consumers must import only from the barrel; no deep imports into `src/` internals.

---

## 3. Internal Structure

Short map of where things live:

- `components/` – {{ if any, describe }}
- `services/` – {{ core services }}
- `models/` – {{ types/interfaces }}
- `state/` – {{ NgRx/signals if used }}
- `mappers/` or `utils/` – {{ helpers }}

**Placement rule:**  
Put new code in the closest existing folder with similar responsibility; only create new folders when the pattern clearly doesn’t fit.

---

## 4. Angular Patterns to Follow

- Components:
  - {{ standalone / NgModule-based }} only.
  - Change detection: {{ OnPush / default }}.
- State:
  - {{ signals / NgRx / plain services + BehaviorSubject }}.
- RxJS:
  - {{ e.g. prefer `pipe` + operators, avoid manual `subscribe` in components where possible }}.
- Inputs/Outputs:
  - Follow existing naming/style in this lib.

**Rule:** Match the dominant pattern already used in this library, even if the project elsewhere differs.

---

## 5. Invariants & Contracts

- Data assumptions:
  - {{ what inputs this lib expects to always be true }}
- Behavioural guarantees:
  - {{ what this lib promises to callers (e.g. sorted lists, filtered items) }}
- Error handling:
  - {{ how errors are surfaced (throw, return empty, use notifier, etc.) }}

**Rule:** Don’t change contracts for exported APIs without updating all known consumers and tests.

---

## 6. Dependencies

### Allowed
- Internal:
  - {{ allowed libs / shared packages }}
- Angular:
  - {{ common Angular/CDK/Material parts used here }}

### Forbidden
- Direct imports from other products/verticals.
- Imports that introduce circular dependencies.
- New global singletons or root providers unless explicitly required.

**Rule:** If you need a new shared dependency, consider adding it to a shared lib instead of directly here.

---

## 7. Testing Expectations

- Unit tests:
  - Framework: {{ Jest / Karma }}.
  - Location: `*.spec.ts` next to the code.
  - Focus: public API, critical logic, regressions that previously occurred.
- Optional integration tests:
  - {{ if applicable, e.g. DI wiring / module configs }}

**Rule:** Any change to public behavior should be covered by at least one test that would fail if behavior regresses.

---

## 8. Known Gotchas

- {{ e.g. “Runs on server too – avoid direct `window` access.” }}
- {{ e.g. “Hot path – avoid heavy allocations inside loops.” }}
- {{ e.g. “Some inputs can be undefined initially due to async config.” }}

Add items here over time as real issues are discovered.

---

Fill in this template for <library-name>, limit yourself to 150 lines max.