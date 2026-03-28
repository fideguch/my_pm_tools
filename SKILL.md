---
name: github_project_manager
description: >-
  GitHub Projects V2 のPM支援スキル。
  新規プロジェクト構築（14ステータス・6ビュー・13ラベル・テンプレート・ワークフロー、`--lite` で小規模チーム向け簡素構成にも対応）、
  日常運用（Issue発行・PR作成・ステータス変更・Sprint管理）、
  分析（Sprintレポート・ベロシティ追跡）、
  移行（Jira/Linear/Notion CSV インポート）を統合的にサポート。
intent: >-
  PMが「Issue作って」「ステータス変えて」「Sprintレポート出して」と言うだけで
  gh CLI + GraphQL API を駆使して即座に実行する日常アシスタント。
  初回起動時にプロジェクト情報を収集し、以降の操作を最適化する。
  Use when managing GitHub Projects V2 — setup, daily ops, issue editing, or analytics.
type: interactive
theme: github-projects-v2-pm
best_for:
  - 'GitHub Projects V2 の日常管理全般'
  - 'Issue 作成・編集・ラベル付け・アサイン・状態変更'
  - 'PR 作成支援・ステータス自動遷移'
  - 'Sprint 計画・レポート・ベロシティ追跡'
  - '新規プロジェクト環境の一括構築'
  - 'Jira/Linear/Notion からの移行'
scenarios:
  - 'New project: setup labels, statuses, views, templates from scratch'
  - 'Daily ops: create/edit issues, change status, manage sprint'
  - 'Issue editing: modify title, body, labels, assignees, open/close'
  - 'Issue identification: search by keyword, confirm, then edit'
  - 'designs/ awareness: detect requirements_designer output and use as context'
triggers:
  # 日本語 — 作成・編集
  - 'Issue を作成して'
  - 'Issue を編集して'
  - 'Issue を閉じて'
  - 'PR を作って'
  - 'ラベルを付けて'
  - 'ラベル変更'
  - 'アサインして'
  # 日本語 — ステータス・確認
  - 'ステータスを変更'
  - 'ステータス確認'
  - 'プロジェクト状態'
  - '進捗確認'
  - 'Issue 一覧'
  - 'バックログを確認'
  - 'ブロッカーを確認'
  # 日本語 — レポート・分析
  - 'Sprint レポート'
  - 'ベロシティ'
  # 日本語 — セットアップ・管理
  - 'プロジェクト管理'
  - 'プロジェクト環境を構築'
  - 'プロジェクトのセットアップ'
  - 'GitHub Projects'
  # 日本語 — Lite モード
  - 'Liteモードで構築'
  - '小規模チーム向けに構築'
  # 日本語 — 移行
  - 'Jira から移行'
  - 'Linear から移行'
  - 'Notion から移行'
  - 'CSV インポート'
  # 日本語 — Workspace Bridge（Notion + Google）
  - 'Notionのページを読んで'
  - 'NotionのDBから取得して'
  - 'Notionに書き出して'
  - 'Notionで検索して'
  - 'スプシのデータを取得して'
  - 'Driveでファイルを検索して'
  - 'Googleドキュメントを読んで'
  - 'プレゼン資料を読んで'
  - 'カレンダーの予定を確認して'
  - 'メールを検索して'
  # 日本語 — 継続・ヘルプ
  - '続けて'
  - '前回のレポート'
  - 'ヘルプ'
  - '使い方'
  - '何ができる'
  # English — Workspace Bridge
  - 'Read Notion page'
  - 'Query Notion database'
  - 'Write to Notion'
  - 'Search Notion'
  - 'Get spreadsheet data'
  - 'Search Drive files'
  - 'Read Google Doc'
  - 'Read slides'
  - 'Check calendar events'
  - 'Search email'
  # English — Core
  - 'Create issue'
  - 'Edit issue'
  - 'Show backlog'
  - 'Change status'
  - 'Sprint report'
  - 'Project setup'
  # System
  - '!github_project_manager'
---

# GitHub Project Manager

GitHub Projects V2 のPM日常アシスタント。環境構築・日常運用・分析・移行を統合サポートする。

**前提条件**: gh CLI 認証済み、Classic PAT（`ghp_`）、スコープ `project,repo,read:org`

---

## Help Command

「ヘルプ」「help」「使い方」で表示。初回起動時にも自動表示。

