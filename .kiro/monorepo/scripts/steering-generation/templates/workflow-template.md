---
inclusion: <manual|fileMatch>
fileMatchPattern: '<GLOB_PATTERN_IF_APPLICABLE>' # e.g. '**/*.component.html' or 'packages/<product>/**/*'
---

# <WORKFLOW_NAME> – Workflow Hub

> Use this workflow when working on **<short description of the workflow>**.  
> This file defines when to use the workflow, how to behave, which phases to follow,  
> and which steering files must be read.

---

## When to Use This

Use this workflow when:
- <Trigger 1 – e.g. "migrating legacy UI to Design System components">
- <Trigger 2 – e.g. "implementing a new feature that must follow DS patterns">
- <Trigger 3 – optional>

Do NOT use for:
- <Out-of-scope 1 – e.g. "internal Design System component development">
- <Out-of-scope 2 – e.g. "unrelated refactors or cleanups">

---

## Assistant Behavior When Using This Workflow

When this file is present in context, you MUST:

1. **Announce the phase.**  
   Start each major reply by stating which phase you are in  
   (e.g. `<PHASE_1_NAME>`, `<PHASE_2_NAME>`, `<PHASE_3_NAME>`, `<PHASE_4_NAME>`).

2. **Confirm steering intake.**  
   Before proposing or making changes, explicitly confirm which steering files you have read  
   by ticking items in the **Success Criteria → Steering & Rules Intake** checklist.

3. **Follow scope strictly.**  
   Only propose or perform changes that are within the scope defined by:
   - this workflow (see *When to Use This*), and
   - the user’s instructions (files, features, modules they mention).
   If you want to extend the scope, ask the user for explicit confirmation.

4. **Work phase-by-phase.**  
   Do not skip phases.
   - In each phase, briefly summarize what you are going to do,
   - then do the work,
   - then update the relevant checklist items in **Success Criteria**.

5. **End with explicit verification.**  
   At the end of the workflow, show the **Success Criteria** section with checkboxes  
   and mark each that is satisfied. If any item is not satisfied, explain why.

> This workflow hub does **not** define domain rules itself  
> (performance, SSR, DS APIs, etc.). Always take concrete rules  
> from the referenced steering files.

---

## Goal

- <Primary goal 1 – e.g. "Implement <X> according to <area> rules">
- <Primary goal 2 – e.g. "Preserve existing behaviour / contracts where required">
- <Primary goal 3 – e.g. "Stay within defined scope and boundaries">
- <Primary goal 4 – e.g. "Ensure correctness via appropriate validation/tests">

## Non-goal

- <Non-goal 1 – e.g. "Large-scale refactors beyond this feature/scope">
- <Non-goal 2 – e.g. "Fixing unrelated performance/SSR issues">
- <Non-goal 3 – e.g. "Changing ownership or architecture of packages">
- <Non-goal 4 – optional>

---

## Phases (High-Level)

> Customize phase names to match the workflow.  
> Typical pattern: Identification → Analysis → Implementation → Validation.

### Phase 1 – <PHASE_1_NAME>

**Goal:**  
- <short goal – e.g. "Understand scope and current implementation">

**Include steering (examples, adjust per workflow):**
- `01-project-context.md`
- `06-monorepo-architecture.md`
- `packages/{product}/{product}-context.md`
- <any core area file, e.g. `04-design-system-integration.md` / `02-angular-performance.md`>

---

### Phase 2 – <PHASE_2_NAME>

**Goal:**  
- <short goal – e.g. "Decide on approach, patterns, and affected areas">

**Include steering:**
- `.kiro/steering/topics/<area>/<core-topic>.md`
- `.kiro/steering/topics/<area>/<workflow-specific-topic>.md`
- `packages/{product}/{library}.context.md` (if relevant)

---

### Phase 3 – <PHASE_3_NAME>

**Goal:**  
- <short goal – e.g. "Apply changes according to area rules and plan">

**Include steering:**
- Any component/feature-specific files:  
  - `.kiro/steering/topics/<area>/components/<component>.md`
- Any additional cross-cutting topics (performance, SSR, DS, etc.)

---

### Phase 4 – <PHASE_4_NAME>

**Goal:**  
- <short goal – e.g. "Verify correctness, clean up, and finalize">

**Include steering:**
- Other validation/testing/performance topics as needed

---

## Success Criteria

Use these checklists to confirm the workflow was followed correctly.  
The assistant should explicitly tick items in chat as they are satisfied.

### 1. Context & Scope

- [ ] I confirmed what the user wants to achieve in this workflow.
- [ ] I confirmed which parts of the codebase / product are in scope.
- [ ] I am only proposing or making changes within that scope.
- [ ] I confirmed this work matches the **When to Use This** section (not an out-of-scope case).

### 2. Steering & Rules Intake

- [ ] I have read the relevant global steering:
      - `01-project-context.md` (if applicable)
      - `06-monorepo-architecture.md` / `07-global-packages-context.md` (if applicable)
- [ ] I have read the main area steering for this workflow  
      (e.g. `02-angular-performance.md`, `03-angular-ssr.md`, `04-design-system-integration.md`).
- [ ] I have read the workflow-specific topic file(s) listed in this hub  
      (e.g. `.kiro/steering/topics/<area>/<workflow-topic>.md`).
- [ ] I have read the relevant package / library context files:  
      `packages/{product}/{product}-context.md` and  
      `packages/{product}/{library}.context.md` (if present).
- [ ] I have read any component-/feature-specific steering in  
      `.kiro/steering/topics/<area>/components/<specific>.md` (if applicable).

### 3. Execution

- [ ] I followed the phases defined in this workflow in order.
- [ ] For each change, I applied patterns and rules from the referenced steering files,  
      instead of inventing new rules in this workflow.
- [ ] I kept changes minimal and within the agreed scope.
- [ ] I called out any trade-offs or deviations explicitly to the user.

### 4. Validation & Cleanliness

- [ ] I ran the checks/tests that are appropriate for this workflow  
      (e.g. type checks, unit/E2E tests, linting, manual verification).
- [ ] I summarized what changed and why, in terms the user can verify.
- [ ] I indicated any remaining risks, unknowns, or follow-up work.
- [ ] I did not leave obvious dead code, TODOs, or commented-out blocks related to this workflow.

**Output:**  
A clearly described set of changes, aligned with referenced steering,  
within scope, and validated according to this workflow’s expectations.

---

Fill in this template for <topic_workflow>, use path/to/topic/steering as primary data source + code base research.