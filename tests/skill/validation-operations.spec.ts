import { test, expect } from '@playwright/test';
import { readFile } from './helpers.js';

// ============================================================
// 7. Sync Rule Validation
// ============================================================
test.describe('Sync Rule Validation', () => {
  test('SKILL.md references setup-labels.sh', () => {
    const skill = readFile('SKILL.md');
    expect(skill).toContain('setup-labels.sh');
  });

  test('README mentions all doc files', () => {
    const readme = readFile('README.md');
    expect(readme).toContain('workflow-definition.md');
    expect(readme).toContain('view-design.md');
    expect(readme).toContain('automation-guide.md');
    expect(readme).toContain('USAGE.md');
  });

  test('label names match across scripts, CONTRIBUTING, and USAGE.md', () => {
    const labels = [
      'feature',
      'bug',
      'refine',
      'infra',
      'docs',
      'research',
      'frontend',
      'backend',
      'design',
      'growth',
      'blocked',
      'needs-review',
      'good-first-issue',
    ];
    const script = readFile('scripts/setup-labels.sh');
    const readme = readFile('CONTRIBUTING.md');
    const usage = readFile('docs/USAGE.md');

    for (const label of labels) {
      expect(script).toContain(label);
      expect(readme).toContain(label);
      expect(usage).toContain(label);
    }
  });

  test('view names match between setup-views.sh and docs/view-design.md', () => {
    const views = ['Product Backlog', 'Sprint Board', 'Sprint Table', 'Roadmap', 'My Items'];
    const script = readFile('scripts/setup-views.sh');
    const design = readFile('docs/view-design.md');

    for (const view of views) {
      expect(script).toContain(view);
      expect(design).toContain(view);
    }
  });

  test('Priority options match between setup-fields.sh and SKILL.md', () => {
    const script = readFile('scripts/setup-fields.sh');
    const skill = readFile('SKILL.md');
    expect(script).toContain('P0');
    expect(script).toContain('P4');
    expect(skill).toContain('P0');
    expect(skill).toContain('P4');
  });

  test('view count is consistent: README says 6', () => {
    const readme = readFile('README.md');
    expect(readme).toContain('6種');
  });

  test('workflow count is consistent in automation guide', () => {
    const guide = readFile('docs/automation-guide.md');
    expect(guide).toContain('5つ');
  });

  test('CONTRIBUTING.md has same label list as README', () => {
    const contributing = readFile('CONTRIBUTING.md');
    const labels = [
      'feature',
      'bug',
      'refine',
      'infra',
      'docs',
      'research',
      'frontend',
      'backend',
      'design',
      'growth',
      'blocked',
      'needs-review',
      'good-first-issue',
    ];
    for (const label of labels) {
      expect(contributing).toContain(label);
    }
  });
});

// ============================================================
// 12. Automation & Operations Validation (v1.4.0)
// ============================================================
test.describe('Automation & Operations Validation', () => {
  test('project-ops.sh has all required commands', () => {
    const content = readFile('scripts/project-ops.sh');
    expect(content).toContain('add-issue');
    expect(content).toContain('add-pr');
    expect(content).toContain('move');
    expect(content).toContain('set-priority');
    expect(content).toContain('list-items');
    expect(content).toContain('list-fields');
  });

  test('project-ops.sh uses GraphQL mutations', () => {
    const content = readFile('scripts/project-ops.sh');
    expect(content).toContain('addProjectV2ItemById');
    expect(content).toContain('updateProjectV2ItemFieldValue');
  });

  test('setup-templates.sh clones repo and copies templates', () => {
    const content = readFile('scripts/setup-templates.sh');
    expect(content).toContain('gh repo clone');
    expect(content).toContain('.github/ISSUE_TEMPLATE');
    expect(content).toContain('.github/workflows');
    expect(content).toContain('git commit');
    expect(content).toContain('git push');
  });

  test('setup-templates.sh substitutes placeholders', () => {
    const content = readFile('scripts/setup-templates.sh');
    expect(content).toContain('__PROJECT_ID__');
    expect(content).toContain('__OWNER__');
    expect(content).toContain('sed');
  });

  test('setup-status.sh defines all 14 statuses', () => {
    const content = readFile('scripts/setup-status.sh');
    const statuses = [
      'Icebox',
      '進行待ち',
      '要件作成中',
      'デザイン待ち',
      'デザイン作成中',
      'アサイン待ち',
      '開発待ち',
      '開発中',
      'コードレビュー',
      'テスト中',
      'テスト落ち',
      'リリース待ち',
      'リリース済み',
      'Done',
    ];
    for (const status of statuses) {
      expect(content).toContain(status);
    }
  });

  test('setup-status.sh has manual fallback guide', () => {
    const content = readFile('scripts/setup-status.sh');
    expect(content).toContain('手動設定');
  });

  test('setup-all.sh calls setup-templates.sh', () => {
    const content = readFile('scripts/setup-all.sh');
    expect(content).toContain('setup-templates.sh');
  });

  test('setup-all.sh calls setup-status.sh', () => {
    const content = readFile('scripts/setup-all.sh');
    expect(content).toContain('setup-status.sh');
  });

  test('project-automation.yml has no TODO comments', () => {
    const content = readFile('templates/workflows/project-automation.yml');
    expect(content).not.toContain('// TODO');
  });

  test('project-automation.yml uses GraphQL mutations', () => {
    const content = readFile('templates/workflows/project-automation.yml');
    expect(content).toContain('addProjectV2ItemById');
    expect(content).toContain('updateProjectV2ItemFieldValue');
  });

  test('project-automation.yml handles all 3 status transitions', () => {
    const content = readFile('templates/workflows/project-automation.yml');
    expect(content).toContain('コードレビュー');
    expect(content).toContain('テスト中');
    expect(content).toContain('Done');
  });

  test('SKILL.md has operations command section', () => {
    const content = readFile('SKILL.md');
    expect(content).toContain('日常運用');
    expect(content).toContain('project-ops.sh');
  });

  test('USAGE.md has project item operations section', () => {
    const content = readFile('docs/USAGE.md');
    expect(content).toContain('project-ops.sh');
    expect(content).toContain('add-issue');
    expect(content).toContain('move');
  });

  test('automation-guide.md references project-ops.sh', () => {
    const content = readFile('docs/automation-guide.md');
    expect(content).toContain('project-ops.sh');
  });

  test('README.md file tree includes new scripts', () => {
    const content = readFile('README.md');
    expect(content).toContain('setup-templates.sh');
    expect(content).toContain('setup-status.sh');
    expect(content).toContain('project-ops.sh');
  });

  test('CHANGELOG.md has v1.4.0 entry', () => {
    const content = readFile('CHANGELOG.md');
    expect(content).toContain('[1.4.0]');
    expect(content).toContain('project-ops.sh');
  });
});

