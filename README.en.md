# GitHub Project Manager

[日本語](README.md)

A PM assistant skill for GitHub Projects V2. Covers environment setup, daily operations, Sprint analytics, and migration — all in one.

"Create an issue", "Change status", "Sprint report" — execute PM daily tasks instantly via CLI. From full project setup to Jira/Linear migration.

## 3 Modes

| Mode                     | Purpose                                               | Key Operations                                        |
| ------------------------ | ----------------------------------------------------- | ----------------------------------------------------- |
| **Mode A: Setup**        | New project environment                               | 14 statuses, 6 views, 13 labels, templates, workflows |
| **Mode B: Operations** ★ | Issue/PR creation, status changes, backlog management | `project-ops.sh` + natural language                   |
| **Mode C: Analytics**    | Sprint reports, velocity tracking                     | `sprint-report.sh`                                    |

### Lite Mode (for small teams)

Use the `--lite` flag to set up a streamlined configuration for 1-3 person teams:

```bash
./scripts/setup-all.sh <OWNER/REPO> <PROJECT_NUMBER> --lite
```

| Config         | Statuses | Views | Labels | Recommended Team Size |
| -------------- | -------- | ----- | ------ | --------------------- |
| Lite           | 8        | 3     | 5      | 1-3 people            |
| Full (default) | 14       | 6     | 13     | 4+ people             |

You can migrate from Lite to Full at any time by re-running `setup-all.sh` without `--lite`.

On first launch, the skill auto-detects project state: unconfigured → Mode A, configured → Mode B. Project info is saved to `.github-project-config.json` for instant reconnection.

## Prerequisites

- `gh` CLI installed and authenticated
- GitHub Classic PAT (`ghp_` token) — Fine-grained PATs do not support Projects V2 GraphQL API
- PAT scopes: `project`, `repo`, `read:org`

## Installation

```bash
git clone git@github.com:fideguch/my_pm_tools.git
cd my_pm_tools
./install.sh    # Installs to ~/.claude/skills/github-project-manager/
```

Invoke in Claude Code or Devin:

```
"Create an issue" "Set up project environment" "Sprint report"
```

## Quick Start

### New Project Setup (Mode A)

```bash
./scripts/setup-all.sh <OWNER/REPO> <PROJECT_NUMBER>
```

### Daily Operations (Mode B)

```bash
# Add issues/PRs to project
./scripts/project-ops.sh <OWNER> <NUMBER> add-issue <REPO> <ISSUE_NUM>
./scripts/project-ops.sh <OWNER> <NUMBER> add-pr <REPO> <PR_NUM>

# Change status (move cards)
./scripts/project-ops.sh <OWNER> <NUMBER> move <ITEM_ID> "開発中"

# Set priority
./scripts/project-ops.sh <OWNER> <NUMBER> set-priority <ITEM_ID> P1

# List items
./scripts/project-ops.sh <OWNER> <NUMBER> list-items
```

### Analytics (Mode C)

```bash
./scripts/sprint-report.sh <OWNER> <NUMBER>                    # Current sprint
./scripts/sprint-report.sh <OWNER> <NUMBER> --sprint previous  # Previous sprint
./scripts/sprint-report.sh <OWNER> <NUMBER> --json             # JSON output
```

### Migration from Other Tools

```bash
./scripts/migrate-import.sh <OWNER/REPO> <NUMBER> export.csv --format jira     # Jira
./scripts/migrate-import.sh <OWNER/REPO> <NUMBER> export.csv --format linear   # Linear
./scripts/migrate-import.sh <OWNER/REPO> <NUMBER> export.csv --format notion   # Notion
./scripts/migrate-import.sh <OWNER/REPO> <NUMBER> tasks.csv --dry-run          # Preview
```

## Scripts

