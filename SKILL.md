---
name: setup_github_project
description: >-
  GitHub Projects V2 の開発環境を一括構築するプレイブック。
  14ステータスワークフロー、6ビュー、カスタムフィールド(Priority/Estimate/Sprint/Target)、
  13ラベル、Issue/PRテンプレート、5 GitHub Actions を6フェーズで段階的にセットアップ。
intent: >-
  gh CLI と GraphQL API を使い、GitHub Projects V2 の開発管理環境を
  対話的に構築する。各フェーズで完了確認を取り、API制限のある手動設定は
  明確にガイドする。
type: interactive
best_for:
  - 'New repository GitHub Projects V2 environment setup'
  - 'Team project management infrastructure from scratch'
  - 'Bulk creation of labels, fields, views, and workflows'
  - 'Standardizing project setup across multiple repositories'
triggers:
  - 'GitHub Projectsの環境を構築したい'
  - 'プロジェクト環境をセットアップ'
  - '!setup_github_project'
  - 'GitHub Projects setup'
  - 'Project V2 setup'
  - 'プロジェクト管理環境'
  - 'ラベルを一括作成'
  - 'ビューを作成したい'
  - 'Sprint環境構築'
  - '開発環境セットアップ'
---

# GitHub Projects 環境一括構築 プレイブック

GitHub Projects V2 のベストプラクティスに基づいた開発環境を、6フェーズで段階的に構築する。

**前提条件**: gh CLI 認証済み、Classic PAT（`ghp_`）、スコープ `project,repo,read:org`

---

## Help Command

以下のいずれかでヘルプを表示する:

- 「ヘルプ」「help」「使い方」「how to use」
- **初回起動時**（ターゲットリポジトリ未指定の場合）にも自動表示

### ヘルプ出力テンプレート

```
GitHub Projects V2 環境一括構築 — クイックガイド

始め方
  「○○リポジトリにGitHub Projects環境を構築したい」と伝えるだけでOK！
  対話形式で6フェーズを進め、開発管理環境を一括構築します。

構築される環境
  - 14段階ステータス (Icebox → Done)
  - 6ビュー (Issues, Product Backlog, Sprint Board, Sprint Table, Roadmap, My Items)
  - カスタムフィールド (Priority P0-P4, Sprint, Estimate, Target)
  - 13ラベル (Type 6 + Area 4 + Ops 3)
  - Issue/PR テンプレート
  - 5 GitHub Actions ワークフロー

6フェーズ
  Phase 1: カスタムフィールド作成  → Priority, Estimate, Target, Status, Sprint
  Phase 2: ラベル一括作成          → 13ラベルをスクリプトで一括作成
  Phase 3: ビュー作成              → 5ビュー + 表示フィールド設定ガイド
  Phase 4: テンプレート配置        → Issue/PR テンプレートをコミット
  Phase 5: 自動化設定              → Built-in Workflows + GitHub Actions
  Phase 6: ドキュメント・最終確認  → 14項目チェックリスト

前提条件
  - gh CLI インストール済み & 認証済み
  - Classic PAT (ghp_) with scopes: project, repo, read:org
  - Fine-grained PAT は Projects V2 GraphQL API 非対応

連携スキル
  /code-quality              → ESLint + Prettier + Husky 導入
  /ci-cd-pipeline            → GitHub Actions CI/CD パイプライン構築
  /typescript-best-practices → TypeScript 初期設定
  /git-workflow              → ブランチ戦略 + Conventional Commits

コマンド例
  「fideguch/my-repo にGitHub Projects環境を構築して」
  「ラベルだけ一括作成して」
  「既存のプロジェクトに足りないビューを追加して」
  「Jira から移行したい」
  「Sprint レポートを出して」
  「ヘルプ」
```

---

## Progress Detection (途中再開)

スキル起動時にターゲットリポジトリの状態を自動チェックし、完了済みフェーズをスキップする。

### 進捗判定ロジック