// ============================================================
// 13. Migration & Reporting Validation (v1.5.0)
// ============================================================
test.describe('Migration & Reporting Validation', () => {
  test('migrate-import.sh exists with shebang and pipefail', () => {
    const content = readFile('scripts/migrate-import.sh');
    expect(content.startsWith('#!/bin/bash')).toBe(true);
    expect(content).toContain('set -euo pipefail');
  });

  test('migrate-import.sh supports --dry-run flag', () => {
    const content = readFile('scripts/migrate-import.sh');
    expect(content).toContain('--dry-run');
    expect(content).toContain('DRY_RUN');
  });

  test('migrate-import.sh supports jira, linear, notion, generic formats', () => {
    const content = readFile('scripts/migrate-import.sh');
    expect(content).toContain('jira');
    expect(content).toContain('linear');
    expect(content).toContain('notion');
    expect(content).toContain('generic');
  });

  test('migrate-import.sh has status mapping tables', () => {
    const content = readFile('scripts/migrate-import.sh');
    expect(content).toContain('JIRA_STATUS_MAP');
    expect(content).toContain('LINEAR_STATUS_MAP');
    expect(content).toContain('JIRA_PRIORITY_MAP');
  });

  test('migrate-import.sh has duplicate detection', () => {
    const content = readFile('scripts/migrate-import.sh');
    expect(content).toContain('duplicate');
  });

  test('sprint-report.sh exists with shebang and pipefail', () => {
    const content = readFile('scripts/sprint-report.sh');
    expect(content.startsWith('#!/bin/bash')).toBe(true);
    expect(content).toContain('set -euo pipefail');
  });

  test('sprint-report.sh supports --sprint flag', () => {
    const content = readFile('scripts/sprint-report.sh');
    expect(content).toContain('--sprint');
    expect(content).toContain('current');
    expect(content).toContain('previous');
  });

  test('sprint-report.sh supports --json flag', () => {
    const content = readFile('scripts/sprint-report.sh');
    expect(content).toContain('--json');
    expect(content).toContain('JSON_OUTPUT');
  });

  test('sprint-report.sh calculates velocity', () => {
    const content = readFile('scripts/sprint-report.sh');
    expect(content).toContain('Velocity');
    expect(content).toContain('estimate_completed');
  });

  test('sprint-report.sh detects blocked items', () => {
    const content = readFile('scripts/sprint-report.sh');
    expect(content).toContain('blocked');
    expect(content).toContain('Blocked');
  });

  test('SKILL.md mentions migrate-import.sh', () => {
    const content = readFile('SKILL.md');
    expect(content).toContain('migrate-import.sh');
  });

  test('SKILL.md mentions sprint-report.sh', () => {
    const content = readFile('SKILL.md');
    expect(content).toContain('sprint-report.sh');
  });

  test('USAGE.md has migration section', () => {
    const content = readFile('docs/USAGE.md');
    expect(content).toContain('移行');
    expect(content).toContain('Jira');
    expect(content).toContain('Linear');
    expect(content).toContain('Notion');
  });

  test('USAGE.md has Sprint report section', () => {
    const content = readFile('docs/USAGE.md');
    expect(content).toContain('Sprint レポート');
    expect(content).toContain('ベロシティ');
  });

  test('README.md file tree includes migration and report scripts', () => {
    const content = readFile('README.md');
    expect(content).toContain('migrate-import.sh');
    expect(content).toContain('sprint-report.sh');
  });

  test('CHANGELOG.md has v1.5.0 entry', () => {
    const content = readFile('CHANGELOG.md');
    expect(content).toContain('[1.5.0]');
    expect(content).toContain('migrate-import.sh');
    expect(content).toContain('sprint-report.sh');
  });
});