```
GitHub Project Manager — クイックガイド

3つのモードで GitHub Projects V2 を統合管理します。

Mode A: 環境構築（新規プロジェクト）
  「プロジェクト環境を構築して」→ 14ステータス・6ビュー・13ラベル・テンプレートを一括セットアップ
  「Jira から移行したい」→ CSV インポートで Issue を一括作成

Mode B: 日常運用（毎日使う）★メイン
  「ログイン画面のバグを Issue にして」→ Issue 作成 + ラベル + Priority 自動設定
  「#42 を開発中にして」→ ステータス変更
  「#42 の修正 PR を作って」→ ブランチ名提案 + PR 本文生成
  「バックログの P0/P1 を見せて」→ 優先度別アイテム一覧
  「ブロッカーを確認」→ blocked ラベル付きアイテム一覧

Mode C: 分析・レポート
  「Sprint レポートを出して」→ ベロシティ・完了率・ブロッカー統計
  「前回の Sprint と比較して」→ Sprint 間の推移

前提条件
  - gh CLI インストール済み & 認証済み
  - Classic PAT (ghp_) with scopes: project, repo, read:org

連携スキル
  /code-quality              → ESLint + Prettier + Husky 導入
  /ci-cd-pipeline            → GitHub Actions CI/CD パイプライン構築
  /typescript-best-practices → TypeScript 初期設定
  /git-workflow              → ブランチ戦略 + Conventional Commits
  /requirements_designer     → 要件定義（Issue の元ネタ作成）
```

---

## Onboarding（初回プロジェクト接続）

### .github-project-config.json

初回起動時にプロジェクト情報を収集し、ワーキングディレクトリに保存。以降はこのファイルを読み込み即座に操作可能。

```json
{
  "owner": "fideguch",
  "repo": "fideguch/my-app",
  "projectNumber": 3,
  "projectId": "PVT_xxx",
  "statusFieldId": "PVTSSF_xxx",
  "mode": "operations",
  "createdAt": "2026-03-27T12:00:00Z"
}
```

### 初回起動フロー

`.github-project-config.json` が存在しない場合:

1. **プロジェクト情報の収集**
   - 「このプロジェクトのリポジトリを教えてください（OWNER/REPO）」
   - プロジェクト番号を確認（`gh project list --owner <OWNER>` で自動検出も可能）

2. **プロジェクト状態の自動検出**

   ```bash
   # ラベル・フィールド・ビュー・テンプレートの存在を自動チェック
   gh label list --repo <OWNER/REPO> --json name
   gh project field-list <NUMBER> --owner <OWNER>
   gh api repos/<OWNER/REPO>/contents/.github/ISSUE_TEMPLATE
   ```

3. **モード判定**
   - **未構築** → 「環境構築から始めましょう（Mode A）」
   - **構築済み** → 「日常運用モードで起動します（Mode B）」
   - **部分構築** → 「未設定の項目があります。補完しますか？」

4. **設定ファイル生成**
   - `.github-project-config.json` を作成
   - プロジェクトID、StatusフィールドIDを自動取得して保存

### designs/ 検出（requirements_designer 連携）

`.github-project-config.json` 読み込み後、`designs/` ディレクトリの存在を確認。

存在する場合:

1. `designs/README.md` を読み、プロジェクト概要を把握
2. `designs/user_stories.md` を読み、ユーザーストーリー一覧を把握
3. `designs/functional_requirements.md` を読み、機能要件を把握
4. 「要件情報を検出しました。Issue 作成時に参照します」と報告

Issue 作成時:

- designs/ の内容をコンテキストとして参照し、関連する要件やストーリーがあれば提案に活用

不在の場合:

- 通常どおり操作を継続（designs/ は任意）

### 再起動時

`.github-project-config.json` が存在する場合:

