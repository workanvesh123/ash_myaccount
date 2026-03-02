---
inclusion: manual
description: "Topic steering for <TOPIC_NAME> in this Angular monorepo. Read when working on <TOPIC_NAME>-related changes."
---

# <TOPIC_NAME> – Topic Steering

## 1. Scope – When to Read This

### This file applies when you:
- {{ list concrete actions, e.g. "optimizing rendering", "writing/adjusting unit tests", "touching SSR-only paths", "integrating Design System components" }}
- {{ another narrow trigger }}

### This file does NOT cover:
- {{ things handled by other steering files, e.g. "routing", "auth", "business rules" }}

**Rule:** If your primary concern is **<TOPIC_NAME>**, consult this file. Otherwise, defer to project/library contexts.

---

## 2. Core Principles

Summarize 3–5 non-negotiable rules that define “good” for this topic:

- **P1 – {{ short label }}:** {{ 1–2 line explanation }}
- **P2 – {{ short label }}:** {{ explanation }}
- **P3 – {{ short label }}:** {{ explanation }}
- *(Optional)* **P4/P5** as needed

> These principles should be stable over time and guide decisions when trade-offs appear.

---

## 3. Do / Don’t Guidelines

### Do
- {{ concise, actionable “Do” #1 }}
- {{ “Do” #2 }}
- {{ “Do” #3 }}

### Don’t
- {{ clear “Don’t” #1 – common anti-pattern }}
- {{ “Don’t” #2 }}
- {{ “Don’t” #3 }}

> Keep items focused on this topic. Cross-cutting rules (auth, routing, DS basics) belong in other files.

---

## 4. Standard Patterns (How We Usually Do It)

Describe the **canonical patterns** for this topic in Angular terms.

Examples (tune to topic):

- For **performance**:
  - {{ e.g. “Use `ChangeDetectionStrategy.OnPush` for new components unless there is a strong reason not to.” }}
  - {{ e.g. “Prefer signals/computed over deep RxJS chains in templates.” }}

- For **unit tests**:
  - {{ e.g. “Use Testing Library queries by role/text, avoid `querySelector`.” }}
  - {{ e.g. “Mock HTTP via HttpTestingController, not hand-written spies.” }}

- For **SSR**:
  - {{ e.g. “Guard all browser APIs with platform checks.” }}

- For **design system integration**:
  - {{ e.g. “Prefer DS buttons/inputs over custom ones, align with DS tokens.” }}

Keep each bullet very concrete and Angular-flavored.

---

## 5. Implementation Checklist

A short checklist devs (or AI) can tick mentally when working on this topic.

- [ ] {{ Item #1 – “Have you … ?” }}
- [ ] {{ Item #2 }}
- [ ] {{ Item #3 }}
- [ ] {{ Optional Item #4 }}
- [ ] {{ Optional Item #5 }}

Examples:
- Performance: “[ ] Did you avoid heavy work in template expressions?”
- Unit tests: “[ ] Does the test assert behavior, not implementation details?”
- SSR: “[ ] Does the code run correctly on server without accessing `window`?”
- DS: “[ ] Are you using semantic tokens, not hardcoded colors?”

---

## 6. Common Pitfalls & Anti-Patterns

List the **real-world mistakes** you’ve actually seen:

- ❌ {{ Anti-pattern #1 – short name }}
  - {{ One-sentence “why it’s bad / what happens” }}
- ❌ {{ Anti-pattern #2 }}
  - {{ Explanation }}
- ❌ {{ Anti-pattern #3 }}
  - {{ Explanation }}

Whenever you discover a new “we keep breaking this”, add it here.

---

## 7. Small Examples

One or two **small, focused** examples that embody the topic’s rules.  
(Keep them tiny – this file is not a cookbook.)

```ts
// ✅ Example: <good pattern related to TOPIC_NAME>
<minimal code snippet>
```

```ts
// ❌ Avoid: <bad pattern>
<minimal code snippet>
```

> Examples should demonstrate patterns, not full features.

---

## 8. Escalation & Trade-offs

- If <TOPIC_NAME> conflicts with:
  - {{ performance vs readability, SSR vs DX, DS vs legacy look, etc. }}
- Prefer:
  - {{ state what wins in your project (e.g. correctness > performance > convenience) }}

**Rule:** When trade-offs are unclear, favor {{ chosen default }} and leave a short comment explaining the decision.

---

## 9. Related Steering Files

Point to other documents that interact with this topic:

- `design-system-integration.instructions.md`
- `performance.instructions.md`
- `unit-testing.instructions.md`
- `ssr.instructions.md`
- Relevant library/project context files

> This keeps topic files small and cross-linked instead of duplicating content.

---

Fill in this template for <topic-name>, make sure you researched the actual codebase so content matches reality. Limit yourself to 120 lines max. 