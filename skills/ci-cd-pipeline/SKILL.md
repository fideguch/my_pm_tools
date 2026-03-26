# GitHub Actions CI/CD 品質パイプライン構築スキル

## メタデータ

- **トリガー**: 「CI/CDを設定したい」「GitHub Actions パイプライン」「品質チェック自動化」「CI設定」
- **前提条件**: GitHub リポジトリ、package.json または pyproject.toml が存在

## 概要

GitHub Actions を使った品質パイプラインを構築するスキル。
PR 作成・更新時に lint → typecheck → test → build の品質ゲートを自動実行し、
マージ品質を担保する。

---

## Phase 1: プロジェクト分析

### 1.1 技術スタック検出

```bash
# パッケージマネージャー判定
[ -f pnpm-lock.yaml ] && echo "pnpm" || \
[ -f yarn.lock ] && echo "yarn" || \
[ -f bun.lockb ] && echo "bun" || \
echo "npm"

# ランタイム判定
[ -f package.json ] && echo "Node.js"
[ -f pyproject.toml ] && echo "Python"
[ -f go.mod ] && echo "Go"
[ -f Cargo.toml ] && echo "Rust"

# Node.js バージョン確認
[ -f .nvmrc ] && cat .nvmrc
[ -f .node-version ] && cat .node-version
node -v 2>/dev/null
```

### 1.2 既存スクリプト確認

```bash
# package.json のスクリプト一覧
node -e "const p=require('./package.json'); console.log(Object.keys(p.scripts||{}).join('\n'))"
```

### 1.3 既存ワークフロー確認

```bash
ls -la .github/workflows/ 2>/dev/null
```

---

## Phase 2: CI ワークフロー生成

### 2.1 基本品質チェック（`.github/workflows/ci.yml`）

```yaml
name: CI Quality Check

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: |
          if [ -f package-lock.json ]; then
            npm ci
          else
            npm install
          fi

      - name: Lint
        run: npm run lint --if-present

      - name: Type Check
        run: npm run typecheck --if-present

      - name: Format Check
        run: npm run format:check --if-present

      - name: Unit Tests
        run: |
          TEST_SCRIPT=$(node -e "const p=require('./package.json'); console.log(p.scripts?.test || '')")
          if [ -n "$TEST_SCRIPT" ] && [ "$TEST_SCRIPT" != "echo \"Error: no test specified\" && exit 1" ]; then
            npm test -- --coverage --passWithNoTests
          else
            echo "No test script configured, skipping"
          fi

      - name: Build
        run: npm run build --if-present
```

### 2.2 PR 自動ラベル付与（`.github/workflows/pr-labeler.yml`）

```yaml
name: PR Labeler

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  label:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/labeler@v5
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
```

### 2.3 ラベル設定ファイル（`.github/labeler.yml`）

```yaml
frontend:
  - changed-files:
      - any-glob-to-any-file:
          - 'src/components/**'
          - 'src/pages/**'
          - 'src/styles/**'
          - '*.css'
          - '*.scss'

backend:
  - changed-files:
      - any-glob-to-any-file:
          - 'src/api/**'
          - 'src/server/**'
          - 'src/services/**'

infra:
  - changed-files:
      - any-glob-to-any-file:
          - '.github/**'
          - 'Dockerfile'
          - 'docker-compose*.yml'
          - '*.yml'

docs:
  - changed-files:
      - any-glob-to-any-file:
          - '**/*.md'
          - 'docs/**'
```

### 2.4 Project 自動化（`.github/workflows/project-automation.yml`）

