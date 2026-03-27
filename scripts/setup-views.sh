#!/bin/bash
# ビュー作成＆設定ガイドスクリプト
# Usage: ./scripts/setup-views.sh <OWNER> <PROJECT_NUMBER> [--lite]
# Full: 5 views / Lite: 3 views (--lite flag)
#
# ビュー作成後、各ビューの表示フィールド・フィルタ・ソート・グループの
# 設定ガイドを出力します。
#
# 注意: GitHub Projects V2 の GraphQL API には updateProjectV2View mutation が
# 存在しないため、フィルタ・ソート・グループ・表示フィールドの設定は
# GitHub UI で手動設定が必要です。

set -euo pipefail

OWNER="${1:?Usage: $0 <OWNER> <PROJECT_NUMBER> [--lite]}"
NUMBER="${2:?Usage: $0 <OWNER> <PROJECT_NUMBER> [--lite]}"

# Parse --lite flag
LITE=false
shift 2
while [[ $# -gt 0 ]]; do
  case "$1" in
    --lite) LITE=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [ "$LITE" = true ]; then
  VIEW_COUNT=3
else
  VIEW_COUNT=5
fi
echo "=== ${VIEW_COUNT}ビュー作成＆設定: Project #$NUMBER ==="

# プロジェクトID取得
echo "プロジェクトID取得中..."
PROJECT_ID=$(gh api graphql -f query='
  query($login: String!, $number: Int!) {
    user(login: $login) {
      projectV2(number: $number) { id }
    }
  }' -f login="$OWNER" -F number="$NUMBER" --jq '.data.user.projectV2.id')

if [ -z "$PROJECT_ID" ]; then
  echo "エラー: プロジェクトIDを取得できませんでした"
  echo "OWNER=$OWNER, NUMBER=$NUMBER を確認してください"
  exit 1
fi
echo "Project ID: $PROJECT_ID"

# ---------------------------------------------------------------------------
# ビュー作成
# ---------------------------------------------------------------------------
echo ""
echo "--- ビュー作成 ---"

if [ "$LITE" = true ]; then
  # Lite mode: 3 views
  echo "[1/3] Sprint Board (Board)..."
  gh api graphql -f query='
    mutation($pid: ID!) {
      createProjectV2View(input: { projectId: $pid, name: "Sprint Board", layout: BOARD_LAYOUT }) {
        projectV2View { id name }
      }
    }' -f pid="$PROJECT_ID" --jq '.data.createProjectV2View.projectV2View.name' 2>/dev/null || echo "  → 既に存在またはエラー"

  echo "[2/3] Backlog (Board)..."
  gh api graphql -f query='
    mutation($pid: ID!) {
      createProjectV2View(input: { projectId: $pid, name: "Backlog", layout: BOARD_LAYOUT }) {
        projectV2View { id name }
      }
    }' -f pid="$PROJECT_ID" --jq '.data.createProjectV2View.projectV2View.name' 2>/dev/null || echo "  → 既に存在またはエラー"

  echo "[3/3] My Items (Table)..."
  gh api graphql -f query='
    mutation($pid: ID!) {
      createProjectV2View(input: { projectId: $pid, name: "My Items", layout: TABLE_LAYOUT }) {
        projectV2View { id name }
      }
    }' -f pid="$PROJECT_ID" --jq '.data.createProjectV2View.projectV2View.name' 2>/dev/null || echo "  → 既に存在またはエラー"
else
  # Full mode: 5 views
  echo "[1/5] Product Backlog (Board)..."
  gh api graphql -f query='
    mutation($pid: ID!) {
      createProjectV2View(input: { projectId: $pid, name: "Product Backlog", layout: BOARD_LAYOUT }) {
        projectV2View { id name }
      }
    }' -f pid="$PROJECT_ID" --jq '.data.createProjectV2View.projectV2View.name' 2>/dev/null || echo "  → 既に存在またはエラー"

  echo "[2/5] Sprint Board (Board)..."
  gh api graphql -f query='
    mutation($pid: ID!) {
      createProjectV2View(input: { projectId: $pid, name: "Sprint Board", layout: BOARD_LAYOUT }) {
        projectV2View { id name }
      }
    }' -f pid="$PROJECT_ID" --jq '.data.createProjectV2View.projectV2View.name' 2>/dev/null || echo "  → 既に存在またはエラー"

  echo "[3/5] Sprint Table (Table)..."
  gh api graphql -f query='
    mutation($pid: ID!) {
      createProjectV2View(input: { projectId: $pid, name: "Sprint Table", layout: TABLE_LAYOUT }) {
        projectV2View { id name }
      }
    }' -f pid="$PROJECT_ID" --jq '.data.createProjectV2View.projectV2View.name' 2>/dev/null || echo "  → 既に存在またはエラー"

  echo "[4/5] Roadmap (Timeline)..."
  gh api graphql -f query='
    mutation($pid: ID!) {
      createProjectV2View(input: { projectId: $pid, name: "Roadmap", layout: ROADMAP_LAYOUT }) {
        projectV2View { id name }
      }
    }' -f pid="$PROJECT_ID" --jq '.data.createProjectV2View.projectV2View.name' 2>/dev/null || echo "  → 既に存在またはエラー"

  echo "[5/5] My Items (Table)..."
  gh api graphql -f query='
    mutation($pid: ID!) {
      createProjectV2View(input: { projectId: $pid, name: "My Items", layout: TABLE_LAYOUT }) {
        projectV2View { id name }
      }
    }' -f pid="$PROJECT_ID" --jq '.data.createProjectV2View.projectV2View.name' 2>/dev/null || echo "  → 既に存在またはエラー"
fi

# ---------------------------------------------------------------------------
# ビュー設定ガイド
# ---------------------------------------------------------------------------
echo ""
echo "=== ビュー作成完了 ==="
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  各ビューの設定ガイド (GitHub UI で設定 → 保存)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$LITE" = true ]; then
  echo "【1】Sprint Board (Board)"
  echo "  表示フィールド: Priority, Assignees, Sub-issues progress"
  echo "  フィルタ:       sprint:@current"
  echo "  ソート:         なし（手動）"
  echo ""
  echo "【2】Backlog (Board)"
  echo "  表示フィールド: Priority, Sprint, Labels, Assignees"
  echo "  フィルタ:       is:open"
  echo "  ソート:         Priority（昇順）"
  echo ""
  echo "【3】My Items (Table)"
  echo "  表示フィールド: Status, Priority, Sprint, Labels"
  echo "  フィルタ:       assignee:@me is:open"
  echo "  ソート:         Priority（昇順）"
  echo "  グループ:       Status"
else
  echo "【1】Product Backlog (Board)"
  echo "  表示フィールド: Priority, Sprint, Labels, Assignees, Sub-issues progress"
  echo "  非表示:         Linked pull requests, Target, Parent issue, Milestone, Estimate"
  echo "  フィルタ:       is:open no:parent-issue"
  echo "  ソート:         Priority（昇順）"
  echo "  グループ:       なし"
  echo ""
  echo "【2】Sprint Board (Board)"
  echo "  表示フィールド: Priority, Assignees, Sub-issues progress"
  echo "  非表示:         Linked pull requests, Sprint, Labels, Target, Estimate 等"
  echo "  フィルタ:       sprint:@current"
  echo "  ソート:         なし（手動）"
  echo "  グループ:       なし"
  echo ""
  echo "【3】Sprint Table (Table)"
  echo "  表示フィールド: Status, Priority, Sprint, Assignees, Labels, Estimate"
  echo "  非表示:         Linked pull requests, Sub-issues progress, Target 等"
  echo "  フィルタ:       sprint:@current"
  echo "  ソート:         Priority（昇順）"
  echo "  グループ:       Assignee"
  echo ""
  echo "【4】Roadmap (Timeline)"
  echo "  日付フィールド: Sprint (Iteration)"
  echo "  マーカー:       Milestone, Sprint"
  echo "  フィルタ:       no:parent-issue"
  echo ""
  echo "【5】My Items (Table)"
  echo "  表示フィールド: Status, Priority, Sprint, Labels"
  echo "  非表示:         Linked pull requests, Sub-issues progress, Estimate, Target 等"
  echo "  フィルタ:       assignee:@me is:open"
  echo "  ソート:         Priority（昇順）"
  echo "  グループ:       Status"
fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "設定手順:"
echo "  1. 各ビューのタブを開く"
echo "  2. 右上の「View」ボタンをクリック"
echo "  3. 「Fields」で表示/非表示を設定"
echo "  4. 「Group by」「Sort by」を設定"
echo "  5. フィルタバーにフィルタを入力"
echo "  6. 「Save」ボタンで保存（確認ダイアログで「Save」を選択）"
echo ""
echo "※ GitHub Projects V2 の GraphQL API では updateProjectV2View mutation が"
echo "  未提供のため、ビュー設定は GitHub UI からの手動設定が必要です。"
