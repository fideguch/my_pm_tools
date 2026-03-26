#!/bin/bash
# 全環境一括構築スクリプト
# Usage: ./scripts/setup-all.sh <OWNER/REPO> <PROJECT_NUMBER>

set -euo pipefail

REPO="${1:?Usage: $0 <OWNER/REPO> <PROJECT_NUMBER>}"
NUMBER="${2:?Usage: $0 <OWNER/REPO> <PROJECT_NUMBER>}"
OWNER="${REPO%%/*}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo "  GitHub Projects V2 環境一括構築"
echo "============================================"
echo "リポジトリ: $REPO"
echo "プロジェクト: #$NUMBER"
echo "オーナー: $OWNER"
echo ""

# Phase 1: 認証確認
echo "=== Phase 0: 認証確認 ==="
gh auth status
echo ""

# Phase 1: カスタムフィールド
echo "=== Phase 1: カスタムフィールド作成 ==="
"$SCRIPT_DIR/setup-fields.sh" "$OWNER" "$NUMBER"
echo ""

# Phase 2: ラベル
echo "=== Phase 2: ラベル一括作成 ==="
"$SCRIPT_DIR/setup-labels.sh" "$REPO"
echo ""

# Phase 3: ビュー
echo "=== Phase 3: ビュー作成 ==="
"$SCRIPT_DIR/setup-views.sh" "$OWNER" "$NUMBER"
echo ""

# Phase 4: テンプレート
echo "=== Phase 4: テンプレート配置 ==="
TEMPLATE_DIR="$(dirname "$SCRIPT_DIR")/templates"

if [ -d "$TEMPLATE_DIR/ISSUE_TEMPLATE" ]; then
  echo "Issue テンプレートをリポジトリにコピーするには:"
  echo "  1. リポジトリをクローン"
  echo "  2. mkdir -p .github/ISSUE_TEMPLATE"
  echo "  3. cp $TEMPLATE_DIR/ISSUE_TEMPLATE/* .github/ISSUE_TEMPLATE/"
  echo "  4. cp $TEMPLATE_DIR/pull_request_template.md .github/"
  echo "  5. コミット＆プッシュ"
else
  echo "テンプレートディレクトリが見つかりません: $TEMPLATE_DIR"
fi
echo ""

# Phase 5: 自動化
echo "=== Phase 5: 自動化設定 ==="
echo "Built-in Workflows は GitHub UI で手動設定が必要です:"
echo "  1. Auto-add to project"
echo "  2. Item closed → Done"
echo "  3. PR merged → Done"
echo "  4. Item reopened → 進行待ち"
echo "  5. Auto-archive (14日)"
echo ""
echo "GitHub Actions ワークフロー:"
if [ -d "$TEMPLATE_DIR/workflows" ]; then
  echo "  リポジトリの .github/workflows/ に以下をコピー:"
  ls "$TEMPLATE_DIR/workflows/"
else
  echo "  ワークフローテンプレートが見つかりません"
fi
echo ""

echo "============================================"
echo "  構築完了！"
echo "============================================"
echo ""
echo "【手動設定チェックリスト】"
echo "  □ Status に14ステータスを設定"
echo "  □ Sprint (Iteration) フィールドを作成（1週間サイクル）"
echo "  □ 各ビューの表示フィールド・フィルタ・ソート・グループを設定（詳細は setup-views.sh の出力参照）"
echo "  □ Built-in Workflows を有効化"
echo "  □ テンプレートをリポジトリにコミット"
echo "  □ GitHub Actions ワークフローをリポジトリにコミット"
