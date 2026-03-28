import { test, expect } from '@playwright/test';
import { readFile } from './helpers.js';

// ============================================================
// 14. PM Assistant Redesign Validation (v2.0.0)
// ============================================================
test.describe('PM Assistant Redesign Validation', () => {
  test('SKILL.md name is github_project_manager', () => {
    const content = readFile('SKILL.md');
    expect(content).toContain('name: github_project_manager');
  });

  test('SKILL.md has Onboarding section with config.json', () => {
    const content = readFile('SKILL.md');
    expect(content).toContain('Onboarding');
    expect(content).toContain('.github-project-config.json');
  });

  test('SKILL.md has Mode A: Setup', () => {
    const content = readFile('SKILL.md');
    expect(content).toContain('Mode A');
    expect(content).toMatch(/環境構築|Setup/);
  });

  test('SKILL.md has Mode B: Operations as main mode', () => {
    const content = readFile('SKILL.md');
    expect(content).toContain('Mode B');
    expect(content).toContain('日常運用');
    expect(content).toContain('メイン');
  });

  test('SKILL.md has Mode C: Analytics', () => {
    const content = readFile('SKILL.md');
    expect(content).toContain('Mode C');
    expect(content).toMatch(/分析|Analytics/);
  });

  test('SKILL.md has dialog patterns for Issue creation', () => {
    const content = readFile('SKILL.md');
    expect(content).toContain('Issue にして');
    expect(content).toContain('gh issue create');
  });

  test('SKILL.md has dialog patterns for PR creation', () => {
    const content = readFile('SKILL.md');
    expect(content).toContain('PR を作って');
    expect(content).toContain('gh pr create');
  });

  test('SKILL.md has dialog patterns for status change', () => {
    const content = readFile('SKILL.md');
    expect(content).toContain('開発中にして');
  });

  test('README.md title is GitHub Project Manager', () => {
    const content = readFile('README.md');
    expect(content).toContain('# GitHub Project Manager');
  });

  test('README.en.md title is GitHub Project Manager', () => {
    const content = readFile('README.en.md');
    expect(content).toContain('# GitHub Project Manager');
  });

  test('USAGE.md has daily operations section before views section', () => {
    const content = readFile('docs/USAGE.md');
    const dailyOpsIndex = content.indexOf('## 日常運用');
    const viewsIndex = content.indexOf('## ビューの使い方');
    // Daily operations should appear before views section
    expect(dailyOpsIndex).toBeGreaterThan(-1);
    expect(viewsIndex).toBeGreaterThan(-1);
    expect(dailyOpsIndex).toBeLessThan(viewsIndex);
  });

  test('USAGE.md has onboarding section', () => {
    const content = readFile('docs/USAGE.md');
    expect(content).toContain('オンボーディング');
    expect(content).toContain('.github-project-config.json');
  });

  test('CHANGELOG.md has v2.0.0 entry', () => {
    const content = readFile('CHANGELOG.md');
    expect(content).toContain('[2.0.0]');
    expect(content).toContain('github_project_manager');
  });

  test('install.sh uses new skill directory name', () => {
    const content = readFile('install.sh');
    expect(content).toContain('github-project-manager');
  });
});

