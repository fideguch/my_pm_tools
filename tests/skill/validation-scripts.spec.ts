import { test, expect } from '@playwright/test';
import { readFile, listDir } from './helpers.js';

// ============================================================
// 4. Shell Script Validation
// ============================================================
test.describe('Shell Script Validation', () => {
  const scripts = [
    'scripts/setup-all.sh',
    'scripts/setup-labels.sh',
    'scripts/setup-fields.sh',
    'scripts/setup-views.sh',
  ];

  for (const script of scripts) {
    test(`${script} starts with shebang`, () => {
      const content = readFile(script);
      expect(content.startsWith('#!/bin/bash')).toBe(true);
    });
  }

  for (const script of scripts) {
    test(`${script} uses set -euo pipefail`, () => {
      const content = readFile(script);
      expect(content).toContain('set -euo pipefail');
    });
  }

  for (const script of scripts) {
    test(`${script} has usage comment`, () => {
      const content = readFile(script);
      expect(content).toContain('Usage:');
    });
  }

  test('setup-labels.sh creates exactly 18 labels (13 full + 5 lite)', () => {
    const content = readFile('scripts/setup-labels.sh');
    const labelCreateCount = (content.match(/gh label create/g) || []).length;
    expect(labelCreateCount).toBe(18);
  });

  test('setup-labels.sh has progress indicators [1/13] to [13/13] in full mode', () => {
    const content = readFile('scripts/setup-labels.sh');
    expect(content).toContain('[1/13]');
    expect(content).toContain('[13/13]');
  });

  test('setup-labels.sh uses --force flag', () => {
    const content = readFile('scripts/setup-labels.sh');
    expect(content).toContain('--force');
  });

  test('setup-labels.sh uses parameterized REPO (no hardcoded owner/repo)', () => {
    const content = readFile('scripts/setup-labels.sh');
    expect(content).toContain('$REPO');
    expect(content).not.toMatch(/gh label create.*--repo "[a-zA-Z]+\/[a-zA-Z]+"/);
  });

  test('setup-fields.sh creates Priority, Estimate, Target fields', () => {
    const content = readFile('scripts/setup-fields.sh');
    expect(content).toContain('Priority');
    expect(content).toContain('Estimate');
    expect(content).toContain('Target');
  });

  test('setup-fields.sh handles already-existing fields gracefully', () => {
    const content = readFile('scripts/setup-fields.sh');
    expect(content).toContain('2>/dev/null');
  });

  test('setup-all.sh calls all sub-scripts', () => {
    const content = readFile('scripts/setup-all.sh');
    expect(content).toContain('setup-fields.sh');
    expect(content).toContain('setup-labels.sh');
    expect(content).toContain('setup-views.sh');
  });

  test('setup-all.sh checks gh auth status', () => {
    const content = readFile('scripts/setup-all.sh');
    expect(content).toContain('gh auth status');
  });

  test('setup-views.sh creates 5 views', () => {
    const content = readFile('scripts/setup-views.sh');
    expect(content).toContain('Product Backlog');
    expect(content).toContain('Sprint Board');
    expect(content).toContain('Sprint Table');
    expect(content).toContain('Roadmap');
    expect(content).toContain('My Items');
  });

  test('setup-views.sh uses GraphQL API', () => {
    const content = readFile('scripts/setup-views.sh');
    expect(content).toContain('graphql');
  });

  test('no hardcoded OWNER in any script', () => {
    for (const script of scripts) {
      const content = readFile(script);
      // Should not have hardcoded owner like 'fideguch' — all should use variables
      const lines = content.split('\n');
      const hardcodedOwner = lines.filter(
        (l) =>
          !l.trim().startsWith('#') &&
          !l.includes('OWNER') &&
          !l.includes('$') &&
          /fideguch/.test(l)
      );
      expect(hardcodedOwner.length).toBe(0);
    }
  });

  test('all label names match between setup-labels.sh and CONTRIBUTING.md', () => {
    const scriptContent = readFile('scripts/setup-labels.sh');
    const readmeContent = readFile('CONTRIBUTING.md');
    const labelNames = [
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
    for (const label of labelNames) {
      expect(scriptContent).toContain(`"${label}"`);
      expect(readmeContent).toContain(`\`${label}\``);
    }
  });
});

// ============================================================
// 5. Cross-Reference Validation
// ============================================================
test.describe('Cross-Reference Validation', () => {
  test('README file tree lists all docs', () => {
    const readme = readFile('README.md');
    expect(readme).toContain('workflow-definition.md');
    expect(readme).toContain('view-design.md');
    expect(readme).toContain('automation-guide.md');
    expect(readme).toContain('USAGE.md');
  });

  test('README script table lists key scripts', () => {
    const readme = readFile('README.md');
    expect(readme).toContain('setup-all.sh');
    expect(readme).toContain('project-ops.sh');
    expect(readme).toContain('sprint-report.sh');
    expect(readme).toContain('migrate-import.sh');
  });

  test('README file tree lists all scripts', () => {
    const readme = readFile('README.md');
    expect(readme).toContain('setup-all.sh');
    expect(readme).toContain('setup-labels.sh');
    expect(readme).toContain('setup-fields.sh');
    expect(readme).toContain('setup-views.sh');
  });

  test('README lists all 5 sub-skills', () => {
    const readme = readFile('README.md');
    expect(readme).toContain('code-quality');
    expect(readme).toContain('ci-cd-pipeline');
    expect(readme).toContain('typescript-best-practices');
    expect(readme).toContain('git-workflow');
    expect(readme).toContain('project-setup-automation');
  });

  test('CONTRIBUTING.md has all 13 labels', () => {
    const contributing = readFile('CONTRIBUTING.md');
    const labelNames = [
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
    for (const label of labelNames) {
      expect(contributing).toContain(`\`${label}\``);
    }
  });

  test('README references USAGE.md with correct link', () => {
    const readme = readFile('README.md');
    expect(readme).toContain('docs/USAGE.md');
  });

  test('USAGE.md references all 5 workflow files', () => {
    const usage = readFile('docs/USAGE.md');
    expect(usage).toContain('ci.yml');
    expect(usage).toContain('project-automation.yml');
    expect(usage).toContain('pr-labeler.yml');
    expect(usage).toContain('stale-detection.yml');
    expect(usage).toContain('roadmap-date-sync.yml');
  });

  test('USAGE.md references all 6 views', () => {
    const usage = readFile('docs/USAGE.md');
    expect(usage).toContain('Issues');
    expect(usage).toContain('Product Backlog');
    expect(usage).toContain('Sprint Board');
    expect(usage).toContain('Sprint Table');
    expect(usage).toContain('Roadmap');
    expect(usage).toContain('My Items');
  });

  test('automation-guide.md references all 5 workflow templates', () => {
    const guide = readFile('docs/automation-guide.md');
    expect(guide).toContain('ci.yml');
    expect(guide).toContain('project-automation.yml');
    expect(guide).toContain('pr-labeler.yml');
    expect(guide).toContain('stale-detection.yml');
    expect(guide).toContain('roadmap-date-sync.yml');
  });

  test('automation-guide.md mentions 5 workflow templates count', () => {
    const guide = readFile('docs/automation-guide.md');
    expect(guide).toContain('5つ');
  });

  test('view-design.md has all 5 project views', () => {
    const design = readFile('docs/view-design.md');
    expect(design).toContain('Product Backlog');
    expect(design).toContain('Sprint Board');
    expect(design).toContain('Sprint Table');
    expect(design).toContain('Roadmap');
    expect(design).toContain('My Items');
  });

  test('workflow-definition.md has all 14 statuses', () => {
    const wf = readFile('docs/workflow-definition.md');
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
      expect(wf).toContain(status);
    }
  });

  test('label colors are defined in setup-labels.sh', () => {
    const script = readFile('scripts/setup-labels.sh');
    const colorMap: Record<string, string> = {
      feature: '0E8A16',
      bug: 'D73A4A',
      refine: 'FBCA04',
      infra: '6F42C1',
      docs: '0075CA',
      research: 'C5DEF5',
      frontend: 'F9A825',
      backend: '795548',
      design: 'E91E8F',
      growth: '2EA44F',
      blocked: '000000',
      'needs-review': 'FEF2C0',
      'good-first-issue': '7057FF',
    };
    for (const [_label, color] of Object.entries(colorMap)) {
      expect(script).toContain(color);
    }
  });

  test('sub-skills directories match README listing', () => {
    const skillDirs = listDir('skills');
    expect(skillDirs).toContain('code-quality');
    expect(skillDirs).toContain('ci-cd-pipeline');
    expect(skillDirs).toContain('typescript-best-practices');
    expect(skillDirs).toContain('git-workflow');
    expect(skillDirs).toContain('project-setup-automation');
    expect(skillDirs).toContain('pm-figjam-diagrams');
    expect(skillDirs).toContain('speckit-bridge');
    expect(skillDirs.length).toBe(7);
  });
});
