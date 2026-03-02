# Initialize DS Migration from JIRA Ticket

**Purpose**: Create a new DS migration spec from a JIRA ticket containing violation group data.

**Input**: JIRA ticket number (e.g., `FFW-12345`)

**Output**: Complete spec directory with violation group data ready for analysis workflow.

---

## Workflow Steps

### Step 1: Fetch JIRA Ticket

Use `mcp_mcp_atlassian_jira_get_issue` to fetch the ticket:
- **issue_key**: `{ticket-number}`
- **fields**: `description,summary`

Extract violation group data from the ticket description.

### Step 2: Create Spec Directory

Copy the template spec to a new directory:
- **Source**: `.kiro/templates/ds-migration/specs/ds-violation-group-analysis/`
- **Destination**: `.kiro/specs/{ticket-number}-ds-migration/`

Copy all files and subdirectories:
- `requirements.md`
- `design.md`
- `tasks.md`
- `data/` directory (including `README.md`)

### Step 3: Parse Violation Group Data

Extract violation group data from the JIRA ticket description. The data should follow this structure:

```json
{
  "id": 5,
  "name": "Group 5 - frontend-lib/core",
  "rootPath": "./packages/bingo",
  "directories": [
    "frontend-lib/core"
  ],
  "files": [
    {
      "file": "frontend-lib/core/src/shared/components/designsystems/custombutton.component.html",
      "violations": 2,
      "components": [
        {
          "component": "DsButton",
          "lines": [18, 28],
          "violation": "btn",
          "replacement": "DsButton"
        }
      ]
    }
  ],
  "statistics": {
    "fileCount": 1,
    "violationCount": 2
  },
  "componentDistribution": {
    "DsButton": 2
  }
}
```

### Step 4: Create violations-group.json

Write the parsed violation group data to:
- **Path**: `.kiro/specs/{ticket-number}-ds-migration/data/violations-group.json`
- **Format**: JSON with proper indentation (2 spaces)

### Step 5: Verify Spec Structure

Confirm the following files exist:
- `.kiro/specs/{ticket-number}-ds-migration/requirements.md`
- `.kiro/specs/{ticket-number}-ds-migration/design.md`
- `.kiro/specs/{ticket-number}-ds-migration/tasks.md`
- `.kiro/specs/{ticket-number}-ds-migration/data/README.md`
- `.kiro/specs/{ticket-number}-ds-migration/data/violations-group.json`

### Step 6: Update tasks.md

Update the `tasks.md` file to reference the correct spec directory path in all commands.

---

## Success Criteria

- [ ] JIRA ticket fetched successfully
- [ ] Spec directory created at `.kiro/specs/{ticket-number}-ds-migration/`
- [ ] All template files copied (requirements.md, design.md, tasks.md, data/README.md)
- [ ] `violations-group.json` created with valid JSON structure
- [ ] File paths in violation data are relative to workspace root
- [ ] Statistics match the actual file and violation counts
- [ ] Component distribution matches the violations

---