- 設定を読み込み、即座に操作可能状態に
- designs/ があれば要件コンテキストも再読み込み
- 「プロジェクト <REPO> (#<NUMBER>) に接続しました。何をしますか？」

---

## Mode A: 環境構築 (Setup)

新規プロジェクトの環境を6フェーズで一括構築する。

### 一括実行

```bash
./scripts/setup-all.sh <OWNER/REPO> <PROJECT_NUMBER>
```

### Phase 1: カスタムフィールド作成

#### 1.1 認証確認

```bash
gh auth status
```

`project` スコープがない場合:

```bash
gh auth refresh --scopes "project,repo,read:org"
```

#### 1.2 プロジェクト情報取得

```bash
gh project list --owner "<OWNER>"
gh project view <NUMBER> --owner "<OWNER>"
```

#### 1.3 Priority / Estimate / Target フィールド作成

```bash
gh project field-create <NUMBER> --owner "<OWNER>" --name "Priority" --data-type "SINGLE_SELECT" --single-select-options "P0 - 即日着手,P1 - 高 (1〜3営業日),P2 - 中 (スプリント内),P3 - 低 (時間あれば),P4 - 未定 (保留中)"
gh project field-create <NUMBER> --owner "<OWNER>" --name "Estimate" --data-type "NUMBER"
gh project field-create <NUMBER> --owner "<OWNER>" --name "Target" --data-type "TEXT"
```

#### 1.4 Status 14オプション設定

```bash
./scripts/setup-status.sh <OWNER> <PROJECT_NUMBER>
```

14ステータス: Icebox, 進行待ち, 要件作成中, デザイン待ち, デザイン作成中, アサイン待ち, 開発待ち, 開発中, コードレビュー, テスト中, テスト落ち, リリース待ち, リリース済み, Done

#### 1.5 Sprint（Iteration）フィールド

GitHub UI → Project Settings → Custom fields → New field → Iteration → 1週間サイクル

### Phase 2: ラベル一括作成

```bash
./scripts/setup-labels.sh <OWNER/REPO>
```

13ラベル: feature, bug, refine, infra, docs, research, frontend, backend, design, growth, blocked, needs-review, good-first-issue

### Phase 3: ビュー作成

```bash
./scripts/setup-views.sh <OWNER> <PROJECT_NUMBER>
```

5ビュー: Product Backlog (Board), Sprint Board (Board), Sprint Table (Table), Roadmap (Timeline), My Items (Table)

### Phase 4-5: テンプレート＆ワークフロー自動配置

```bash
./scripts/setup-templates.sh <OWNER/REPO> <PROJECT_NUMBER>
```

Issue/PR テンプレート + 5 GitHub Actions ワークフローをターゲットリポジトリに自動配置。

### Phase 6: 最終チェックリスト

| #     | 確認項目                                |
| ----- | --------------------------------------- |
| 1     | Status に14ステータスが設定されている   |
| 2     | Priority (P0-P4) フィールドが存在する   |
| 3     | Estimate (Number) フィールドが存在する  |
| 4     | Target (Text) フィールドが存在する      |
| 5     | Sprint (Iteration) フィールドが存在する |
| 6     | 13ラベルが作成されている                |
| 7-11  | 5ビューが作成されている                 |
| 12-13 | Issue/PR テンプレートが存在する         |
| 14    | Built-in Workflows が有効               |

### Lite モード（小〜中規模チーム向け）

`--lite` フラグで、1-3人チーム向けの簡素構成を構築:

| 構成              | ステータス | ビュー | ラベル | 推奨チーム規模 |
| ----------------- | ---------- | ------ | ------ | -------------- |
| Lite              | 8          | 3      | 5      | 1-3人          |
| Full (デフォルト) | 14         | 6      | 13     | 4人以上        |

```bash
./scripts/setup-all.sh owner/repo 1 --lite
```

Lite → Full への移行は `setup-all.sh` を `--lite` なしで再実行するだけで完了。

### 他ツールからの移行

```bash
./scripts/migrate-import.sh <OWNER/REPO> <PROJECT_NUMBER> export.csv --format jira|linear|notion|generic [--dry-run] [--lite]
```

---

## Mode B: 日常運用 (Operations) ★メインモード

構築済みプロジェクトの日常的なPM操作。`.github-project-config.json` の情報を使って操作する。

### Issue 作成

ユーザーの指示から Issue を作成する。

```
ユーザー: 「ログイン画面のバグを Issue にして」
動作:
  1. .github-project-config.json から REPO を読み込み
  2. テンプレート選択: bug（バグ報告）
  3. ユーザーに詳細をヒアリング（再現手順、深刻度）
  4. gh issue create --repo <REPO> --title "[Bug] ログイン画面..." --label bug --body "..."
  5. プロジェクトに追加: project-ops.sh add-issue
  6. Priority 設定: project-ops.sh set-priority
```

```
ユーザー: 「ダッシュボードにグラフ機能を追加する Issue を作って」
動作:
  1. テンプレート選択: feature（機能要望）
  2. gh issue create --repo <REPO> --title "[Feature] ダッシュボードグラフ機能" --label feature
  3. プロジェクトに追加 + Priority 設定
```

### PR 作成支援

```
ユーザー: 「#42 の修正 PR を作って」
動作:
  1. Issue #42 の情報を取得（タイトル、ラベル）
  2. ブランチ名を提案: fix/42-login-screen-bug
  3. git checkout -b fix/42-login-screen-bug
  4. （ユーザーがコード変更後）
  5. PR 本文を生成（closes #42 自動挿入、テンプレート適用）
  6. gh pr create --title "fix: ログイン画面のバグ修正" --body "..."
```

### ステータス変更

```
ユーザー: 「#42 を開発中にして」
動作:
  1. Issue #42 の Project Item ID を取得
  2. ./scripts/project-ops.sh <OWNER> <NUMBER> move <ITEM_ID> "開発中"
```

```
ユーザー: 「#42 をコードレビューに移して、P1 にして」
動作:
  1. project-ops.sh move <ITEM_ID> "コードレビュー"
  2. project-ops.sh set-priority <ITEM_ID> P1
```

### バックログ確認

```
ユーザー: 「バックログの P0/P1 を見せて」
動作:
  1. project-ops.sh list-items を実行
  2. Priority が P0 または P1 のアイテムをフィルタ表示
```

### ブロッカー確認

```
ユーザー: 「ブロッカーを確認して」
動作:
  1. project-ops.sh list-items を実行
  2. blocked ラベル付きアイテムを抽出表示
```

### フィールド更新

```bash
# Priority 設定
./scripts/project-ops.sh <OWNER> <NUMBER> set-priority <ITEM_ID> P0

# Issue/PR をプロジェクトに追加
./scripts/project-ops.sh <OWNER> <NUMBER> add-issue <REPO> <ISSUE_NUMBER>
./scripts/project-ops.sh <OWNER> <NUMBER> add-pr <REPO> <PR_NUMBER>

# アイテム一覧
./scripts/project-ops.sh <OWNER> <NUMBER> list-items

# フィールドID確認
./scripts/project-ops.sh <OWNER> <NUMBER> list-fields
```

### Workspace Bridge（Notion + Google Workspace 連携）

外部ツールのデータを MCP 経由で読み書きし、GitHub Projects と連携する。

```
ユーザー: 「Notionのページを読んで」→ notion_get_page
ユーザー: 「NotionのDBから取得して」→ notion_query_database
ユーザー: 「Notionに書き出して」→ notion_create_page / notion_append_blocks
ユーザー: 「Notionで検索して」→ notion_search
ユーザー: 「スプシのデータを取得して」→ workspace_get_sheet
ユーザー: 「Driveでファイルを検索して」→ workspace_search_drive
ユーザー: 「Googleドキュメントを読んで」→ workspace_get_doc
ユーザー: 「プレゼン資料を読んで」→ workspace_get_slides
ユーザー: 「カレンダーの予定を確認して」→ workspace_list_events
ユーザー: 「メールを検索して」→ workspace_search_gmail
```

### 自動ステータス遷移（project-automation.yml）

PR 操作に連動して関連 Issue のステータスが自動変更される:

| イベント     | ステータス変更   | 条件                        |
| ------------ | ---------------- | --------------------------- |
| PR 作成      | → コードレビュー | PR 本文に `closes #XX` 記載 |
| レビュー承認 | → テスト中       | 同上                        |
| PR マージ    | → Done           | 同上                        |

---

## Mode C: 分析・レポート (Analytics)

### Sprint レポート

```bash
./scripts/sprint-report.sh <OWNER> <PROJECT_NUMBER>                    # 現在の Sprint
./scripts/sprint-report.sh <OWNER> <PROJECT_NUMBER> --sprint previous  # 前回の Sprint
./scripts/sprint-report.sh <OWNER> <PROJECT_NUMBER> --json             # JSON 出力
```

出力: ベロシティ（完了ポイント）、完了率、ステータス分布、Priority 分布、ブロッカー一覧。

```
ユーザー: 「今週の Sprint の状況を教えて」
動作: sprint-report.sh を実行してレポート表示

ユーザー: 「前回の Sprint と比較して」
動作: current + previous のレポートを並べて差分を表示
```

---

## スクリプトリファレンス

| スクリプト           | 用途                               |
| -------------------- | ---------------------------------- |
| `setup-all.sh`       | 全環境一括構築（Mode A）           |
| `setup-labels.sh`    | ラベル13種一括作成                 |
| `setup-fields.sh`    | カスタムフィールド作成             |
| `setup-status.sh`    | Status 14オプション設定            |
| `setup-views.sh`     | 5ビュー作成                        |
| `setup-templates.sh` | テンプレート＆ワークフロー自動配置 |
| `project-ops.sh`     | 日常運用操作（Mode B）             |
| `migrate-import.sh`  | Jira/Linear/Notion CSV 移行        |
| `sprint-report.sh`   | Sprint レポート生成（Mode C）      |
