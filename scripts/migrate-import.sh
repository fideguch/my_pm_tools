#!/bin/bash
# 他ツールからの移行スクリプト（Jira / Linear / Notion / Generic CSV）
# Usage: ./scripts/migrate-import.sh <OWNER/REPO> <PROJECT_NUMBER> <CSV_FILE> [OPTIONS]
#
# Options:
#   --format jira|linear|notion|generic   CSV フォーマット（デフォルト: generic）
#   --dry-run                             実際の作成をせずプレビューのみ
#   --skip-duplicates                     タイトル重複の Issue をスキップ（デフォルト: 有効）
#
# Examples:
#   ./scripts/migrate-import.sh owner/repo 1 jira-export.csv --format jira
#   ./scripts/migrate-import.sh owner/repo 1 linear-export.csv --format linear --dry-run
#   ./scripts/migrate-import.sh owner/repo 1 tasks.csv --format generic

set -euo pipefail

REPO="${1:?Usage: $0 <OWNER/REPO> <PROJECT_NUMBER> <CSV_FILE> [--format jira|linear|notion|generic] [--dry-run]}"
NUMBER="${2:?Usage: $0 <OWNER/REPO> <PROJECT_NUMBER> <CSV_FILE> [--format jira|linear|notion|generic] [--dry-run]}"
CSV_FILE="${3:?Usage: $0 <OWNER/REPO> <PROJECT_NUMBER> <CSV_FILE> [--format jira|linear|notion|generic] [--dry-run]}"
shift 3

