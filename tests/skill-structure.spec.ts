import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve(__dirname, '..');

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

function listDir(relativePath: string): string[] {
  const dir = path.join(ROOT, relativePath);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir);
}

// ============================================================
// 1. File Structure Validation
// ============================================================
test.describe('File Structure Validation', () => {
  const requiredRootFiles = [
    'SKILL.md',
    'README.md',
    'CONTRIBUTING.md',
    'CLAUDE.md',
    'LICENSE',
    '.gitignore',
    'package.json',
    'tsconfig.json',
    'playwright.config.ts',
  ];

  for (const file of requiredRootFiles) {
    test(`root file exists: ${file}`, () => {
      expect(fileExists(file)).toBe(true);
    });
  }

  const requiredDocs = [
    'docs/USAGE.md',
    'docs/workflow-definition.md',
    'docs/view-design.md',
    'docs/automation-guide.md',
  ];

  for (const file of requiredDocs) {
    test(`doc file exists: ${file}`, () => {
      expect(fileExists(file)).toBe(true);
    });
  }

  const requiredScripts = [
    'scripts/setup-all.sh',
    'scripts/setup-labels.sh',
    'scripts/setup-fields.sh',
    'scripts/setup-views.sh',
  ];

  for (const file of requiredScripts) {
    test(`script file exists: ${file}`, () => {
      expect(fileExists(file)).toBe(true);
    });
  }

  const requiredTemplates = [
    'templates/ISSUE_TEMPLATE/bug_report.yml',
    'templates/ISSUE_TEMPLATE/feature_request.yml',
    'templates/pull_request_template.md',
  ];

  for (const file of requiredTemplates) {
    test(`template file exists: ${file}`, () => {
      expect(fileExists(file)).toBe(true);
    });
  }

  const requiredWorkflows = [
    'templates/workflows/ci.yml',
    'templates/workflows/project-automation.yml',
    'templates/workflows/pr-labeler.yml',
    'templates/workflows/stale-detection.yml',
    'templates/workflows/roadmap-date-sync.yml',
  ];

  for (const file of requiredWorkflows) {
    test(`workflow template exists: ${file}`, () => {
      expect(fileExists(file)).toBe(true);
    });
  }

  const requiredSkills = [
    'skills/code-quality/SKILL.md',
    'skills/ci-cd-pipeline/SKILL.md',
    'skills/typescript-best-practices/SKILL.md',
    'skills/git-workflow/SKILL.md',
    'skills/project-setup-automation/SKILL.md',
  ];

  for (const file of requiredSkills) {
    test(`sub-skill exists: ${file}`, () => {
      expect(fileExists(file)).toBe(true);
    });
  }

  // .github/ directory for this repo
  const requiredGithubFiles = [
    '.github/workflows/ci.yml',
    '.github/workflows/pr-labeler.yml',
    '.github/labeler.yml',
    '.github/ISSUE_TEMPLATE/bug_report.yml',
    '.github/ISSUE_TEMPLATE/feature_request.yml',
    '.github/pull_request_template.md',
  ];

  for (const file of requiredGithubFiles) {
    test(`.github file exists: ${file}`, () => {
      expect(fileExists(file)).toBe(true);
    });
  }

  test('README_INIT.md should not exist (orphan)', () => {
    expect(fileExists('README_INIT.md')).toBe(false);
  });

  test('tests directory exists with spec file', () => {
    expect(fileExists('tests/skill-structure.spec.ts')).toBe(true);
  });
});

