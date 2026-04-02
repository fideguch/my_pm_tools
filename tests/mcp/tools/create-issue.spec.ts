import { test, expect } from '@playwright/test';
import { createIssue } from '../../../src/tools/create-issue.js';
import type { GhRunner } from '../../../src/utils/gh-cli.js';

function createMockGh(
  shouldFail = false,
  stdout = 'https://github.com/fideguch/my-app/issues/99'
): { runner: GhRunner; calls: string[][] } {
  const calls: string[][] = [];
  const runner: GhRunner = async (args) => {
    calls.push([...args]);
    if (shouldFail) throw new Error('gh failed');
    return { stdout, stderr: '' };
  };
  return { runner, calls };
}

test.describe('project_create_issue tool', () => {
  test('creates issue with title only', async () => {
    const { runner, calls } = createMockGh();
    const result = await createIssue(runner, {
      repo: 'fideguch/my-app',
      title: 'ログイン画面のバグ修正',
    });

    expect(result.isError).toBeUndefined();
    expect(calls[0]).toContain('--title');
    expect(calls[0]).toContain('ログイン画面のバグ修正');
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.data.issueNumber).toBe(99);
    expect(data.data.url).toContain('issues/99');
  });

  test('creates issue with Japanese title and body', async () => {
    const { runner, calls } = createMockGh();
    const result = await createIssue(runner, {
      repo: 'fideguch/my-app',
      title: '新機能: ダッシュボード追加',
      body: '## 概要\nダッシュボード画面を追加する\n\n## 背景\nユーザーから要望あり',
    });

    expect(result.isError).toBeUndefined();
    expect(calls[0]).toContain('--body');
    expect(calls[0]).toContain('--title');
  });

  test('creates issue with labels', async () => {
    const { runner, calls } = createMockGh();
    const result = await createIssue(runner, {
      repo: 'fideguch/my-app',
      title: 'バグ: 認証エラー',
      labels: ['bug', 'frontend'],
    });

    expect(result.isError).toBeUndefined();
    expect(calls[0]).toContain('--label');
    expect(calls[0]).toContain('bug,frontend');
  });

  test('creates issue with assignees', async () => {
    const { runner, calls } = createMockGh();
    const result = await createIssue(runner, {
      repo: 'fideguch/my-app',
      title: 'タスク: API設計',
      assignees: ['fideguch'],
    });

    expect(result.isError).toBeUndefined();
    expect(calls[0]).toContain('--assignee');
    expect(calls[0]).toContain('fideguch');
  });

  test('creates issue with template', async () => {
    const { runner, calls } = createMockGh();
    const result = await createIssue(runner, {
      repo: 'fideguch/my-app',
      title: 'バグレポート',
      template: 'bug_report.yml',
    });

    expect(result.isError).toBeUndefined();
    expect(calls[0]).toContain('--template');
    expect(calls[0]).toContain('bug_report.yml');
  });

  test('creates issue with all options', async () => {
    const { runner, calls } = createMockGh();
    const result = await createIssue(runner, {
      repo: 'fideguch/my-app',
      title: '機能追加: 通知システム',
      body: '## 要件\n通知をリアルタイムで配信',
      labels: ['feature', 'backend'],
      assignees: ['fideguch', 'collaborator'],
      template: 'feature_request.yml',
    });

    expect(result.isError).toBeUndefined();
    const args = calls[0];
    expect(args).toContain('--title');
    expect(args).toContain('--body');
    expect(args).toContain('--label');
    expect(args).toContain('--assignee');
    expect(args).toContain('--template');
  });

  test('returns error when gh CLI fails', async () => {
    const { runner } = createMockGh(true);
    const result = await createIssue(runner, {
      repo: 'fideguch/my-app',
      title: '失敗するIssue',
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Failed to create issue');
  });

  test('parses issue number from URL', async () => {
    const { runner } = createMockGh(false, 'https://github.com/fideguch/my-app/issues/123');
    const result = await createIssue(runner, {
      repo: 'fideguch/my-app',
      title: 'テスト',
    });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.data.issueNumber).toBe(123);
  });
});