OWNER="${REPO%%/*}"
FORMAT="generic"
DRY_RUN=false
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Parse options
while [[ $# -gt 0 ]]; do
  case "$1" in
    --format) FORMAT="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --skip-duplicates) shift ;; # default behavior
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [ ! -f "$CSV_FILE" ]; then
  echo "エラー: CSV ファイルが見つかりません: $CSV_FILE"
  exit 1
fi

echo "============================================"
echo "  GitHub Projects V2 移行インポート"
echo "============================================"
echo "リポジトリ: $REPO"
echo "プロジェクト: #$NUMBER"
echo "CSV ファイル: $CSV_FILE"
echo "フォーマット: $FORMAT"
echo "ドライラン: $DRY_RUN"
echo ""

# Python script for CSV parsing and import
python3 << 'PYTHON_SCRIPT' "$REPO" "$NUMBER" "$CSV_FILE" "$FORMAT" "$DRY_RUN" "$OWNER"
import csv
import subprocess
import sys
import json
import time

REPO = sys.argv[1]
NUMBER = sys.argv[2]
CSV_FILE = sys.argv[3]
FORMAT = sys.argv[4]
DRY_RUN = sys.argv[5] == "true"
OWNER = sys.argv[6]

# Status mapping tables
JIRA_STATUS_MAP = {
    "To Do": "進行待ち",
    "Open": "進行待ち",
    "In Progress": "開発中",
    "In Review": "コードレビュー",
    "In Testing": "テスト中",
    "Done": "Done",
    "Closed": "Done",
    "Backlog": "Icebox",
}

LINEAR_STATUS_MAP = {
    "Backlog": "Icebox",
    "Todo": "進行待ち",
    "In Progress": "開発中",
    "In Review": "コードレビュー",
    "Done": "Done",
    "Canceled": "Done",
    "Cancelled": "Done",
    "Triage": "進行待ち",
}

JIRA_PRIORITY_MAP = {
    "Highest": "P0", "Blocker": "P0", "Critical": "P0",
    "High": "P1",
    "Medium": "P2", "Normal": "P2",
    "Low": "P3",
    "Lowest": "P4", "Trivial": "P4",
}

LINEAR_PRIORITY_MAP = {
    "Urgent": "P0", "0": "P0",
    "High": "P1", "1": "P1",
    "Medium": "P2", "2": "P2",
    "Low": "P3", "3": "P3",
    "No priority": "P4", "4": "P4",
}

JIRA_TYPE_MAP = {
    "Bug": "bug",
    "Story": "feature",
    "Task": "feature",
    "Epic": "feature",
    "Improvement": "refine",
    "Sub-task": "feature",
}

def run_gh(args, capture=True):
    """Run gh CLI command."""
    cmd = ["gh"] + args
    if capture:
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.stdout.strip(), result.returncode
    else:
        return subprocess.run(cmd).returncode

def get_existing_titles():
    """Get existing issue titles to avoid duplicates."""
    out, rc = run_gh(["issue", "list", "--repo", REPO, "--state", "all", "--json", "title", "--limit", "500"])
    if rc != 0:
        return set()
    try:
        issues = json.loads(out)
        return {i["title"] for i in issues}
    except Exception:
        return set()

def get_project_id():
    """Get project node ID."""
    query = f'''query($login: String!, $number: Int!) {{
        user(login: $login) {{ projectV2(number: $number) {{ id }} }}
    }}'''
    out, rc = run_gh(["api", "graphql", "-f", f"query={query}", "-f", f"login={OWNER}", "-F", f"number={NUMBER}", "--jq", ".data.user.projectV2.id"])
    return out if rc == 0 else None

def add_to_project(project_id, issue_node_id):
    """Add issue to project."""
    query = '''mutation($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
            item { id }
        }
    }'''
    out, rc = run_gh(["api", "graphql", "-f", f"query={query}", "-f", f"projectId={project_id}", "-f", f"contentId={issue_node_id}", "--jq", ".data.addProjectV2ItemById.item.id"])
    return out if rc == 0 else None

def parse_csv(filepath, fmt):
    """Parse CSV and return normalized rows."""
    rows = []
    with open(filepath, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            item = normalize_row(row, fmt)
            if item and item.get("title"):
                rows.append(item)
    return rows

def normalize_row(row, fmt):
    """Normalize a CSV row based on format."""
    if fmt == "jira":
        return {
            "title": row.get("Summary", ""),
            "description": row.get("Description", ""),
            "status": JIRA_STATUS_MAP.get(row.get("Status", ""), "進行待ち"),
            "priority": JIRA_PRIORITY_MAP.get(row.get("Priority", ""), "P2"),
            "labels": [JIRA_TYPE_MAP.get(row.get("Issue Type", ""), "feature")],
            "assignee": row.get("Assignee", ""),
            "estimate": row.get("Story Points", row.get("Custom field (Story Points)", "")),
        }
    elif fmt == "linear":
        labels = [l.strip() for l in row.get("Labels", "").split(",") if l.strip()]
        return {
            "title": row.get("Title", ""),
            "description": row.get("Description", ""),
            "status": LINEAR_STATUS_MAP.get(row.get("Status", ""), "進行待ち"),
            "priority": LINEAR_PRIORITY_MAP.get(row.get("Priority", ""), "P2"),
            "labels": labels if labels else ["feature"],
            "assignee": row.get("Assignee", ""),
            "estimate": row.get("Estimate", ""),
        }
    elif fmt == "notion":
        title = row.get("Title", row.get("Name", row.get("タイトル", "")))
        return {
            "title": title,
            "description": row.get("Description", row.get("説明", "")),
            "status": row.get("Status", row.get("ステータス", "進行待ち")),
            "priority": row.get("Priority", row.get("優先度", "P2")),
            "labels": [l.strip() for l in row.get("Tags", row.get("Labels", row.get("ラベル", "feature"))).split(",") if l.strip()],
            "assignee": row.get("Assignee", row.get("担当者", "")),
            "estimate": row.get("Estimate", row.get("見積もり", "")),
        }
    else:  # generic
        return {
            "title": row.get("Title", row.get("title", row.get("Summary", ""))),
            "description": row.get("Description", row.get("description", "")),
            "status": row.get("Status", row.get("status", "進行待ち")),
            "priority": row.get("Priority", row.get("priority", "")),
            "labels": [l.strip() for l in row.get("Labels", row.get("labels", "")).split(",") if l.strip()],
            "assignee": row.get("Assignee", row.get("assignee", "")),
            "estimate": row.get("Estimate", row.get("estimate", "")),
        }

# Main
print("CSV 読み込み中...")
items = parse_csv(CSV_FILE, FORMAT)
print(f"  {len(items)} 件のアイテムを検出")

if not items:
    print("インポート対象が見つかりません。CSV のヘッダーを確認してください。")
    sys.exit(0)

# Show mapping preview
print(f"\nマッピングプレビュー（先頭5件）:")
print(f"{'Title':<40} {'Status':<15} {'Priority':<5} {'Labels'}")
print("-" * 80)
for item in items[:5]:
    labels_str = ",".join(item["labels"][:2])
    print(f"{item['title'][:39]:<40} {item['status']:<15} {item['priority']:<5} {labels_str}")
if len(items) > 5:
    print(f"... and {len(items) - 5} more")

if DRY_RUN:
    print(f"\n[DRY RUN] {len(items)} 件のインポートを実行します（実際には作成しません）")
    sys.exit(0)

# Get existing titles for duplicate detection
print("\n既存 Issue を確認中...")
existing = get_existing_titles()
print(f"  既存 Issue: {len(existing)} 件")

# Get project ID
project_id = get_project_id()
if not project_id:
    print("エラー: プロジェクトIDを取得できませんでした")
    sys.exit(1)

# Import
created = 0
skipped = 0
errors = 0

print(f"\nインポート開始...")
for i, item in enumerate(items):
    prefix = f"[{i+1}/{len(items)}]"

    if item["title"] in existing:
        print(f"  {prefix} SKIP (duplicate): {item['title'][:50]}")
        skipped += 1
        continue

    # Create issue
    gh_args = ["issue", "create", "--repo", REPO, "--title", item["title"]]

    body = item.get("description", "")
    if body:
        gh_args.extend(["--body", body])

    for label in item.get("labels", []):
        if label:
            gh_args.extend(["--label", label])

    if item.get("assignee"):
        gh_args.extend(["--assignee", item["assignee"]])

    out, rc = run_gh(gh_args)
    if rc != 0:
        print(f"  {prefix} ERROR: {item['title'][:50]}")
        errors += 1
        continue

    # Extract issue URL and number
    issue_url = out.strip()
    print(f"  {prefix} CREATED: {item['title'][:40]} → {issue_url}")
    created += 1

    # Add to project and set fields using project-ops.sh
    try:
        issue_number = issue_url.rstrip("/").split("/")[-1]
        # Get node ID
        node_out, _ = run_gh(["api", f"repos/{REPO}/issues/{issue_number}", "--jq", ".node_id"])
        if node_out:
            item_id = add_to_project(project_id, node_out)
            if item_id:
                # Set priority if available
                if item.get("priority"):
                    subprocess.run(
                        ["bash", f"{sys.path[0]}/../scripts/project-ops.sh" if False else "./scripts/project-ops.sh",
                         OWNER, NUMBER, "set-priority", item_id, item["priority"]],
                        capture_output=True
                    )
                # Set status if not default
                if item.get("status") and item["status"] != "進行待ち":
                    subprocess.run(
                        ["bash", "./scripts/project-ops.sh",
                         OWNER, NUMBER, "move", item_id, item["status"]],
                        capture_output=True
                    )
    except Exception as e:
        pass  # Non-critical: issue was created, field setting is best-effort

    # Rate limit protection
    time.sleep(1)

print(f"\n============================================")
print(f"  インポート完了")
print(f"============================================")
print(f"  作成: {created} 件")
print(f"  スキップ（重複）: {skipped} 件")
print(f"  エラー: {errors} 件")
print(f"  合計: {len(items)} 件")
PYTHON_SCRIPT
