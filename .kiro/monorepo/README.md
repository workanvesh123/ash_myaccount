# .kiro Directory

This directory contains AI assistant configuration, steering rules, automation scripts, and project-specific documentation for the Kiro AI development workflow.

## Purpose

The `.kiro/` directory serves as the **knowledge base and automation hub** for AI-assisted development. It provides:

- **Context**: Project-specific knowledge that guides AI behavior
- **Automation**: Scripts and hooks for repetitive workflows
- **Standards**: Structured workflows and templates for consistency
- **Documentation**: Guides and references for common tasks

## Directory Structure

```
.kiro/
├── docs/              # Project documentation and guides
├── hooks/             # Agent hooks for automated workflows
├── prompts/           # Reusable prompt templates
├── scripts/           # Automation scripts and utilities
├── settings/          # MCP and tool configurations
├── specs/             # Feature specifications and analysis
├── steering/          # AI steering rules and context
└── templates/         # Code and documentation templates
```

---

## 📁 Core Directories

### `/steering` - AI Steering Rules

Context files that guide AI assistant behavior across the project. These files are automatically included in AI conversations based on relevance.

**Structure:**
```
steering/
├── 0X-*.md           # Root-level rules (always included)
├── packages/         # Package-specific context
│   └── {package}/
│       ├── {package}-context.md
│       └── {library}.context.md
├── topics/           # Domain-specific guidance
│   ├── accessibility/
│   ├── angular-performance/
│   ├── design-system/
│   └── ssr/
└── workflows/        # Structured migration workflows
```

**File Types:**

1. **Root Files (0X-*.md)**: Foundational rules included in all conversations
   - Agent persona and interaction philosophy
   - Project context (domain, tech stack, architecture)
   - Coding standards (SSR, performance, accessibility)
   - Git conventions and monorepo navigation
   - Package classification and dependency rules

2. **Package Context**: Product and library-specific guidance
   - Located in `packages/{package}/`
   - Naming: `{package}-context.md` or `{library}.context.md`
   - Contains package-specific patterns, constraints, and architecture

3. **Topic Files**: Domain-specific best practices
   - Organized by category (accessibility, performance, SSR, etc.)
   - Included conditionally based on file context
   - Deep-dive guidance for specific technical areas

4. **Workflows**: Phase-based structured processes
   - For complex migrations and refactoring tasks
   - Define phases, success criteria, and required steering files
   - Examples: SSR migration, DS migration, performance optimization

**Inclusion Behavior:**
- **Always included:** Root files (0X-*.md)
- **Conditionally included:** Topic and package files when relevant files are read
- **Manually included:** Use `#steering/path/to/file.md` in chat

---

### `/workflows` - Structured Workflows

Phase-based workflows for complex migrations and refactoring tasks. Located in `steering/workflows/`.

**Workflow Categories:**
- **Migration Workflows**: SSR compatibility, Design System migration
- **Optimization Workflows**: Performance optimization, accessibility implementation
- **Refactoring Workflows**: Architecture changes, pattern migrations

**Workflow Structure:**
Each workflow file defines:
1. **When to Use This**: Scope and applicability criteria
2. **Assistant Behavior**: How AI should execute the workflow
3. **Phases**: Sequential steps (typically: Identification → Analysis → Implementation → Validation)
4. **Success Criteria**: Checklists for verification and completion

**Usage Pattern:**
1. AI announces current phase at start of each reply
2. AI confirms steering intake by ticking checklist items
3. AI follows scope strictly (only changes what user specified)
4. AI works phase-by-phase without skipping
5. AI ends with explicit verification of success criteria

**Finding Workflows:**
- Browse `steering/workflows/` directory
- Workflows are auto-included when relevant to user request
- Manually reference: `#steering/workflows/{name}-workflow.md`

---

### `/specs` - Feature Specifications

Structured feature specifications following the requirements → design → tasks pattern.