```bash
# Phase 1 判定: カスタムフィールドの存在確認
gh project field-list <NUMBER> --owner "<OWNER>" --format json
# → Priority, Estimate, Target が存在すれば Phase 1 完了

# Phase 2 判定: ラベルの存在確認
gh label list --repo <OWNER/REPO> --json name --jq '.[].name'
# → 13ラベルすべて存在すれば Phase 2 完了

# Phase 3 判定: ビューの存在確認
gh project view-list <NUMBER> --owner "<OWNER>"
# → Product Backlog, Sprint Board, Sprint Table, Roadmap, My Items が存在すれば Phase 3 完了

# Phase 4 判定: テンプレートの存在確認
# .github/ISSUE_TEMPLATE/ と .github/pull_request_template.md の存在を確認
gh api repos/<OWNER/REPO>/contents/.github/ISSUE_TEMPLATE --jq '.[].name' 2>/dev/null
# → bug_report.yml, feature_request.yml 存在すれば Phase 4 完了

# Phase 5 判定: ワークフローの存在確認
gh api repos/<OWNER/REPO>/contents/.github/workflows --jq '.[].name' 2>/dev/null
# → ci.yml 等のワークフローが存在すれば Phase 5 完了
```

### 進捗表示

```
現在の進捗: Phase 2 完了（13ラベル作成済み、カスタムフィールド3種設定済み）
  → 次は Phase 3: ビュー作成 です
```

### 途中再開時の動作

1. ターゲットリポジトリとプロジェクト番号を確認
2. 上記の進捗判定を実行
3. 完了済みフェーズを表示
4. 「この状態で続けますか？最初からやり直す場合は教えてください。」と確認
5. 該当フェーズから再開

---

## 実行フロー

6フェーズで段階的に環境を構築します。各フェーズ完了後に確認を取ってから次へ進みます。

---

## Phase 1: カスタムフィールド作成

### 1.1 認証確認

```bash
gh auth status
```

`project` スコープがない場合:

```bash
gh auth refresh --scopes "project,repo,read:org"
```

### 1.2 プロジェクト情報取得

```bash
# ユーザーにリポジトリ（OWNER/REPO）とプロジェクト番号を確認
gh project list --owner "<OWNER>"
gh project view <NUMBER> --owner "<OWNER>"
```

### 1.3 Priority フィールド作成

```bash
gh project field-create <NUMBER> --owner "<OWNER>" --name "Priority" --data-type "SINGLE_SELECT" --single-select-options "P0 - 即日着手,P1 - 高 (1〜3営業日),P2 - 中 (スプリント内),P3 - 低 (時間あれば),P4 - 未定 (保留中)"
```

### 1.4 Estimate フィールド作成

```bash
gh project field-create <NUMBER> --owner "<OWNER>" --name "Estimate" --data-type "NUMBER"
```

### 1.5 Target フィールド作成

```bash
gh project field-create <NUMBER> --owner "<OWNER>" --name "Target" --data-type "TEXT"
```

### 1.6 Status オプション追加

GraphQL API でステータスフィールドのオプションを設定:

14ステータス（順序通り）:

1. Icebox
2. 進行待ち
3. 要件作成中
4. デザイン待ち
5. デザイン作成中
6. アサイン待ち
7. 開発待ち
8. 開発中
9. コードレビュー
10. テスト中
11. テスト落ち
12. リリース待ち
13. リリース済み
14. Done

**注意**: Status フィールドのオプション追加は GitHub UI または GraphQL mutation `updateProjectV2Field` で行う。gh CLI の `field-create` では既存の Status フィールドのオプション変更不可。

```bash
# プロジェクトIDとStatusフィールドIDを取得
gh api graphql -f query='
  query($number: Int!) {
    viewer {
      projectV2(number: $number) {
        id
        fields(first: 50) {
          nodes {
            ... on ProjectV2SingleSelectField {
              id
              name
              options { id name }
            }
          }
        }
      }
    }
  }' -F number=<NUMBER>
```

### 1.7 Sprint（Iteration）フィールド

Sprint フィールドは gh CLI では直接作成不可。以下の方法で作成:

