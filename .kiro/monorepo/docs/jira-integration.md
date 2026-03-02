# Jira Integration Guide

## Creating Issues via MCP

This guide documents how to create Jira issues programmatically using the MCP Atlassian Jira integration.

## Prerequisites

- Jira MCP server configured in `.kiro/settings/mcp.json` or `~/.kiro/settings/mcp.json`
- Valid Jira credentials with issue creation permissions
- Project key (e.g., `FFW` for Frontend Framework)

## Basic Issue Creation

### Simple Issue

```typescript
mcp_mcp_atlassian_jira_create_issue({
  project_key: "FFW",
  summary: "Issue title",
  issue_type: "Story",
  description: "Issue description"
})
```

**Available Issue Types:**
- `Story` - User story or feature
- `Bug` - Defect or problem
- `Task` - General task
- `Epic` - Large feature or initiative
- `Sub-task` - Child task (requires parent)

## Linking Issues to Epics

To create an issue under an epic, use the Epic Link custom field (`customfield_10100`):

```typescript
mcp_mcp_atlassian_jira_create_issue({
  project_key: "FFW",
  summary: "AI issue test",
  issue_type: "Story",
  description: "This is a test issue created by AI to verify Jira integration functionality.",
  additional_fields: {
    "customfield_10100": "FFW-12894"  // Epic Link
  }
})
```

### Key Points

- **Epic Link Field**: `customfield_10100` is the standard Epic Link field in Jira
- **Epic Key Format**: Use the full epic key (e.g., `FFW-12894`), not just the ID
- **Parent vs Epic Link**: 
  - Use `parent` in `additional_fields` for sub-tasks: `{"parent": {"key": "FFW-123"}}`
  - Use `customfield_10100` for linking to epics: `{"customfield_10100": "FFW-12894"}`

## Response Format

Successful creation returns:

```json
{
  "message": "Issue created successfully",
  "issue": {
    "id": "524603",
    "key": "FFW-14977",
    "summary": "AI issue test",
    "url": "https://jira-enterprise.corp.entaingroup.com/rest/api/2/issue/524603",
    "status": {
      "name": "Open",
      "category": "To Do"
    },
    "issue_type": {
      "name": "Story"
    },
    "project": {
      "key": "FFW",
      "name": "Frontend Framework"
    }
  }
}
```

## Common Patterns

### Creating Sub-tasks

```typescript
mcp_mcp_atlassian_jira_create_issue({
  project_key: "FFW",
  summary: "Sub-task title",
  issue_type: "Sub-task",
  description: "Sub-task description",
  additional_fields: {
    "parent": {"key": "FFW-123"}
  }
})
```

### Adding Labels and Components

```typescript
mcp_mcp_atlassian_jira_create_issue({
  project_key: "FFW",
  summary: "Issue with labels",
  issue_type: "Story",
  description: "Description",
  additional_fields: {
    "labels": ["frontend", "design-system"],
    "components": [{"name": "UI"}]
  }
})
```

### Assigning to User

```typescript
mcp_mcp_atlassian_jira_create_issue({
  project_key: "FFW",
  summary: "Assigned issue",
  issue_type: "Story",
  description: "Description",
  assignee: "user@example.com"  // Email, display name, or account ID
})
```

## Finding Custom Fields

To discover custom field IDs in your Jira instance:

```typescript
mcp_mcp_atlassian_jira_search_fields({
  keyword: "epic",
  limit: 10
})
```

Common custom fields:
- `customfield_10100` - Epic Link
- `customfield_10108` - Parent Link
- `customfield_10102` - Epic Name

## Troubleshooting

### Error: "Error calling tool 'create_issue'"

**Possible causes:**
1. Invalid issue type for the project
2. Missing required fields
3. Invalid custom field format
4. Insufficient permissions

**Solutions:**
- Check available issue types: Search existing issues in the project
- Verify custom field IDs: Use `search_fields` tool
- Ensure proper field format: Use objects for complex fields like `parent`
- Confirm permissions: Verify you can create issues in the Jira UI

### Epic Link Not Working

If `{"parent": {"key": "EPIC-123"}}` fails, use the Epic Link custom field instead:

```typescript
additional_fields: {
  "customfield_10100": "EPIC-123"
}
```

## Related Tools

- `mcp_mcp_atlassian_jira_get_issue` - Get issue details
- `mcp_mcp_atlassian_jira_update_issue` - Update existing issue
- `mcp_mcp_atlassian_jira_search` - Search issues with JQL
- `mcp_mcp_atlassian_jira_search_fields` - Find custom field IDs
- `mcp_mcp_atlassian_jira_add_comment` - Add comment to issue

## Example: Complete Workflow

```typescript
// 1. Get epic details
const epic = await mcp_mcp_atlassian_jira_get_issue({
  issue_key: "FFW-12894"
});

// 2. Create child issue
const issue = await mcp_mcp_atlassian_jira_create_issue({
  project_key: "FFW",
  summary: "Implement feature X",
  issue_type: "Story",
  description: "Feature description",
  additional_fields: {
    "customfield_10100": "FFW-12894"
  }
});

// 3. Add comment
await mcp_mcp_atlassian_jira_add_comment({
  issue_key: issue.issue.key,
  comment: "Issue created via AI automation"
});
```

## Best Practices

1. **Always verify epic exists** before linking issues
2. **Use descriptive summaries** - they appear in search results
3. **Include context in descriptions** - link to related docs/PRs
4. **Set appropriate issue types** - Story for features, Bug for defects, Task for general work
5. **Link related issues** - Use issue links to show dependencies
6. **Add labels for categorization** - Makes filtering and reporting easier
