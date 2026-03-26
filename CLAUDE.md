# CLAUDE.md

## Purpose

Maintain and extend the `set-up-github-project` skill.
One-command GitHub Projects V2 environment setup: 14-status workflow, 6 views,
custom fields, 13 labels, Issue/PR templates, and 5 GitHub Actions workflows.

## Language Rules

- Documentation, UI, communication: Japanese (default)
- Code (variables, comments, commits, PR): English
- Shell scripts: English comments preferred, Japanese output strings OK

## Project Structure

```
set-up-github-project/
├── SKILL.md                     # Devin playbook (6-phase setup logic)
├── README.md                    # Project overview & developer guide
├── CLAUDE.md                    # Project instructions (this file)
├── CONTRIBUTING.md              # Contribution guidelines
├── scripts/                     # Shell scripts for gh CLI automation
│   ├── setup-all.sh             # Master orchestrator
│   ├── setup-labels.sh          # 13 labels bulk creation
│   ├── setup-fields.sh          # Custom fields (Priority, Estimate, Target)
│   └── setup-views.sh           # 5 project views creation
├── templates/                   # Files to copy into TARGET repos
│   ├── ISSUE_TEMPLATE/          # Issue templates (bug, feature)
│   ├── pull_request_template.md # PR template
│   └── workflows/               # 5 GitHub Actions workflow templates
├── skills/                      # 5 reusable Devin sub-skills
├── docs/                        # Detailed documentation
│   ├── USAGE.md                 # Comprehensive operation manual
│   ├── workflow-definition.md   # 14-status workflow spec
│   ├── view-design.md           # 5-view design spec
│   └── automation-guide.md      # Automation setup guide
├── tests/                       # Playwright regression tests
└── .github/                     # CI/CD for THIS repo (not target repos)
```

## Tech Stack

- Skill definition: Markdown (SKILL.md, 6 phases)
- Automation: Shell scripts (bash, gh CLI, GraphQL)
- Tests: Playwright + TypeScript (strict mode)
- Code quality: ESLint + Prettier + Husky + lint-staged
- CI: GitHub Actions (lint, typecheck, format:check, shellcheck, test)

## Five-File Sync Rule (CRITICAL)

When modifying labels, statuses, views, or fields, always update simultaneously:

1. **SKILL.md** — playbook phases and checklists
2. **README.md** — overview tables and file tree
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

These are separate concerns. Do not confuse them.

## Key Commands

```bash
npm test                          # Run regression tests (150+)
npm run quality                   # lint + typecheck + format:check
npm run format                    # Auto-format all files
shellcheck scripts/*.sh           # Validate shell scripts (optional, requires shellcheck)
```

## GitHub

- Remote: `git@github.com:fideguch/set-up-github-project.git`
- Default branch: main
- Default account: fideguch