- **推奨**: GitHub UI → Project Settings → Custom fields → New field → Iteration → 1週間サイクル
- **代替**: GraphQL API の `createProjectV2IterationField` mutation

### 完了確認

- [ ] Priority (P0-P4) フィールドが存在する
- [ ] Estimate (Number) フィールドが存在する
- [ ] Target (Text) フィールドが存在する
- [ ] Status に14ステータスが設定されている
- [ ] Sprint (Iteration) フィールドが存在する

---

## Phase 2: ラベル一括作成

```bash
# スクリプトを使用（推奨）
./scripts/setup-labels.sh <OWNER/REPO>

# または手動で13ラベル作成
# Type ラベル
gh label create "feature" --repo <OWNER/REPO> --color "0E8A16" --description "新機能追加" --force
gh label create "bug" --repo <OWNER/REPO> --color "D73A4A" --description "バグ修正" --force
gh label create "refine" --repo <OWNER/REPO> --color "FBCA04" --description "改善・リファクタリング" --force
gh label create "infra" --repo <OWNER/REPO> --color "6F42C1" --description "インフラ・DevOps" --force
gh label create "docs" --repo <OWNER/REPO> --color "0075CA" --description "ドキュメント" --force
gh label create "research" --repo <OWNER/REPO> --color "C5DEF5" --description "調査・技術検証" --force

# Area ラベル
gh label create "frontend" --repo <OWNER/REPO> --color "F9A825" --description "フロントエンド関連" --force
gh label create "backend" --repo <OWNER/REPO> --color "795548" --description "バックエンド関連" --force
gh label create "design" --repo <OWNER/REPO> --color "E91E8F" --description "デザイン関連" --force
gh label create "growth" --repo <OWNER/REPO> --color "2EA44F" --description "グロース施策" --force

# Ops ラベル
gh label create "blocked" --repo <OWNER/REPO> --color "000000" --description "ブロッカーあり" --force
gh label create "needs-review" --repo <OWNER/REPO> --color "FEF2C0" --description "レビュー必要" --force
gh label create "good-first-issue" --repo <OWNER/REPO> --color "7057FF" --description "初心者向け" --force
```

### 完了確認

- [ ] 13ラベルすべてが作成されている
- [ ] 色コードとdescriptionが正しい

---

## Phase 3: ビュー作成

### 3.1 プロジェクトIDの取得

```bash
PROJECT_ID=$(gh api graphql -f query='query($number: Int!) { viewer { projectV2(number: $number) { id } } }' -F number=<NUMBER> --jq '.data.viewer.projectV2.id')
echo $PROJECT_ID
```

### 3.2 5ビュー作成

```bash
# Product Backlog (Board)
gh api graphql -f query='mutation($pid: ID!) { createProjectV2View(input: { projectId: $pid, name: "Product Backlog", layout: BOARD_LAYOUT }) { projectV2View { id name } } }' -f pid="$PROJECT_ID"

# Sprint Board (Board)
gh api graphql -f query='mutation($pid: ID!) { createProjectV2View(input: { projectId: $pid, name: "Sprint Board", layout: BOARD_LAYOUT }) { projectV2View { id name } } }' -f pid="$PROJECT_ID"

# Sprint Table (Table)
gh api graphql -f query='mutation($pid: ID!) { createProjectV2View(input: { projectId: $pid, name: "Sprint Table", layout: TABLE_LAYOUT }) { projectV2View { id name } } }' -f pid="$PROJECT_ID"

# Roadmap (Timeline)
gh api graphql -f query='mutation($pid: ID!) { createProjectV2View(input: { projectId: $pid, name: "Roadmap", layout: ROADMAP_LAYOUT }) { projectV2View { id name } } }' -f pid="$PROJECT_ID"

# My Items (Table)
gh api graphql -f query='mutation($pid: ID!) { createProjectV2View(input: { projectId: $pid, name: "My Items", layout: TABLE_LAYOUT }) { projectV2View { id name } } }' -f pid="$PROJECT_ID"
```

