# Changelog

All notable changes to this project will be documented in this file.

## [1.5.0] - 2026-03-27

### Added

- `scripts/migrate-import.sh` — CSV import from Jira, Linear, Notion, or generic format. Auto-creates Issues, adds to Project, sets Status/Priority/Estimate. Supports `--dry-run` and duplicate detection.
- `scripts/sprint-report.sh` — Sprint velocity, completion rate, status breakdown, priority distribution, and blocker detection. Supports `--sprint current|previous|<name>` and `--json` output.
- Migration guide in docs/USAGE.md (Jira/Linear/Notion export procedures + mapping tables)
- Sprint report section in docs/USAGE.md (velocity tracking best practices)
- Migration and report tool sections in docs/automation-guide.md

### Changed

- SKILL.md Help Command updated with migration and report command examples
- SKILL.md operations section expanded with migrate-import.sh and sprint-report.sh usage

## [1.4.0] - 2026-03-27

### Added

- `scripts/setup-templates.sh` — automated template and workflow deployment to target repos (clone → copy → substitute placeholders → commit → push)
- `scripts/setup-status.sh` — automated Status 14 options configuration via GraphQL API with manual fallback
- `scripts/project-ops.sh` — project operations CLI (add-issue, add-pr, move, set-priority, list-items, list-fields)
- Project item operations section in docs/USAGE.md
- GraphQL implementation details in docs/automation-guide.md
- Operations commands section in SKILL.md

### Changed

- `scripts/setup-all.sh` — fully automated (Phase 4-5 now auto-deploy templates and workflows)
- `templates/workflows/project-automation.yml` — replaced TODO comments with real GraphQL mutations for status transitions (PR→コードレビュー, Review→テスト中, Merge→Done)

## [1.3.0] - 2026-03-27

### Added

- YAML frontmatter in SKILL.md with 10 trigger keywords
- Help Command section with quick-start guide and connected skills
- Progress Detection logic for resuming partially completed setups
- `install.sh` for automated skill installation to `~/.claude/skills/`
- SECURITY.md with PAT handling guidelines
- CHANGELOG.md (this file)
- README.en.md (English version)

### Changed

- SKILL.md expanded from 289 to ~420 lines

## [1.2.0] - 2026-03-27

### Added

- 164 Playwright regression tests (`tests/skill-structure.spec.ts`)
- Code quality toolchain: ESLint + Prettier + Husky + lint-staged
- CI/CD: GitHub Actions (lint, format, typecheck, shellcheck, test)
- PR auto-labeler with 7 label categories
- CLAUDE.md with Five-File Sync Rule
- CONTRIBUTING.md (branch naming, commit conventions, SLAs, labels)
- LICENSE (ISC)
- `.github/` templates (bug report, feature request, PR template)

### Changed

- README.md expanded with developer setup and file tree

### Removed

- README_INIT.md (orphan placeholder)

## [1.1.0] - 2026-03-27

### Added

- `templates/workflows/roadmap-date-sync.yml` (Sprint date sync)
- `docs/USAGE.md` (474-line comprehensive operation manual)
- Roadmap Date Sync section in `docs/automation-guide.md`

### Changed

- Prettier single-quote formatting applied to all template files
- README.md updated with USAGE.md link and 6-view count
- SKILL.md Phase 5 updated with roadmap-date-sync.yml

## [1.0.0] - 2026-03-27

### Added

- SKILL.md: 6-phase Devin playbook for GitHub Projects V2 setup
- 4 shell scripts: setup-all.sh, setup-labels.sh, setup-fields.sh, setup-views.sh
- 5 workflow templates: ci, project-automation, pr-labeler, stale-detection
- Issue templates (bug report, feature request) and PR template
- 5 sub-skills: code-quality, ci-cd-pipeline, typescript, git-workflow, project-setup-automation
- 3 documentation files: workflow-definition, view-design, automation-guide
- README.md with overview, file structure, label table