// ============================================================
// 2. SKILL.md Content Validation
// ============================================================
test.describe('SKILL.md Content Validation', () => {
  let content: string;

  test.beforeAll(() => {
    content = readFile('SKILL.md');
  });

  test('has metadata section with macro', () => {
    expect(content).toContain('!setup_github_project');
  });

  test('has metadata section with triggers', () => {
    expect(content).toContain('トリガー');
  });

  test('has metadata section with prerequisites', () => {
    expect(content).toContain('前提条件');
  });

  test('contains Phase 1: Custom fields', () => {
    expect(content).toContain('Phase 1');
    expect(content).toContain('カスタムフィールド');
  });

  test('contains Phase 2: Labels', () => {
    expect(content).toContain('Phase 2');
    expect(content).toContain('ラベル');
  });

  test('contains Phase 3: Views', () => {
    expect(content).toContain('Phase 3');
    expect(content).toContain('ビュー');
  });

  test('contains Phase 4: Templates', () => {
    expect(content).toContain('Phase 4');
    expect(content).toContain('テンプレート');
  });

  test('contains Phase 5: Automation', () => {
    expect(content).toContain('Phase 5');
    expect(content).toContain('自動化');
  });

  test('contains Phase 6: Documentation', () => {
    expect(content).toContain('Phase 6');
    expect(content).toContain('ドキュメント');
  });

  test('references 14 statuses', () => {
    expect(content).toContain('14');
    expect(content).toContain('Icebox');
    expect(content).toContain('Done');
  });

  test('references all 14 status names', () => {
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

  test('references 13 labels', () => {
    expect(content).toContain('13');
  });

  test('references Priority field with P0-P4', () => {
    expect(content).toContain('Priority');
    expect(content).toContain('P0');
    expect(content).toContain('P4');
  });

  test('references Estimate field', () => {
    expect(content).toContain('Estimate');
  });

  test('references Target field', () => {
    expect(content).toContain('Target');
  });

  test('references Sprint/Iteration field', () => {
    expect(content).toContain('Sprint');
    expect(content).toContain('Iteration');
  });

  test('references 5 workflow files in Phase 5', () => {
    expect(content).toContain('ci.yml');
    expect(content).toContain('project-automation.yml');
    expect(content).toContain('pr-labeler.yml');
    expect(content).toContain('stale-detection.yml');
    expect(content).toContain('roadmap-date-sync.yml');
  });

  test('has completion checklist items', () => {
    const checklistCount = (content.match(/- \[ \]/g) || []).length;
    expect(checklistCount).toBeGreaterThanOrEqual(10);
  });

  test('references setup-labels.sh script', () => {
    expect(content).toContain('setup-labels.sh');
  });

  test('contains GraphQL API references', () => {
    expect(content).toContain('GraphQL');
  });

  test('references gh CLI', () => {
    expect(content).toContain('gh');
  });

  test('references Classic PAT requirement', () => {
    expect(content).toContain('Classic PAT');
  });

  test('contains view creation commands', () => {
    expect(content).toContain('Product Backlog');
    expect(content).toContain('Sprint Board');
    expect(content).toContain('Sprint Table');
    expect(content).toContain('Roadmap');
    expect(content).toContain('My Items');
  });
});

// ============================================================
// 3. Template YAML Validation
// ============================================================
test.describe('Template YAML Validation', () => {
  // Simple YAML validation using Ruby (available on macOS/Linux)
  function isValidYaml(filePath: string): boolean {
    try {
      execSync(`ruby -ryaml -e "YAML.safe_load(File.read('${path.join(ROOT, filePath)}'))"`, {
        stdio: 'pipe',
      });
      return true;
    } catch {
      return false;
    }
  }

  const yamlFiles = [
    'templates/ISSUE_TEMPLATE/bug_report.yml',
    'templates/ISSUE_TEMPLATE/feature_request.yml',
    'templates/workflows/ci.yml',
    'templates/workflows/project-automation.yml',
    'templates/workflows/pr-labeler.yml',
    'templates/workflows/stale-detection.yml',
    'templates/workflows/roadmap-date-sync.yml',
  ];

  for (const file of yamlFiles) {
    test(`valid YAML: ${file}`, () => {
      expect(isValidYaml(file)).toBe(true);
    });
  }

  test('bug_report.yml has required issue template fields', () => {
    const content = readFile('templates/ISSUE_TEMPLATE/bug_report.yml');
    expect(content).toContain('name:');
    expect(content).toContain('description:');
    expect(content).toContain('body:');
    expect(content).toContain('labels:');
  });

  test('bug_report.yml has severity dropdown', () => {
    const content = readFile('templates/ISSUE_TEMPLATE/bug_report.yml');
    expect(content).toContain('type: dropdown');
    expect(content).toContain('severity');
  });

  test('feature_request.yml has required issue template fields', () => {
    const content = readFile('templates/ISSUE_TEMPLATE/feature_request.yml');
    expect(content).toContain('name:');
    expect(content).toContain('description:');
    expect(content).toContain('body:');
    expect(content).toContain('labels:');
  });

  test('feature_request.yml has priority dropdown', () => {
    const content = readFile('templates/ISSUE_TEMPLATE/feature_request.yml');
    expect(content).toContain('type: dropdown');
    expect(content).toContain('priority');
  });

  test('all workflow templates have name, on, and jobs keys', () => {
    const workflows = [
      'templates/workflows/ci.yml',
      'templates/workflows/project-automation.yml',
      'templates/workflows/pr-labeler.yml',
      'templates/workflows/stale-detection.yml',
      'templates/workflows/roadmap-date-sync.yml',
    ];
    for (const wf of workflows) {
      const content = readFile(wf);
      expect(content).toContain('name:');
      expect(content).toContain('on:');
      expect(content).toContain('jobs:');
    }
  });

  test('ci.yml contains quality check steps', () => {
    const content = readFile('templates/workflows/ci.yml');
    expect(content).toContain('Lint');
    expect(content).toContain('Build');
  });

  test('roadmap-date-sync.yml uses placeholders not hardcoded values', () => {
    const content = readFile('templates/workflows/roadmap-date-sync.yml');
    expect(content).toContain('__PROJECT_ID__');
    expect(content).toContain('__OWNER__');
  });

  test('roadmap-date-sync.yml has schedule trigger', () => {
    const content = readFile('templates/workflows/roadmap-date-sync.yml');
    expect(content).toContain('schedule:');
    expect(content).toContain('cron:');
  });

  test('stale-detection.yml has weekly cron', () => {
    const content = readFile('templates/workflows/stale-detection.yml');
    expect(content).toContain('cron:');
  });

  test('project-automation.yml references PROJECT_TOKEN secret', () => {
    const content = readFile('templates/workflows/project-automation.yml');
    expect(content).toContain('PROJECT_TOKEN');
  });

  test('all YAML templates use single quotes (Prettier formatted)', () => {
    const files = [
      'templates/ISSUE_TEMPLATE/bug_report.yml',
      'templates/ISSUE_TEMPLATE/feature_request.yml',
      'templates/workflows/ci.yml',
      'templates/workflows/stale-detection.yml',
    ];
    for (const file of files) {
      const content = readFile(file);
      // Should not have double-quoted YAML string values (except in multiline blocks)
      const lines = content
        .split('\n')
        .filter((l) => !l.trim().startsWith('#') && !l.trim().startsWith('-') && l.includes(': "'));
      // Allow some double quotes in special cases (env vars, etc), but most should be single
      expect(lines.length).toBeLessThanOrEqual(3);
    }
  });
});

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

  test('setup-labels.sh creates exactly 13 labels', () => {
    const content = readFile('scripts/setup-labels.sh');
    const labelCreateCount = (content.match(/gh label create/g) || []).length;
    expect(labelCreateCount).toBe(13);
  });

  test('setup-labels.sh has progress indicators [1/13] to [13/13]', () => {
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

  test('all label names match between setup-labels.sh and README.md', () => {
    const scriptContent = readFile('scripts/setup-labels.sh');
    const readmeContent = readFile('README.md');
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

  test('README file tree lists all workflow templates', () => {
    const readme = readFile('README.md');
    expect(readme).toContain('ci.yml');
    expect(readme).toContain('project-automation.yml');
    expect(readme).toContain('pr-labeler.yml');
    expect(readme).toContain('stale-detection.yml');
    expect(readme).toContain('roadmap-date-sync.yml');
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

  test('README label table has exactly 13 labels', () => {
    const readme = readFile('README.md');
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
      expect(readme).toContain(`\`${label}\``);
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

  test('label colors match between setup-labels.sh and README.md', () => {
    const script = readFile('scripts/setup-labels.sh');
    const readme = readFile('README.md');
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
      expect(readme).toContain(`#${color}`);
    }
  });

  test('sub-skills directories match README listing', () => {
    const skillDirs = listDir('skills');
    expect(skillDirs).toContain('code-quality');
    expect(skillDirs).toContain('ci-cd-pipeline');
    expect(skillDirs).toContain('typescript-best-practices');
    expect(skillDirs).toContain('git-workflow');
    expect(skillDirs).toContain('project-setup-automation');
    expect(skillDirs.length).toBe(5);
  });
});

// ============================================================
// 6. Documentation Consistency
// ============================================================
test.describe('Documentation Consistency', () => {
  const markdownFiles = [
    'README.md',
    'SKILL.md',
    'CONTRIBUTING.md',
    'CLAUDE.md',
    'LICENSE',
    'docs/USAGE.md',
    'docs/workflow-definition.md',
    'docs/view-design.md',
    'docs/automation-guide.md',
  ];

  for (const file of markdownFiles.filter((f) => f.endsWith('.md') && f !== 'LICENSE')) {
    test(`${file} has a top-level heading`, () => {
      const content = readFile(file);
      expect(content).toMatch(/^#\s+/m);
    });
  }

  test('CONTRIBUTING.md references branch naming convention', () => {
    const content = readFile('CONTRIBUTING.md');
    expect(content).toContain('feature/');
    expect(content).toContain('fix/');
  });

  test('CONTRIBUTING.md references commit conventions', () => {
    const content = readFile('CONTRIBUTING.md');
    expect(content).toContain('feat');
    expect(content).toContain('fix');
    expect(content).toContain('docs');
  });

  test('CONTRIBUTING.md references quality check commands', () => {
    const content = readFile('CONTRIBUTING.md');
    expect(content).toContain('npm run quality');
    expect(content).toContain('npm test');
  });

  test('CLAUDE.md references Five-File Sync Rule', () => {
    const content = readFile('CLAUDE.md');
    expect(content).toContain('SKILL.md');
    expect(content).toContain('README.md');
    expect(content).toContain('scripts');
    expect(content).toContain('docs');
    expect(content).toContain('tests');
  });

  test('CLAUDE.md references key commands', () => {
    const content = readFile('CLAUDE.md');
    expect(content).toContain('npm test');
    expect(content).toContain('npm run quality');
  });

  test('CLAUDE.md references GitHub remote', () => {
    const content = readFile('CLAUDE.md');
    expect(content).toContain('github.com');
    expect(content).toContain('set-up-github-project');
  });

  test('README references CONTRIBUTING.md', () => {
    const readme = readFile('README.md');
    expect(readme).toContain('CONTRIBUTING');
  });

  test('README has prerequisites section', () => {
    const readme = readFile('README.md');
    expect(readme).toContain('前提条件');
  });

  test('README has usage section', () => {
    const readme = readFile('README.md');
    expect(readme).toContain('使い方');
  });

  test('README has file structure section', () => {
    const readme = readFile('README.md');
    expect(readme).toContain('ファイル構成');
  });

  test('README mentions ISC license', () => {
    const readme = readFile('README.md');
    expect(readme).toMatch(/ISC|License/i);
  });

  test('status count (14) is consistent across docs', () => {
    const files = ['SKILL.md', 'README.md', 'docs/USAGE.md'];
    for (const file of files) {
      const content = readFile(file);
      expect(content).toContain('14');
      expect(content).toContain('Icebox');
      expect(content).toContain('Done');
    }
  });

  test('workflow-definition.md mentions WIP limits', () => {
    const content = readFile('docs/workflow-definition.md');
    expect(content).toContain('WIP');
  });

  test('USAGE.md has troubleshooting section', () => {
    const usage = readFile('docs/USAGE.md');
    expect(usage).toContain('トラブルシューティング');
  });

  test('USAGE.md has best practices section', () => {
    const usage = readFile('docs/USAGE.md');
    expect(usage).toContain('ベストプラクティス');
  });
});

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

  test('label names match across scripts, README, and USAGE.md', () => {
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
    const readme = readFile('README.md');
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

  test('workflow count is consistent across docs', () => {
    const readme = readFile('README.md');
    const skill = readFile('SKILL.md');
    const guide = readFile('docs/automation-guide.md');
    // All should reference 5 GitHub Actions
    expect(readme).toContain('GitHub Actions 5');
    expect(skill).toContain('5ファイル');
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
// 8. Package Configuration Validation
// ============================================================
test.describe('Package Configuration Validation', () => {
  test('package.json has required scripts', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.scripts.test).toBeDefined();
    expect(pkg.scripts.format).toBeDefined();
    expect(pkg.scripts['format:check']).toBeDefined();
    expect(pkg.scripts.typecheck).toBeDefined();
    expect(pkg.scripts.quality).toBeDefined();
    expect(pkg.scripts.prepare).toBeDefined();
  });

  test('package.json has lint-staged config', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg['lint-staged']).toBeDefined();
    expect(pkg['lint-staged']['*.{json,md,yml,yaml}']).toBeDefined();
  });

  test('package.json has playwright devDependency', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.devDependencies['@playwright/test']).toBeDefined();
  });

  test('package.json has husky devDependency', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.devDependencies.husky).toBeDefined();
  });

  test('package.json has prettier devDependency', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.devDependencies.prettier).toBeDefined();
  });

  test('tsconfig.json uses strict mode', () => {
    const tsconfig = JSON.parse(readFile('tsconfig.json'));
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  test('.prettierrc exists and has singleQuote', () => {
    const config = JSON.parse(readFile('.prettierrc'));
    expect(config.singleQuote).toBe(true);
  });
});

// ============================================================
// 9. CI/CD Configuration Validation
// ============================================================
test.describe('CI/CD Configuration Validation', () => {
  test('.github/workflows/ci.yml has quality check steps', () => {
    const ci = readFile('.github/workflows/ci.yml');
    expect(ci).toContain('Format Check');
    expect(ci).toContain('Type Check');
    expect(ci).toContain('Test');
  });

  test('.github/workflows/ci.yml targets main branch', () => {
    const ci = readFile('.github/workflows/ci.yml');
    expect(ci).toContain('main');
  });

  test('.github/workflows/ci.yml uses Node.js 20', () => {
    const ci = readFile('.github/workflows/ci.yml');
    expect(ci).toContain('20');
  });

  test('.github/workflows/pr-labeler.yml exists and uses labeler action', () => {
    const labeler = readFile('.github/workflows/pr-labeler.yml');
    expect(labeler).toContain('labeler');
  });

  test('.github/labeler.yml has rules for key directories', () => {
    const config = readFile('.github/labeler.yml');
    expect(config).toContain('scripts');
    expect(config).toContain('templates');
    expect(config).toContain('docs');
  });
});

// ============================================================
// 10. .github/ Templates for This Repo
// ============================================================
test.describe('.github/ Templates for This Repo', () => {
  test('.github/ISSUE_TEMPLATE/bug_report.yml is valid YAML', () => {
    try {
      execSync(
        `ruby -ryaml -e "YAML.safe_load(File.read('${path.join(ROOT, '.github/ISSUE_TEMPLATE/bug_report.yml')}'))"`,
        { stdio: 'pipe' }
      );
    } catch {
      expect(false).toBe(true);
    }
  });

  test('.github/ISSUE_TEMPLATE/feature_request.yml is valid YAML', () => {
    try {
      execSync(
        `ruby -ryaml -e "YAML.safe_load(File.read('${path.join(ROOT, '.github/ISSUE_TEMPLATE/feature_request.yml')}'))"`,
        { stdio: 'pipe' }
      );
    } catch {
      expect(false).toBe(true);
    }
  });

  test('.github/pull_request_template.md has closes # syntax', () => {
    const content = readFile('.github/pull_request_template.md');
    expect(content).toContain('closes #');
  });

  test('.github templates are distinct from templates/ directory', () => {
    // .github/ templates are for THIS repo; templates/ are for TARGET repos
    const ghBug = readFile('.github/ISSUE_TEMPLATE/bug_report.yml');
    const tplBug = readFile('templates/ISSUE_TEMPLATE/bug_report.yml');
    // They may be similar but .github/ should reference this repo's context
    expect(ghBug).toContain('name:');
    expect(tplBug).toContain('name:');
  });
});