### 3.3 ビューの表示フィールド・フィルタ・ソート・グループ設定

> **注意**: GitHub Projects V2 の GraphQL API には `updateProjectV2View` mutation が存在しないため、
> ビュー設定（表示フィールド・フィルタ・ソート・グループ）は GitHub UI から手動設定が必要です。

ビュー作成後、GitHub UI で以下を設定し、各ビューで「Save」ボタンを押して保存:

| ビュー          | 表示フィールド                                           | フィルタ                  | ソート       | グループ |
| --------------- | -------------------------------------------------------- | ------------------------- | ------------ | -------- |
| Product Backlog | Priority, Sprint, Labels, Assignees, Sub-issues progress | `is:open no:parent-issue` | Priority昇順 | —        |
| Sprint Board    | Priority, Assignees, Sub-issues progress                 | `sprint:@current`         | —            | —        |
| Sprint Table    | Status, Priority, Sprint, Assignees, Labels, Estimate    | `sprint:@current`         | Priority昇順 | Assignee |
| Roadmap         | (日付: Sprint, マーカー: Milestone, Sprint)              | `no:parent-issue`         | —            | —        |
| My Items        | Status, Priority, Sprint, Labels                         | `assignee:@me is:open`    | Priority昇順 | Status   |

**設定手順**:

1. 各ビューのタブを開く
2. 右上の「View」ボタンをクリック
3. 「Fields」で表示/非表示を設定
4. 「Group by」「Sort by」を設定
5. フィルタバーにフィルタを入力
6. 「Save」ボタンで保存（確認ダイアログで「Save」を選択）

### 完了確認

- [ ] 5ビューが作成されている
- [ ] 各ビューのレイアウトが正しい（Board/Table/Roadmap）
- [ ] 各ビューの表示フィールドが正しい
- [ ] フィルタが設定されている
- [ ] ソートが設定されている（該当ビュー）
- [ ] グループが設定されている（該当ビュー）

---

## Phase 4: テンプレート作成

ターゲットリポジトリに Issue テンプレートと PR テンプレートをコミットします。

### 4.1 Issue テンプレート（機能要望）

`templates/ISSUE_TEMPLATE/feature_request.yml` の内容をリポジトリの `.github/ISSUE_TEMPLATE/feature_request.yml` にコピー。

### 4.2 Issue テンプレート（バグ報告）

`templates/ISSUE_TEMPLATE/bug_report.yml` の内容をリポジトリの `.github/ISSUE_TEMPLATE/bug_report.yml` にコピー。

### 4.3 PR テンプレート

`templates/pull_request_template.md` の内容をリポジトリの `.github/pull_request_template.md` にコピー。

### 完了確認

- [ ] `.github/ISSUE_TEMPLATE/feature_request.yml` が存在する
- [ ] `.github/ISSUE_TEMPLATE/bug_report.yml` が存在する
- [ ] `.github/pull_request_template.md` が存在する

---

## Phase 5: 自動化設定

### 5.1 Built-in Workflows（GitHub UI で設定）

Project Settings → Workflows で以下を有効化:

1. **Auto-add to project** — リポジトリの Issue/PR を自動追加
2. **Item closed** — クローズ時に Status を「Done」に変更
3. **PR merged** — マージ時に Status を「Done」に変更
4. **Item reopened** — 再オープン時に Status を「進行待ち」に変更
5. **Auto-archive** — 14日以上前にクローズされたアイテムを自動アーカイブ

### 5.2 GitHub Actions ワークフロー

`templates/workflows/` の各ファイルをリポジトリの `.github/workflows/` にコピー:

- `ci.yml` — PR の品質チェック（lint → typecheck → test → build）
- `project-automation.yml` — PR↔Issue ステータス連動
- `pr-labeler.yml` — PR 自動ラベル付与
- `stale-detection.yml` — 滞留タスク検知（週次）
- `roadmap-date-sync.yml` — Roadmap 日付同期（Sprint Iteration の開始日・終了日を確認）

### 完了確認

