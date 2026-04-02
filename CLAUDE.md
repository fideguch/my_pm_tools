# CLAUDE.md

## Purpose

Maintain and extend the `my_pm_tools` skill.
PM assistant for GitHub Projects V2 with 3 modes:

- **Mode A**: Environment setup (14 statuses, 6 views, 13 labels, templates, workflows; `--lite` option: 8/3/5)
- **Mode B**: Daily operations (Issue/PR creation, status changes, backlog management)
- **Mode C**: Analytics (Sprint reports, velocity tracking)

## Pre-Coding Gate (MANDATORY)

Before writing or modifying any code in this project, MUST read:

1. **`.claude/rules/codebase-integrity.md`** — Architecture patterns, type safety rules, shell conventions, test patterns, naming conventions, change checklist
2. **This file (CLAUDE.md)** — Project structure, Five-File Sync Rule, key commands
3. **`docs/new-tool-onboarding.md`** — New external API tool onboarding process (bloodline connectivity gate)

This prevents structural drift, `as` cast regression, circular imports, and pattern-breaking changes. Skip this gate only for documentation-only edits.

## Language Rules

- Documentation, UI, communication: Japanese (default)
- Code (variables, comments, commits, PR): English
- Shell scripts: English comments preferred, Japanese output strings OK

## Project Structure

```
my_pm_tools/
├── SKILL.md                     # Skill definition (3-mode architecture)
├── README.md / README.en.md     # User-facing documentation
├── CLAUDE.md                    # Project instructions (this file)
├── CONTRIBUTING.md              # Contribution guidelines
├── scripts/
│   ├── setup-all.sh             # Mode A: Full environment setup
│   ├── setup-labels.sh          # Mode A: 13 labels
│   ├── setup-fields.sh          # Mode A: Custom fields
│   ├── setup-status.sh          # Mode A: 14 status options
│   ├── setup-views.sh           # Mode A: 5 views
│   ├── setup-templates.sh       # Mode A: Template auto-deploy
│   ├── project-ops.sh           # Mode B: Issue/PR/status operations
│   ├── migrate-import.sh        # CSV import (Jira/Linear/Notion)
│   └── sprint-report.sh         # Mode C: Sprint analytics
├── src/                         # MCP Server (TypeScript)
│   ├── index.ts                 # Entry point (stdio transport)
│   ├── server.ts                # Server factory
│   ├── graphql/                 # GraphQL client, queries, mutations
│   ├── tools/                   # 28 MCP tools
│   │   ├── notion/              # Notion API tools (7: search, get-page, query-db, create-page, append-blocks, update-page, archive-page)
│   │   ├── workspace/           # Google Workspace tools (9: drive, docs, sheets, slides, calendar, gmail, update-sheet, append-sheet, create-event)
│   │   └── *.ts                 # GitHub Project tools (12: list-fields, list-items, add-item, create-issue, etc.)
│   ├── schemas/                 # Zod input schemas
│   └── types/                   # TypeScript type definitions
├── templates/                   # Files to copy into TARGET repos
├── skills/                      # 8 reusable sub-skills
├── docs/                        # Detailed documentation
├── tests/                       # 502 Playwright regression tests
│   ├── skill/                   # Skill validation (3 files: structure, content, validation)
│   ├── mcp/                     # MCP tool/schema/server tests (72+ workspace tests)
│   └── scenarios/               # Scenario tests (47+ tests, incl. PM + cross-service workflows)
└── .github/                     # CI/CD for THIS repo
```

## Tech Stack

- Skill definition: Markdown (SKILL.md, 3-mode architecture)
- MCP Server: TypeScript + @modelcontextprotocol/sdk + @octokit/graphql + Zod
- Automation: Shell scripts (bash, gh CLI, GraphQL) — 9 scripts, 1,498 lines
- Tests: Playwright + TypeScript (strict mode) — 502 tests
- Code quality: ESLint + Prettier + Husky + lint-staged
- CI: GitHub Actions (lint, typecheck, format:check, shellcheck, test)

## Five-File Sync Rule (CRITICAL)

When modifying labels, statuses, views, or fields, always update simultaneously:

1. **SKILL.md** — mode sections and command references
2. **README.md** — overview tables and script list
3. **scripts/\*.sh** — automation scripts
4. **docs/\*.md** — detailed documentation
5. **tests/skill-structure.spec.ts** — regression tests

Verify before commit:

```bash
npm run quality && npm test
```

## Key Distinction: templates/ vs .github/

- `templates/` — files to copy into **target repos** that users set up with this skill
- `.github/` — CI/CD and templates for **this repo's own development**

## Key Commands

```bash
npm test                          # Run 502 regression tests
npm run quality                   # lint + typecheck + format:check
npm run build                     # Build MCP server to dist/
npm run format                    # Auto-format all files
shellcheck scripts/*.sh           # Validate shell scripts
```

## Memory Architecture (3-Layer)

This project uses a structured knowledge management system to maintain strategic alignment across sessions.

| Layer    | Location                          | Purpose                                             | Size Limit     |
| -------- | --------------------------------- | --------------------------------------------------- | -------------- |
| **Hot**  | CLAUDE.md + MEMORY.md             | Always loaded. Mission, active rules, current state | 200 lines each |
| **Warm** | memory/decisions/, memory/\*.md   | Task-linked. ADRs, preferences, learnings           | No limit       |
| **Cold** | HANDOFF.md, docs/, Sprint history | On-demand archive. Past sessions, detailed docs     | No limit       |

### Strategic Alignment Check

Before proposing new features or direction changes:

1. Read `memory/north-star.md` — does this serve the Mission?
2. Check `memory/DECISION-LOG.md` — was this already decided or rejected?
3. Verify against Non-Goals — does this conflict with what we explicitly don't do?

### Deprecation Protocol (CRITICAL)

When the user abandons a decision, direction, or feature:

1. **Never delete** the ADR — mark status as `abandoned` or `superseded`
2. **Record the reason** in 1-2 sentences (why it was stopped)
3. **Update** `memory/DECISION-LOG.md` summary table
4. **Remove** related content from this CLAUDE.md file
5. **If replaced**: create new ADR, set old ADR's `superseded_by` field
6. **Verify** no stale references remain in Hot Memory layer

This prevents "memory pollution" where outdated decisions mislead future sessions.

### Decision Classification (Bezos Framework)

- **Type 1** (one-way door): Irreversible. Require careful deliberation and new ADR to reverse.
- **Type 2** (two-way door): Reversible. Can be changed cheaply. Decide fast with ~70% information.

## GitHub

- Remote: `git@github.com:fideguch/my_pm_tools.git`
- Default branch: main
- Default account: fideguch
