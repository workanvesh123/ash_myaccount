---
inclusion: always
---

# Git Workflow & Conventions

## Purpose

When performing Git operations (creating branches, commits, merge requests), follow these project-specific conventions. These rules ensure consistency across the monorepo and enable automated tooling.

## Branch Naming

Format: `f/{initials}-{ticket}-{description}` (max 60 chars)

```bash
# ✅ Correct
f/ai-FFW-12345-migrate-button
f/ai-CASINO-9876-fix-modal-ssr

# ❌ Wrong
feature/button-migration
f/ai-FFW-12345-migrate-button-component-with-very-long-description
```

## Commit Messages

Format: `<type>(<scope>): <subject>` (enforced by commitlint)

**Types:** `feat`, `fix`, `refactor`, `perf`, `style`, `test`, `docs`, `chore`, `ci`, `revert`

**Scope:** Package (`design-system`, `sports`), component (`button`, `modal`), or feature area (`ssr`, `theming`)

```bash
# ✅ Correct
feat(design-system): add inverse prop to DsButton
fix(sports): resolve modal SSR hydration mismatch
refactor(casino): migrate card to design system

# ❌ Wrong
Added button feature, Fixed bug, WIP, Update component
```

**Rules:** Imperative mood, no capitalization, no period, <72 chars, atomic commits

## Before Committing

1. Run `yarn nx format:write --base=main` to format changed files
2. Hooks will auto-run: linting (pre-commit), message validation (commit-msg)

## GitLab MCP

```typescript
// Create branch
mcp_gitlab_mcp_create_branch({
  branch: "f/ai-FFW-12345-migrate-button",
  ref: "main"
})

// Create MR
mcp_gitlab_mcp_create_merge_request({
  title: "feat(design-system): migrate button [FFW-12345]",
  source_branch: "f/ai-FFW-12345-migrate-button",
  target_branch: "main",
  description: "Jira: [FFW-12345]\n\nMigrates legacy button to DsButton..."
})
```

## Critical Constraints

⚠️ Never commit generated directories: `node_modules/`, `dist/`, `.angular/`
⚠️ Never commit secrets, API keys, or sensitive data
⚠️ Never use generic commit messages: "fix", "WIP", "update", "changes"

Always create atomic commits (one logical change per commit)
Always use imperative mood in commit messages
Always run `yarn nx format:write --base=main` before committing