```yaml
name: Project Automation

on:
  pull_request:
    types: [opened, closed]
  pull_request_review:
    types: [submitted]
  issues:
    types: [opened, closed, reopened]

jobs:
  update-project:
    runs-on: ubuntu-latest
    if: ${{ secrets.PROJECT_TOKEN != '' }}
    steps:
      - name: Update project status
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.PROJECT_TOKEN }}
          script: |
            const event = context.eventName;
            const action = context.payload.action;

            console.log(`Event: ${event}, Action: ${action}`);

            // Issue/PR 作成時 → 進行待ち
            if (action === 'opened') {
              console.log('New item opened - should be set to 進行待ち');
            }

            // PR マージ時 → Done
            if (event === 'pull_request' && action === 'closed' && context.payload.pull_request.merged) {
              console.log('PR merged - should be set to Done');
            }

            // レビュー承認時 → テスト中
            if (event === 'pull_request_review' && context.payload.review.state === 'approved') {
              console.log('Review approved - should be set to テスト中');
            }

            // Issue クローズ時 → Done
            if (event === 'issues' && action === 'closed') {
              console.log('Issue closed - should be set to Done');
            }

            // Issue 再オープン時 → 進行待ち
            if (event === 'issues' && action === 'reopened') {
              console.log('Issue reopened - should be set to 進行待ち');
            }
```

### 2.5 滞留タスク検知（`.github/workflows/stale-detection.yml`）

```yaml
name: Stale Issue Detection

on:
  schedule:
    - cron: '0 0 * * 1' # 毎週月曜 00:00 UTC

jobs:
  detect-stale:
    runs-on: ubuntu-latest
    steps:
      - name: Check stale items
        uses: actions/github-script@v7
        with:
          script: |
            const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

            const issues = await github.rest.issues.listForRepo({
              owner: context.repo.owner,
              repo: context.repo.repo,
              state: 'open',
              sort: 'updated',
              direction: 'asc',
              per_page: 100,
            });

            const staleIssues = issues.data.filter(
              (issue) => new Date(issue.updated_at) < fiveDaysAgo
            );

            if (staleIssues.length > 0) {
              console.log(`Found ${staleIssues.length} stale issues:`);
              for (const issue of staleIssues) {
                const days = Math.floor(
                  (Date.now() - new Date(issue.updated_at)) / (1000 * 60 * 60 * 24)
                );
                console.log(`  #${issue.number}: ${issue.title} (${days} days stale)`);
              }
            } else {
              console.log('No stale issues found.');
            }
```

---

## Phase 3: ブランチ保護ルール

ユーザーに以下のブランチ保護設定を推奨:

| 設定                      | 推奨値           |
| ------------------------- | ---------------- |
| Require status checks     | CI Quality Check |
| Require PR reviews        | 1名以上          |
| Dismiss stale reviews     | 有効             |
| Require up-to-date branch | 有効             |
| Restrict force pushes     | 有効             |

---

## Phase 4: 動作確認

```bash
# ローカルで CI と同じコマンドを実行
npm run lint --if-present
npm run typecheck --if-present
npm run format:check --if-present
npm test --if-present
npm run build --if-present
```

---

## 完了チェックリスト

| #   | 確認項目                                              | 状態 |
| --- | ----------------------------------------------------- | ---- |
| 1   | `.github/workflows/ci.yml` が存在する                 |      |
| 2   | `.github/workflows/pr-labeler.yml` が存在する         |      |
| 3   | `.github/labeler.yml` が存在する                      |      |
| 4   | `.github/workflows/project-automation.yml` が存在する |      |
| 5   | `.github/workflows/stale-detection.yml` が存在する    |      |
| 6   | CI が PR で正常に動作する                             |      |
| 7   | ブランチ保護ルールが設定されている                    |      |

## パッケージマネージャー別の調整

| マネージャー | インストール                     | キャッシュ設定                         |
| ------------ | -------------------------------- | -------------------------------------- |
| npm          | `npm ci`                         | `cache: 'npm'`                         |
| pnpm         | `pnpm install --frozen-lockfile` | pnpm/action-setup@v4 + `cache: 'pnpm'` |
| yarn         | `yarn install --frozen-lockfile` | `cache: 'yarn'`                        |
| bun          | `bun install --frozen-lockfile`  | oven-sh/setup-bun@v2                   |