| Script               | Mode | Purpose                                    |
| -------------------- | ---- | ------------------------------------------ |
| `setup-all.sh`       | A    | Full environment setup                     |
| `setup-labels.sh`    | A    | Bulk create 13 labels                      |
| `setup-fields.sh`    | A    | Custom fields (Priority, Estimate, Target) |
| `setup-status.sh`    | A    | Status 14 options                          |
| `setup-views.sh`     | A    | 5 project views                            |
| `setup-templates.sh` | A    | Auto-deploy templates & workflows          |
| `project-ops.sh`     | B    | Issue/PR add, status change, priority      |
| `migrate-import.sh`  | A    | Jira/Linear/Notion CSV import              |
| `sprint-report.sh`   | C    | Sprint report (velocity, completion)       |

## MCP Server

AI agents (Claude Code, GitHub Copilot, etc.) can operate projects via MCP protocol.

### Setup

```bash
npm install && npm run build
```

Add to Claude Desktop config:

```json
{
  "mcpServers": {
    "github-project-manager": {
      "command": "node",
      "args": ["/path/to/my_pm_tools/dist/index.js"],
      "env": { "GITHUB_TOKEN": "ghp_..." }
    }
  }
}
```

### MCP Tools

| Tool                       | Method  | Description                                                   |
| -------------------------- | ------- | ------------------------------------------------------------- |
| `project_list_fields`      | GraphQL | List fields and their options                                 |
| `project_list_items`       | GraphQL | List items with status/priority filter (pagination support)   |
| `project_add_item`         | GraphQL | Add an Issue or PR to the project                             |
| `project_move_status`      | GraphQL | Change item status (alias support: "dev"→"開発中")            |
| `project_set_priority`     | GraphQL | Set priority (P0-P4)                                          |
| `project_sprint_report`    | GraphQL | Generate sprint report                                        |
| `project_get_issue`        | GraphQL | Get issue details (title, body, labels, assignees, milestone) |
| `project_edit_issue`       | gh CLI  | Edit issue title and/or body                                  |
| `project_manage_labels`    | gh CLI  | Add or remove labels on an issue                              |
| `project_manage_assignees` | gh CLI  | Add or remove assignees on an issue                           |
| `project_set_issue_state`  | gh CLI  | Close or reopen an issue                                      |

**Status aliases**: `dev`→`開発中`, `review`→`コードレビュー`, `testing`→`テスト中`, etc. Use English shorthand to operate Japanese statuses.

## Documentation

- **[Operation Guide (USAGE.md)](docs/USAGE.md)** — Daily ops, views, Sprint, migration, FAQ
- **[Workflow Definition](docs/workflow-definition.md)** — 14-status specification
- **[View Design](docs/view-design.md)** — 6-view configuration
- **[Automation Guide](docs/automation-guide.md)** — Workflow and script setup

## Developer Setup

```bash
npm install
npm test            # 375+ regression tests
npm run build       # Build MCP server
npm run quality     # lint + typecheck + format:check
```

Requirements: Node.js 20+, ShellCheck (optional). See [CONTRIBUTING.md](CONTRIBUTING.md).

## PM Tool Suite

This repository is part of a 5-tool suite that automates PM workflows in Claude Code.

| #   | Skill                 | Purpose                        | Repo                                                                                |
| --- | --------------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| 1   | **my_pm_tools**       | **GitHub Projects V2 管理**    | **this repo**                                                                       |
| 2   | requirements_designer | Requirements + Figma UI        | [fideguch/requirements_designer](https://github.com/fideguch/requirements_designer) |
| 3   | speckit-bridge        | Requirements → Spec (gate ≥70) | [fideguch/speckit-bridge](https://github.com/fideguch/speckit-bridge)               |
| 4   | pm-data-analysis      | GAFA-quality data analysis     | [fideguch/pm_data_analysis](https://github.com/fideguch/pm_data_analysis)           |
| 5   | pm-ad-analysis        | Multi-channel ad operations    | [fideguch/pm_ad_analysis](https://github.com/fideguch/pm_ad_analysis)               |

## License

ISC License. See [LICENSE](LICENSE) for details.
