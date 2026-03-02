---
inclusion: manual
---

# karma-to-jest-migration – Workflow Hub

> Use this workflow when working migrating legacy Karma and Jasmine unit tests to Jest.  
> This file defines when to use the workflow, how to behave, which phases to follow,  
> and which steering files must be read.

---

## When to Use This

Use this workflow when:
- Refactoring the Jasmine and Moxxi mocks to Jest and ng-mocks
- Creating non-existing ng-mocks of dependencies required for testing
- Refactoring the unit and integration tests from Karma and Jasmine to Jest

Do NOT use for:
- Refining the unit tests that are already written using Jest and ng-mocks
- Other test refactorings in different frameworks such as Vitest

---

## Assistant Behavior When Using This Workflow

When this file is present in context, you MUST:

1. **Announce the phase.**  
   Start each major reply by stating which phase you are in  
   (e.g. `Identification`, `Analysis`, `Implementation`, `Validation`).

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

- Replace moxxi library mocks (created via MockContext) with ng-mocks alternatives (use MockProvider, MockComponent helper methods)
- Refactor jasmine-specific methods of the `expect` statments with Jest alternatives
- Stick to the previously implemented test cases and scenarios
- Identify missing mocks and create them using ng-mocks and Jest

## Non-goal

- No functional or any other changes in tested components, services and classes in general
- No jasmine-related code
- No extending of the existing test cases with new scenarios

---

## Phases (High-Level)

> Customize phase names to match the workflow.  
> Typical pattern: Identification → Analysis → Implementation → Validation.

### Phase 1 – Identification

**Goal:**  
- Understand scope and current implementation of the test cases located in the `*.spec.ts` files

**Include steering (examples, adjust per workflow):**
- `01-project-context.md`
- `06-monorepo-architecture.md`
- `packages/{product}/{product}-context.md`

---

### Phase 2 – Analysis

**Goal:**  
- Identify moxxi mocks to be rewritten, and jasmine-specific code

**Include steering:**
- `.kiro/steering/topics/<area>/<core-topic>.md`
- `.kiro/steering/topics/<area>/<workflow-specific-topic>.md`
- `packages/{product}/{library}.context.md` (if relevant)

---

### Phase 3 – Implementation

**Goal:**  
- Apply changes according to idenfied area rules and plan

**Include steering:**
- `.kiro/steering/topics/karma-to-jest-migration/mocking.md`

---

### Phase 4 – Validation

**Goal:**  
- Verify correctness by running the tests for a given scope (file, project), clean up, and finalize

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
- [ ] I have read the workflow-specific topic file(s) listed in this hub  
      (e.g. `.kiro/steering/topics/karma-to-jest-migration/mocking.md`).
- [ ] I have read the relevant package / library context files:  
      `packages/{product}/{product}-context.md` and  
      `packages/{product}/{library}.context.md` (if present).

### 3. Execution

- [ ] I followed the phases defined in this workflow in order.
- [ ] For each change, I applied patterns and rules from the referenced steering files,  
      instead of inventing new rules in this workflow.
- [ ] I kept changes minimal and within the agreed scope.
- [ ] I called out any trade-offs or deviations explicitly to the user.

### 4. Validation & Cleanliness

- [ ] I ran the checks/tests that are appropriate for this workflow
- [ ] I summarized what changed and why, in terms the user can verify.
- [ ] I indicated any remaining risks, unknowns, or follow-up work.
- [ ] I did not leave obvious dead code, TODOs, or commented-out blocks related to this workflow.

**Output:**  
A clearly described set of changes, aligned with referenced steering,  
within scope, and validated according to this workflow’s expectations.
