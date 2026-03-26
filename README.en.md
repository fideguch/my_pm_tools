# Set Up GitHub Project

[日本語](README.md)

A Devin playbook and skill collection for building GitHub Projects V2 development environments in one go.

Sets up a 14-status workflow, 6 views, custom fields, 13 labels, Issue/PR templates, and GitHub Actions automation.

## Overview

This repository provides reusable skills, scripts, and templates for building a GitHub Projects V2 development environment based on best practices.

### What Gets Built

| Component         | Details                                                                          |
| ----------------- | -------------------------------------------------------------------------------- |
| **Statuses**      | 14 stages (Icebox > Planning > Design > Dev > Release > Done)                    |
| **Views**         | 6 types (Issues, Product Backlog, Sprint Board, Sprint Table, Roadmap, My Items) |
| **Custom Fields** | Priority (P0-P4), Sprint (1w Iteration), Estimate (Number), Target (Text)        |
| **Labels**        | 13 total (Type 6 + Area 4 + Ops 3)                                               |
| **Templates**     | Issue (feature/bug) + PR template                                                |
| **Automation**    | 5 Built-in Workflows + 5 GitHub Actions                                          |

## Prerequisites

- `gh` CLI installed and authenticated
- GitHub Classic PAT (`ghp_` token) required (Fine-grained PATs do not support Projects V2 GraphQL API)
- PAT scopes: `project`, `repo`, `read:org`

## Installation

```bash
git clone git@github.com:fideguch/set-up-github-project.git
cd set-up-github-project
./install.sh    # Installs skill to ~/.claude/skills/
```

## Usage

### As a Devin Playbook

Run the `!setup_github_project` macro in Devin to start the interactive setup.

### Direct Script Execution

```bash
# Full environment setup (automated)
./scripts/setup-all.sh <OWNER/REPO> <PROJECT_NUMBER>

# Or run individual phases
./scripts/setup-labels.sh <OWNER/REPO>          # 13 labels
./scripts/setup-fields.sh <OWNER> <NUMBER>       # Custom fields
./scripts/setup-status.sh <OWNER> <NUMBER>       # 14 status options
./scripts/setup-views.sh <OWNER> <NUMBER>        # 5 views
./scripts/setup-templates.sh <OWNER/REPO> <NUM>  # Templates + workflows
```

### Migration from Other Tools

```bash
# Import from Jira CSV
./scripts/migrate-import.sh <OWNER/REPO> <NUMBER> jira-export.csv --format jira

# Import from Linear CSV
./scripts/migrate-import.sh <OWNER/REPO> <NUMBER> linear-export.csv --format linear

# Preview without creating (dry run)
./scripts/migrate-import.sh <OWNER/REPO> <NUMBER> tasks.csv --dry-run
```

### Sprint Reports

```bash
./scripts/sprint-report.sh <OWNER> <NUMBER>               # Current sprint
./scripts/sprint-report.sh <OWNER> <NUMBER> --sprint previous  # Previous sprint
./scripts/sprint-report.sh <OWNER> <NUMBER> --json         # JSON output
```

### Project Operations (Post-Setup)

```bash
# Add issues/PRs to project
./scripts/project-ops.sh <OWNER> <NUMBER> add-issue <REPO> <ISSUE_NUM>
./scripts/project-ops.sh <OWNER> <NUMBER> add-pr <REPO> <PR_NUM>

# Move cards (change status)
./scripts/project-ops.sh <OWNER> <NUMBER> move <ITEM_ID> "開発中"

# List items and fields
./scripts/project-ops.sh <OWNER> <NUMBER> list-items
./scripts/project-ops.sh <OWNER> <NUMBER> list-fields
```

## Developer Setup

```bash
npm install
npm test            # Regression tests (170+)
npm run quality     # lint + typecheck + format:check
```

**Requirements:** Node.js 20+, ShellCheck (optional: `brew install shellcheck`)

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Sub-Skills

| Skill                         | Description                                                     |
| ----------------------------- | --------------------------------------------------------------- |
| **code-quality**              | ESLint + Prettier + Husky + lint-staged integrated setup        |
| **ci-cd-pipeline**            | GitHub Actions CI/CD quality pipeline                           |
| **typescript-best-practices** | TypeScript recommended tsconfig and type-safe coding guidelines |
| **git-workflow**              | Conventional Commits, branch naming, PR/Issue templates         |
| **project-setup-automation**  | GitHub Projects V2 full environment automation                  |

## Documentation

- **[Operation Guide (USAGE.md)](docs/USAGE.md)** — Views, status workflow, Sprint ops, Roadmap, automation
- **[Workflow Definition](docs/workflow-definition.md)** — 14-status workflow specification
- **[View Design](docs/view-design.md)** — 5-view design specification
- **[Automation Guide](docs/automation-guide.md)** — Workflow setup and troubleshooting

## License

ISC License. See [LICENSE](LICENSE) for details.