- [ ] Built-in Workflows 5つが有効
- [ ] `.github/workflows/` に5ファイルが存在する

---

## Phase 6: ドキュメント・最終確認

### 6.1 プロジェクト README 更新

リポジトリの README にプロジェクト運用ルールを追記（オプション）。

### 6.2 最終チェックリスト

| #   | 確認項目                                | 状態 |
| --- | --------------------------------------- | ---- |
| 1   | Status に14ステータスが設定されている   |      |
| 2   | Priority (P0-P4) フィールドが存在する   |      |
| 3   | Estimate (Number) フィールドが存在する  |      |
| 4   | Target (Text) フィールドが存在する      |      |
| 5   | Sprint (Iteration) フィールドが存在する |      |
| 6   | 13ラベルが作成されている                |      |
| 7   | Product Backlog ビューが存在する        |      |
| 8   | Sprint Board ビューが存在する           |      |
| 9   | Sprint Table ビューが存在する           |      |
| 10  | Roadmap ビューが存在する                |      |
| 11  | My Items ビューが存在する               |      |
| 12  | Issue テンプレートが存在する            |      |
| 13  | PR テンプレートが存在する               |      |
| 14  | Built-in Workflows が有効               |      |

---

## 運用コマンド（セットアップ後）

環境構築完了後、日常のプロジェクト運用で使用するコマンド:

### Issue/PR をプロジェクトに追加

```bash
./scripts/project-ops.sh <OWNER> <PROJECT_NUMBER> add-issue <REPO> <ISSUE_NUMBER>
./scripts/project-ops.sh <OWNER> <PROJECT_NUMBER> add-pr <REPO> <PR_NUMBER>
```

### ステータス変更（カード移動）

```bash
# アイテムIDを確認
./scripts/project-ops.sh <OWNER> <PROJECT_NUMBER> list-items

# ステータスを変更
./scripts/project-ops.sh <OWNER> <PROJECT_NUMBER> move <ITEM_ID> "開発中"
```

### Priority 設定

```bash
./scripts/project-ops.sh <OWNER> <PROJECT_NUMBER> set-priority <ITEM_ID> P0
```

### フィールドID確認

```bash
./scripts/project-ops.sh <OWNER> <PROJECT_NUMBER> list-fields
```

### 自動ステータス遷移（project-automation.yml）

PR 操作に連動して関連 Issue のステータスが自動変更される:

| イベント     | ステータス変更   | 条件                        |
| ------------ | ---------------- | --------------------------- |
| PR 作成      | → コードレビュー | PR 本文に `closes #XX` 記載 |
| レビュー承認 | → テスト中       | 同上                        |
| PR マージ    | → Done           | 同上                        |

**前提**: `PROJECT_TOKEN` シークレットと `STATUS_FIELD_ID` 環境変数が設定済みであること。

### 他ツールからの移行

Jira / Linear / Notion から CSV エクスポートし、一括インポート:

```bash
# Jira から移行
./scripts/migrate-import.sh <OWNER/REPO> <PROJECT_NUMBER> jira-export.csv --format jira

# Linear から移行
./scripts/migrate-import.sh <OWNER/REPO> <PROJECT_NUMBER> linear-export.csv --format linear

# プレビュー（実際には作成しない）
./scripts/migrate-import.sh <OWNER/REPO> <PROJECT_NUMBER> tasks.csv --format generic --dry-run
```

ステータス・Priority は自動マッピングされる。タイトル重複の Issue は自動スキップ。

### Sprint レポート

```bash
# 現在の Sprint レポート
./scripts/sprint-report.sh <OWNER> <PROJECT_NUMBER>

# 前回の Sprint レポート
./scripts/sprint-report.sh <OWNER> <PROJECT_NUMBER> --sprint previous

# JSON 出力（CI/Notion 連携用）
./scripts/sprint-report.sh <OWNER> <PROJECT_NUMBER> --json
```

出力: ベロシティ（完了ポイント）、完了率、ステータス分布、Priority 分布、ブロッカー一覧。
