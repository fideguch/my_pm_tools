# GitHub Projects V2 環境自動構築スキル

## メタデータ

- **トリガー**: 「GitHub Project環境構築」「プロジェクトボード設定」「14ステータス設定」「!setup_github_project」
- **前提条件**: gh CLI 認証済み、Classic PAT（`ghp_`）取得済み、スコープ `project,repo,read:org`

## 概要

GitHub Projects V2 の開発環境を一括構築するスキル。
14ステータスワークフロー、5ビュー、カスタムフィールド、ラベル13種、
テンプレート、GitHub Actions 自動化を段階的にセットアップする。

**重要**: Projects V2 の GraphQL API 操作には **Classic PAT（`ghp_`トークン）** が必須。
Fine-grained PAT は個人ユーザー所有の Projects V2 に非対応。

---

## Phase 1: 事前確認

### 1.1 認証確認

```bash
# gh CLI 認証状態
gh auth status

# project スコープがない場合
gh auth refresh --scopes "project,repo,read:org"
```

### 1.2 リポジトリ・プロジェクト情報取得

```bash
# ユーザーに OWNER/REPO と PROJECT_NUMBER を確認
OWNER="<owner>"
REPO="<owner/repo>"
NUMBER=<project_number>

# プロジェクト一覧
gh project list --owner "$OWNER"

# プロジェクト詳細
gh project view "$NUMBER" --owner "$OWNER"
```

### 1.3 プロジェクトID取得（GraphQL）

Classic PAT を使って直接 curl で実行（gh CLI はプロキシ経由で別トークンになるため）:

```bash
PAT="ghp_XXXXX"

PROJECT_ID=$(curl -s -H "Authorization: bearer $PAT" https://api.github.com/graphql \
  -d "{\"query\":\"query { user(login: \\\"$OWNER\\\") { projectV2(number: $NUMBER) { id } } }\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['user']['projectV2']['id'])")

echo "Project ID: $PROJECT_ID"
```

---

## Phase 2: カスタムフィールド作成

```bash
# Priority (Single Select)
gh project field-create "$NUMBER" --owner "$OWNER" \
  --name "Priority" --data-type "SINGLE_SELECT" \
  --single-select-options "P0 - 即日着手,P1 - 高 (1〜3営業日),P2 - 中 (スプリント内),P3 - 低 (時間あれば),P4 - 未定 (保留中)" \
  2>/dev/null || echo "Priority: 既に存在（スキップ）"

# Estimate (Number)
gh project field-create "$NUMBER" --owner "$OWNER" \
  --name "Estimate" --data-type "NUMBER" \
  2>/dev/null || echo "Estimate: 既に存在（スキップ）"

# Target (Text)
gh project field-create "$NUMBER" --owner "$OWNER" \
  --name "Target" --data-type "TEXT" \
  2>/dev/null || echo "Target: 既に存在（スキップ）"
```

### Sprint (Iteration) フィールド

gh CLI では直接作成不可。GraphQL API で作成:

```bash
curl -s -H "Authorization: bearer $PAT" https://api.github.com/graphql \
  -d "{\"query\":\"mutation { createProjectV2IterationField(input: { projectId: \\\"$PROJECT_ID\\\", title: \\\"Sprint\\\", settings: { duration: 7 } }) { field { id name } } }\"}"
```

---

## Phase 3: 14ステータス設定

GitHub UI または GraphQL API で Status フィールドに以下のオプションを設定:

| # | ステータス | フェーズ |
|---|-----------|---------|
| 1 | Icebox | Planning |
| 2 | 進行待ち | Planning |
| 3 | 要件作成中 | Planning |
| 4 | デザイン待ち | Design |
| 5 | デザイン作成中 | Design |
| 6 | アサイン待ち | Dev |
| 7 | 開発待ち | Dev |
| 8 | 開発中 | Dev |
| 9 | コードレビュー | Dev |
| 10 | テスト中 | Release |
| 11 | テスト落ち | Release |
| 12 | リリース待ち | Release |
| 13 | リリース済み | Release |
| 14 | Done | - |

---

## Phase 4: ラベル13種一括作成

```bash
# スクリプト使用
./scripts/setup-labels.sh "$REPO"

# または手動
gh label create "feature" --repo "$REPO" --color "0E8A16" --description "新機能追加" --force
gh label create "bug" --repo "$REPO" --color "D73A4A" --description "バグ修正" --force
gh label create "refine" --repo "$REPO" --color "FBCA04" --description "改善・リファクタリング" --force
gh label create "infra" --repo "$REPO" --color "6F42C1" --description "インフラ・DevOps" --force
gh label create "docs" --repo "$REPO" --color "0075CA" --description "ドキュメント" --force
gh label create "research" --repo "$REPO" --color "C5DEF5" --description "調査・技術検証" --force
gh label create "frontend" --repo "$REPO" --color "F9A825" --description "フロントエンド関連" --force
gh label create "backend" --repo "$REPO" --color "795548" --description "バックエンド関連" --force
gh label create "design" --repo "$REPO" --color "E91E8F" --description "デザイン関連" --force
gh label create "growth" --repo "$REPO" --color "2EA44F" --description "グロース施策" --force
gh label create "blocked" --repo "$REPO" --color "000000" --description "ブロッカーあり" --force
gh label create "needs-review" --repo "$REPO" --color "FEF2C0" --description "レビュー必要" --force
gh label create "good-first-issue" --repo "$REPO" --color "7057FF" --description "初心者向け" --force
```