// ============================================================
// 16. Lite Mode Validation (--lite flag)
// ============================================================
test.describe('Lite Mode Validation', () => {
  test('setup-all.sh accepts --lite flag', () => {
    const content = readFile('scripts/setup-all.sh');
    expect(content).toContain('--lite');
    expect(content).toContain('LITE_FLAG');
  });

  test('setup-all.sh propagates --lite to setup-status.sh', () => {
    const content = readFile('scripts/setup-all.sh');
    expect(content).toMatch(/setup-status\.sh.*\$LITE_FLAG/);
  });

  test('setup-all.sh propagates --lite to setup-labels.sh', () => {
    const content = readFile('scripts/setup-all.sh');
    expect(content).toMatch(/setup-labels\.sh.*\$LITE_FLAG/);
  });

  test('setup-all.sh propagates --lite to setup-views.sh', () => {
    const content = readFile('scripts/setup-all.sh');
    expect(content).toMatch(/setup-views\.sh.*\$LITE_FLAG/);
  });

  test('setup-all.sh displays mode indicator (Full/Lite)', () => {
    const content = readFile('scripts/setup-all.sh');
    expect(content).toContain('MODE="Full"');
    expect(content).toContain('MODE="Lite"');
  });

  test('setup-status.sh defines exactly 8 lite statuses', () => {
    const content = readFile('scripts/setup-status.sh');
    const liteStatuses = [
      'Icebox',
      'Backlog',
      '要件作成中',
      'デザイン作成中',
      '開発中',
      'コードレビュー',
      'テスト中',
      'Done',
    ];
    for (const status of liteStatuses) {
      expect(content).toContain(status);
    }
    // Verify lite block has exactly 8 entries by checking the array between LITE=true and the else
    const liteSection = content.split('if [ "$LITE" = true ]')[1]?.split('else')[0] ?? '';
    const liteStatusCount = (liteSection.match(/^\s+"[^"]+"\s*$/gm) || []).length;
    expect(liteStatusCount).toBe(8);
  });

  test('setup-labels.sh defines exactly 5 lite labels', () => {
    const content = readFile('scripts/setup-labels.sh');
    const liteLabels = ['feature', 'bug', 'chore', 'frontend', 'backend'];
    // Verify lite mode section contains all 5 labels
    const liteSection = content.split('if [ "$LITE" = true ]')[1]?.split('else')[0] ?? '';
    for (const label of liteLabels) {
      expect(liteSection).toContain(`"${label}"`);
    }
    const liteLabelCount = (liteSection.match(/gh label create/g) || []).length;
    expect(liteLabelCount).toBe(5);
  });

  test('setup-labels.sh has progress indicators [1/5] to [5/5] in lite mode', () => {
    const content = readFile('scripts/setup-labels.sh');
    expect(content).toContain('[1/5]');
    expect(content).toContain('[5/5]');
  });

  test('setup-views.sh defines exactly 3 lite views', () => {
    const content = readFile('scripts/setup-views.sh');
    const liteViews = ['Sprint Board', 'Backlog', 'My Items'];
    // Extract the lite view creation section between "# Lite mode: 3 views" comment and "else"
    const liteMatch = content.match(/# Lite mode: 3 views[\s\S]*?\nelse\n/);
    expect(liteMatch).not.toBeNull();
    const liteSection = liteMatch![0];
    for (const view of liteViews) {
      expect(liteSection).toContain(view);
    }
    // Count mutation calls (input: { projectId patterns) to avoid double-counting jq paths
    const liteViewCount = (liteSection.match(/createProjectV2View\(input:/g) || []).length;
    expect(liteViewCount).toBe(3);
  });

  test('setup-views.sh has [1/3] to [3/3] progress in lite mode', () => {
    const content = readFile('scripts/setup-views.sh');
    expect(content).toContain('[1/3]');
    expect(content).toContain('[3/3]');
  });

  test('setup-status.sh parses --lite flag correctly', () => {
    const content = readFile('scripts/setup-status.sh');
    expect(content).toContain('LITE=false');
    expect(content).toContain('--lite) LITE=true');
  });

  test('setup-labels.sh parses --lite flag correctly', () => {
    const content = readFile('scripts/setup-labels.sh');
    expect(content).toContain('LITE=false');
    expect(content).toContain('--lite) LITE=true');
  });

  test('setup-views.sh parses --lite flag correctly', () => {
    const content = readFile('scripts/setup-views.sh');
    expect(content).toContain('LITE=false');
    expect(content).toContain('--lite) LITE=true');
  });

  test('setup-all.sh shows lite summary in completion output', () => {
    const content = readFile('scripts/setup-all.sh');
    expect(content).toContain('8オプション設定');
    expect(content).toContain('5ラベル');
    expect(content).toContain('3ビュー');
  });

  test('setup-all.sh usage comment includes --lite', () => {
    const content = readFile('scripts/setup-all.sh');
    expect(content).toMatch(/Usage:.*\[--lite\]/);
  });

  test('setup-status.sh usage comment includes --lite', () => {
    const content = readFile('scripts/setup-status.sh');
    expect(content).toMatch(/Usage:.*\[--lite\]/);
  });

  test('setup-labels.sh usage comment includes --lite', () => {
    const content = readFile('scripts/setup-labels.sh');
    expect(content).toMatch(/Usage:.*\[--lite\]/);
  });

  test('setup-views.sh usage comment includes --lite', () => {
    const content = readFile('scripts/setup-views.sh');
    expect(content).toMatch(/Usage:.*\[--lite\]/);
  });

  // migrate-import.sh Lite status mapping tests
  test('migrate-import.sh contains LITE_STATUS_MAP definitions', () => {
    const content = readFile('scripts/migrate-import.sh');
    expect(content).toContain('JIRA_LITE_STATUS_MAP');
    expect(content).toContain('LINEAR_LITE_STATUS_MAP');
    expect(content).toContain('NOTION_LITE_STATUS_MAP');
  });

  test('migrate-import.sh Lite maps do not use Full-only statuses as values', () => {
    const content = readFile('scripts/migrate-import.sh');
    const fullOnlyStatuses = ['進行待ち', 'アサイン待ち', '開発待ち', 'テスト落ち', 'リリース待ち'];
    const liteMaps = content.match(/LITE_STATUS_MAP\s*=\s*\{[^}]+\}/g) || [];
    const liteMapsText = liteMaps.join('\n');
    for (const status of fullOnlyStatuses) {
      expect(liteMapsText).not.toContain(`"${status}"`);
    }
  });

  test('migrate-import.sh supports --lite flag', () => {
    const content = readFile('scripts/migrate-import.sh');
    expect(content).toMatch(/--lite\)/);
    expect(content).toMatch(/LITE/);
  });
});
