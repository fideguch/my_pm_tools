# 自動化ガイド

## Built-in Workflows（GitHub UI で設定）

Project Settings → Workflows で以下の5つを有効化します。

| #   | ワークフロー            | トリガー                     | アクション                                          |
| --- | ----------------------- | ---------------------------- | --------------------------------------------------- |
| 1   | **Auto-add to project** | リポジトリに Issue/PR 作成時 | プロジェクトに自動追加、Status を「進行待ち」に設定 |
| 2   | **Item closed**         | Issue/PR クローズ時          | Status を「Done」に変更                             |
| 3   | **PR merged**           | PR マージ時                  | Status を「Done」に変更                             |
| 4   | **Item reopened**       | Issue 再オープン時           | Status を「進行待ち」に変更                         |
| 5   | **Auto-archive**        | クローズ後14日経過           | アイテムを自動アーカイブ                            |

### 設定手順

1. プロジェクトページ → `...` メニュー → **Workflows**
2. 各ワークフローをクリック → **Edit**
3. トリガーとアクションを設定 → **Save**

---

## GitHub Actions ワークフロー

`templates/workflows/` に5つのワークフローテンプレートを用意しています。

### 1. CI Quality Check (`ci.yml`)

PR の品質を自動チェックするパイプライン。

```
PR作成/更新 → lint → typecheck → test → build
```

- **トリガー**: `pull_request` (main, develop)、`push` (main)
- **ブロッキング**: ブランチ保護ルールと組み合わせてマージをブロック

### 2. Project Automation (`project-automation.yml`)

PR と Issue のステータスを GraphQL API で自動連動。PR 本文に `closes #XX` 形式で Issue 番号を記載すると、PR のライフサイクルに応じて関連 Issue のステータスが自動変更される。

| イベント     | アクション                        | GraphQL Mutation                |
| ------------ | --------------------------------- | ------------------------------- |
| PR 作成      | 関連 Issue を「コードレビュー」へ | `updateProjectV2ItemFieldValue` |
| レビュー承認 | 関連 Issue を「テスト中」へ       | `updateProjectV2ItemFieldValue` |
| PR マージ    | 関連 Issue を「Done」へ           | `updateProjectV2ItemFieldValue` |

**前提**:

- `PROJECT_TOKEN` シークレットに Classic PAT を設定
- `PROJECT_ID` 環境変数にプロジェクトの Node ID を設定（`setup-templates.sh` で自動置換）
- `STATUS_FIELD_ID` 環境変数に Status フィールド ID を設定（`project-ops.sh list-fields` で確認）

### 運用スクリプト (`project-ops.sh`)

コマンドラインから直接プロジェクトアイテムを操作するスクリプト。`actions/add-to-project` (681★) と同等の機能を CLI で提供。

```bash
# Issue/PR をプロジェクトに追加
./scripts/project-ops.sh <OWNER> <NUMBER> add-issue <REPO> <ISSUE_NUMBER>
./scripts/project-ops.sh <OWNER> <NUMBER> add-pr <REPO> <PR_NUMBER>

# ステータス変更（カード移動）
./scripts/project-ops.sh <OWNER> <NUMBER> move <ITEM_ID> "開発中"

# アイテム一覧・フィールドID確認
./scripts/project-ops.sh <OWNER> <NUMBER> list-items
./scripts/project-ops.sh <OWNER> <NUMBER> list-fields
```

### 3. PR Labeler (`pr-labeler.yml`)

変更ファイルのパスに基づいて PR にラベルを自動付与。

- `.github/labeler.yml` でパス→ラベルのマッピングを定義

### 4. Stale Detection (`stale-detection.yml`)

週次で滞留タスクを検知。

- **スケジュール**: 毎週月曜 00:00 UTC
- **検知条件**: 5日以上更新がないオープン Issue
- **アクション**: ログ出力（コメント通知はオプション）

### 5. Roadmap Date Sync (`roadmap-date-sync.yml`)

Sprint（Iteration）フィールドの日付情報を読み取り、Roadmapビューとの整合性をチェック。

- **トリガー**: `workflow_dispatch`（手動）、`schedule`（毎日 9:00 UTC）、Issue/PR イベント
- **動作**: Sprint の開始日・終了日をログ出力し、GitHub Actions Summary に一覧表示
- **注意**: 読み取り専用（日付フィールドへの書き込みは行わない）。Roadmap 表示は GitHub UI の Date fields 設定に依存
- **前提**: `PROJECT_TOKEN` シークレットに Classic PAT を設定

---

## セットアップ手順

### 1. シークレット設定

```
Repository Settings → Secrets and variables → Actions → New repository secret
```

| シークレット名  | 値                      | 用途                              |
| --------------- | ----------------------- | --------------------------------- |
| `PROJECT_TOKEN` | Classic PAT (`ghp_...`) | Project Automation ワークフロー用 |

### 2. ワークフローファイル配置

```bash
# 自動配置（推奨）— プレースホルダー自動置換 + コミット + プッシュ
./scripts/setup-templates.sh <OWNER/REPO> <PROJECT_NUMBER>

# または手動コピー
cp templates/workflows/*.yml .github/workflows/
git add .github/workflows/
git commit -m "feat: add GitHub Actions workflows"
git push
```

### 移行ツール (`migrate-import.sh`)

Jira / Linear / Notion からの CSV インポート。Issue 一括作成 + Project 追加 + フィールド設定。

```bash
./scripts/migrate-import.sh <OWNER/REPO> <NUMBER> export.csv --format jira
./scripts/migrate-import.sh <OWNER/REPO> <NUMBER> export.csv --format linear --dry-run
```

### Sprint レポート (`sprint-report.sh`)

Sprint のベロシティ・完了率・ブロッカーを自動集計。

```bash
./scripts/sprint-report.sh <OWNER> <NUMBER>              # 現在の Sprint
./scripts/sprint-report.sh <OWNER> <NUMBER> --json        # JSON 出力
./scripts/sprint-report.sh <OWNER> <NUMBER> --sprint previous  # 前回の Sprint
```

### 3. ブランチ保護ルール設定

```
Repository Settings → Branches → Branch protection rules → Add rule
```

| 設定                      | 推奨値             |
| ------------------------- | ------------------ |
| Branch name pattern       | `main`             |
| Require status checks     | `CI Quality Check` |
| Require PR reviews        | 1名以上            |
| Dismiss stale reviews     | 有効               |
| Require up-to-date branch | 有効               |
| Restrict force pushes     | 有効               |
