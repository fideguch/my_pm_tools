#!/bin/bash
# Status フィールド設定スクリプト
# Usage: ./scripts/setup-status.sh <OWNER> <PROJECT_NUMBER> [--lite]
#
# GitHub Projects V2 の Status フィールドにステータスオプションを設定する。
# Full: 14ステータス / Lite: 8ステータス（--lite フラグ）
# Status は built-in フィールドのため gh CLI での直接操作に制限がある。
# このスクリプトは GraphQL API を使って設定を試行し、
# 失敗した場合は手動設定ガイドを出力する。

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
  STATUSES=(
    "Icebox"
    "Backlog"
    "要件作成中"
    "デザイン作成中"
    "開発中"
    "コードレビュー"
    "テスト中"
    "Done"
  )
else
  STATUSES=(
    "Icebox"
    "進行待ち"
    "要件作成中"
    "デザイン待ち"
    "デザイン作成中"
    "アサイン待ち"
    "開発待ち"
    "開発中"
    "コードレビュー"
    "テスト中"
    "テスト落ち"
    "リリース待ち"
    "リリース済み"
    "Done"
  )
fi

STATUS_COUNT=${#STATUSES[@]}
echo "=== Status ${STATUS_COUNT}オプション設定: Project #$NUMBER ==="

# プロジェクトIDとStatusフィールド情報を取得
echo "プロジェクト情報取得中..."
FIELD_INFO=$(gh api graphql -f query='
  query($login: String!, $number: Int!) {
    user(login: $login) {
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
  }' -f login="$OWNER" -F number="$NUMBER" 2>/dev/null)

PROJECT_ID=$(echo "$FIELD_INFO" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['user']['projectV2']['id'])" 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ]; then
  echo "エラー: プロジェクトIDを取得できませんでした"
  exit 1
fi
echo "Project ID: $PROJECT_ID"

# Status フィールドを検索
STATUS_FIELD_ID=$(echo "$FIELD_INFO" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for f in data['data']['user']['projectV2']['fields']['nodes']:
    if f and f.get('name') == 'Status':
        print(f['id'])
        break
" 2>/dev/null || echo "")

if [ -z "$STATUS_FIELD_ID" ]; then
  echo "エラー: Status フィールドが見つかりません"
  exit 1
fi
echo "Status Field ID: $STATUS_FIELD_ID"

# 既存オプションを取得
EXISTING_OPTIONS=$(echo "$FIELD_INFO" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for f in data['data']['user']['projectV2']['fields']['nodes']:
    if f and f.get('name') == 'Status':
        for opt in f.get('options', []):
            print(opt['name'])
        break
" 2>/dev/null)

echo ""
echo "既存ステータス:"
echo "$EXISTING_OPTIONS" | while read -r opt; do echo "  - $opt"; done

# 不足オプションを特定
echo ""
echo "${STATUS_COUNT}ステータスの設定状況:"
MISSING=()
for status in "${STATUSES[@]}"; do
  if echo "$EXISTING_OPTIONS" | grep -qF "$status"; then
    echo "  [OK] $status"
  else
    echo "  [--] $status (未設定)"
    MISSING+=("$status")
  fi
done

if [ ${#MISSING[@]} -eq 0 ]; then
  echo ""
  echo "=== 全${STATUS_COUNT}ステータスが設定済みです ==="
  exit 0
fi

echo ""
echo "未設定: ${#MISSING[@]} 件"
echo ""

# Status フィールドのオプション追加を試行
# 注意: GitHub Projects V2 の Status は built-in フィールドで、
# GraphQL updateProjectV2Field mutation ではオプション追加に制限がある。
# gh project field-edit が利用可能か確認
echo "=== Status オプション追加を試行中... ==="

SUCCESS_COUNT=0
FAIL_COUNT=0

for status in "${MISSING[@]}"; do
  echo -n "  $status → "
  # gh project field-edit でオプション追加を試行
  if gh project field-edit "$STATUS_FIELD_ID" \
    --project-id "$PROJECT_ID" \
    --single-select-option-add "$status" 2>/dev/null; then
    echo "追加成功"
    ((SUCCESS_COUNT++))
  else
    echo "API制限（手動設定必要）"
    ((FAIL_COUNT++))
  fi
done

echo ""
if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "=== 一部ステータスの自動設定に失敗しました ==="
  echo ""
  echo "以下の手順で手動設定してください:"
  echo "  1. プロジェクトページ → Settings → Custom fields"
  echo "  2. Status フィールドをクリック"
  echo "  3. 以下のオプションを順番に追加:"
  echo ""
  for status in "${MISSING[@]}"; do
    echo "     $status"
  done
  echo ""
  echo "  4. ドラッグ＆ドロップで正しい順序に並べ替え"
else
  echo "=== 全ステータスの自動設定完了 ==="
fi