---

## Phase 5: 5ビュー作成

```bash
# Product Backlog (Board)
curl -s -H "Authorization: bearer $PAT" https://api.github.com/graphql \
  -d "{\"query\":\"mutation { createProjectV2View(input: { projectId: \\\"$PROJECT_ID\\\", name: \\\"Product Backlog\\\", layout: BOARD_LAYOUT }) { projectV2View { id name } } }\"}"

# Sprint Board (Board)
curl -s -H "Authorization: bearer $PAT" https://api.github.com/graphql \
  -d "{\"query\":\"mutation { createProjectV2View(input: { projectId: \\\"$PROJECT_ID\\\", name: \\\"Sprint Board\\\", layout: BOARD_LAYOUT }) { projectV2View { id name } } }\"}"

# Sprint Table (Table)
curl -s -H "Authorization: bearer $PAT" https://api.github.com/graphql \
  -d "{\"query\":\"mutation { createProjectV2View(input: { projectId: \\\"$PROJECT_ID\\\", name: \\\"Sprint Table\\\", layout: TABLE_LAYOUT }) { projectV2View { id name } } }\"}"

# Roadmap (Timeline)
curl -s -H "Authorization: bearer $PAT" https://api.github.com/graphql \
  -d "{\"query\":\"mutation { createProjectV2View(input: { projectId: \\\"$PROJECT_ID\\\", name: \\\"Roadmap\\\", layout: ROADMAP_LAYOUT }) { projectV2View { id name } } }\"}"

# My Items (Table)
curl -s -H "Authorization: bearer $PAT" https://api.github.com/graphql \
  -d "{\"query\":\"mutation { createProjectV2View(input: { projectId: \\\"$PROJECT_ID\\\", name: \\\"My Items\\\", layout: TABLE_LAYOUT }) { projectV2View { id name } } }\"}"
```

### ビューのフィルタ設定（GitHub UI で手動）

| ビュー | フィルタ | ソート/グループ |
|--------|---------|----------------|
| Product Backlog | `is:open no:parent-issue` | Priority昇順 |
| Sprint Board | `sprint:@current` | — |
| Sprint Table | `sprint:@current` | Assigneeグループ, Priority昇順 |
| Roadmap | `no:parent-issue` | — |
| My Items | `assignee:@me is:open` | Statusグループ, Priority昇順 |

---

## Phase 6: Built-in Workflows 有効化

GitHub UI の Project Settings → Workflows で以下を有効化:

1. **Auto-add to project** — リポジトリの Issue/PR を自動追加
2. **Item closed** — クローズ時に Status を「Done」に変更
3. **PR merged** — マージ時に Status を「Done」に変更
4. **Item reopened** — 再オープン時に Status を「進行待ち」に変更
5. **Auto-archive** — 14日以上前にクローズされたアイテムを自動アーカイブ

---

## Phase 7: テンプレート・ワークフロー配置

リポジトリに以下をコミット:

```
.github/
├── ISSUE_TEMPLATE/
│   ├── feature_request.yml
│   └── bug_report.yml
├── pull_request_template.md
├── labeler.yml
└── workflows/
    ├── ci.yml
    ├── project-automation.yml
    ├── pr-labeler.yml
    └── stale-detection.yml
```

---

## Phase 8: リポジトリシークレット設定

```
Repository Settings → Secrets and variables → Actions → New repository secret
  Name: PROJECT_TOKEN
  Value: ghp_XXXXX（Classic PAT）
```

---

## 最終チェックリスト

| # | 確認項目 | 状態 |
|---|---------|------|
| 1 | 14ステータスが設定されている | |
| 2 | Priority (P0-P4) フィールドが存在する | |
| 3 | Estimate (Number) フィールドが存在する | |
| 4 | Target (Text) フィールドが存在する | |
| 5 | Sprint (Iteration) フィールドが存在する | |
| 6 | 13ラベルが作成されている | |
| 7 | Product Backlog ビューが存在する | |
| 8 | Sprint Board ビューが存在する | |
| 9 | Sprint Table ビューが存在する | |
| 10 | Roadmap ビューが存在する | |
| 11 | My Items ビューが存在する | |
| 12 | Issue テンプレートが存在する | |
| 13 | PR テンプレートが存在する | |
| 14 | Built-in Workflows が有効 | |
| 15 | PROJECT_TOKEN シークレットが設定されている | |
| 16 | GitHub Actions が正常動作する | |