**Standard Structure:**
```
specs/{feature-name}/
├── requirements.md    # User stories and acceptance criteria
├── design.md          # Technical design and architecture
├── tasks.md           # Implementation tasks
└── data/              # Analysis data and artifacts
    ├── components/    # Component-specific analysis
    └── *.json         # Structured data outputs
```

**Purpose:**
- Document complex features before implementation
- Track analysis phases for migrations
- Store structured data for automation scripts
- Provide context for AI-assisted development

**Workflow:**
1. Create spec from template (see `/templates/`)
2. Fill in requirements (user stories, acceptance criteria)
3. Design technical approach (architecture, patterns)
4. Break down into tasks (implementation steps)
5. Store analysis data in `data/` directory

**Finding Specs:**
- Browse `specs/` directory for active features
- Specs are referenced by workflows and scripts
- Use spec templates from `templates/` for consistency

---

### `/scripts` - Automation Scripts

Node.js scripts for analysis, code generation, and workflow automation.

**Structure:**
```
scripts/
├── {category}/
│   ├── README.md      # Usage instructions
│   ├── *.mjs          # ESM scripts
│   └── *.js           # CommonJS scripts
```

**Script Categories:**
- **Analysis Scripts**: Parse violations, generate reports, analyze dependencies
- **Generation Scripts**: Create tickets, generate steering files, scaffold specs
- **Migration Scripts**: Automate migration workflows, batch processing

**Usage Pattern:**
1. Navigate to script directory: `cd .kiro/scripts/{category}/`
2. Read README for usage: `cat README.md`
3. Run script: `node script-name.mjs [args]`

**Script Conventions:**
- Use ESM syntax (`.mjs` extension) for new scripts
- Include `README.md` with usage examples
- Accept arguments for flexibility
- Output to `tmp/` or `specs/{feature}/data/` directories
- Log progress and results to console

**Finding Scripts:**
- Browse `scripts/` directory by category
- Each category has its own README
- Scripts are referenced by workflows and hooks

---

### `/hooks` - Agent Hooks

Automated workflows triggered by IDE events (file save, message send, etc.).

**Hook Types:**
- **Event-triggered**: Run on file save, message send, session start
- **Manual**: Run on button click in IDE
- **Conditional**: Run based on file patterns or context

**Hook Actions:**
- **Send message**: Trigger AI assistant with predefined prompt
- **Execute command**: Run shell command with optional message input

**Common Use Cases:**
- Code review on file save
- Test execution after changes
- Ticket generation for migrations
- Quality reports and metrics
- GitLab MR creation workflows

**Management:**
- **Visual Editor**: Command Palette → "Open Kiro Hook UI"
- **Explorer View**: "Agent Hooks" section in Kiro panel
- **File-based**: Edit `.kiro.hook` files directly

**Hook File Format:**
```json
{
  "name": "Hook Name",
  "trigger": "onSave" | "onMessage" | "manual",
  "action": "sendMessage" | "executeCommand",
  "config": { /* hook-specific config */ }
}
```

---

### `/templates` - Code Templates

Reusable templates for code generation and documentation.

**Template Types:**
1. **Data Templates**: JSON schemas for structured analysis
   - Phase-based analysis templates
   - Validation schemas
   - Report formats

2. **Spec Templates**: Markdown templates for feature specs
   - Requirements template
   - Design template
   - Tasks template
   - Data directory structure

3. **Code Templates**: Boilerplate for common patterns
   - Component scaffolding
   - Service patterns
   - Test templates

**Usage Pattern:**
1. Copy template to target location
2. Fill in placeholders and customize
3. Use with scripts for automation

**Template Conventions:**
- Use descriptive names: `{category}/{template-name}.template.{ext}`
- Include comments explaining placeholders
- Keep templates minimal and focused
- Document template usage in README or comments

---

### `/docs` - Project Documentation

Guides and reference documentation for workflows and integrations.

**Documentation Types:**
1. **Integration Guides**: How to use external tools (Jira, GitLab, MCP servers)
2. **Workflow Guides**: Step-by-step action guides for complex processes
3. **Reference Docs**: API documentation, configuration references

**Organization:**
```
docs/
├── {integration}.md           # Integration guides
└── {workflow}/                # Workflow-specific guides
    ├── 00-{phase}.md
    ├── 01-{phase}.md
    └── ...
```

**Documentation Conventions:**
- Use numbered prefixes for sequential guides (00-, 01-, 02-)
- Include practical examples and commands
- Link to related steering files and workflows
- Keep docs focused on "how-to" rather than "what is"

**Finding Documentation:**
- Browse `docs/` directory by topic
- Referenced by steering files and workflows
- Use for onboarding and reference

---

### `/prompts` - Prompt Templates

Reusable prompt templates for common workflows.

**Available Prompts:**
- `init-ds-migraiton-from-jira.prompt.md` - Initialize DS migration from Jira ticket

**Usage:**
Reference prompts in chat or use as starting points for custom workflows.

---

### `/settings` - Tool Configuration

Configuration files for MCP servers and other tools.

**Files:**
- `mcp.example` - Example MCP server configuration
- `mcp.json` - Active MCP server configuration (workspace-specific)

**MCP Configuration:**
- Workspace config: `.kiro/settings/mcp.json`
- User config: `~/.kiro/settings/mcp.json`
- Workspace configs override user configs

---

## 🚀 Quick Start

### Using Steering Rules

Steering rules are automatically included based on context. To manually include:

```
# In Kiro chat
#steering/topics/ssr/ssr-anti-patterns.md
```

### Running Scripts

```bash
# Example: Generate DS migration tasks
node .kiro/scripts/ds-migration/analysis/generate-tasks.mjs

# See script-specific README for usage
cat .kiro/scripts/ds-migration/analysis/README.md
```

### Creating Specs

```bash
# Copy spec template
cp -r .kiro/templates/ds-migration/specs/ds-violation-group-analysis .kiro/specs/my-feature

# Edit requirements, design, and tasks
```

### Managing Hooks

1. Open Command Palette (`Cmd+Shift+P`)
2. Search "Open Kiro Hook UI"
3. Create/edit hooks with visual editor

---

## 📚 Related Documentation

- **Steering Topics:** `.kiro/steering/topics/` (SSR, performance, accessibility, Design System)
- **Package Context:** `.kiro/steering/packages/` (product and library-specific guidance)
- **Workflows:** `.kiro/steering/workflows/` (structured migration workflows)
- **Project Docs:** `docs/` (root-level project documentation)

---

## 🔧 Maintenance

### Adding New Steering Rules

1. Create file in appropriate directory:
   - Root-level: `.kiro/steering/0X-{name}.md`
   - Topic: `.kiro/steering/topics/{category}/{name}.md`
   - Package: `.kiro/steering/packages/{package}/{name}.md`

2. Add front-matter for conditional inclusion:
   ```markdown
   ---
   inclusion: fileMatch
   fileMatchPattern: '**/*.spec.ts'
   ---
   ```

3. Test inclusion by reading matching files in chat

### Adding New Workflows

1. Create workflow file: `.kiro/steering/workflows/{name}-workflow.md`
2. Include required sections:
   - When to Use This
   - Assistant Behavior
   - Phases
   - Success Criteria
3. Reference from relevant steering files

### Adding New Scripts

1. Create script directory: `.kiro/scripts/{category}/`
2. Add `README.md` with usage instructions
3. Use ESM syntax (`.mjs` extension)
4. Document in this README

---

## 🤝 Contributing

When adding new content to `.kiro/`:

- Follow existing naming conventions
- Include README files for new directories
- Update this README with new sections
- Test steering rules and workflows before committing
- Keep scripts documented and maintainable

---

## 📝 Notes

- This directory is workspace-specific and should be committed to version control
- MCP settings can be overridden at user level (`~/.kiro/settings/mcp.json`)
- Steering rules are designed to be composable and context-aware
- Workflows enforce structured, phase-based execution for complex tasks
