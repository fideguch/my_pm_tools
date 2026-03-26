#!/bin/bash
# Sprint レポート生成スクリプト
# Usage: ./scripts/sprint-report.sh <OWNER> <PROJECT_NUMBER> [OPTIONS]
#
# Options:
#   --sprint current|previous|<name>   対象 Sprint（デフォルト: current）
#   --json                             JSON 形式で出力
#
# Examples:
#   ./scripts/sprint-report.sh owner 1
#   ./scripts/sprint-report.sh owner 1 --sprint previous
#   ./scripts/sprint-report.sh owner 1 --sprint "Sprint 2026-W13" --json

set -euo pipefail

OWNER="${1:?Usage: $0 <OWNER> <PROJECT_NUMBER> [--sprint current|previous|<name>] [--json]}"
NUMBER="${2:?Usage: $0 <OWNER> <PROJECT_NUMBER> [--sprint current|previous|<name>] [--json]}"
shift 2

SPRINT_FILTER="current"
JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --sprint) SPRINT_FILTER="$2"; shift 2 ;;
    --json) JSON_OUTPUT=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Fetch all project data via GraphQL
python3 << 'PYTHON_SCRIPT' "$OWNER" "$NUMBER" "$SPRINT_FILTER" "$JSON_OUTPUT"
import subprocess
import json
import sys
from datetime import datetime, timezone

OWNER = sys.argv[1]
NUMBER = sys.argv[2]
SPRINT_FILTER = sys.argv[3]
JSON_OUTPUT = sys.argv[4] == "true"

def run_gh(args):
    result = subprocess.run(["gh"] + args, capture_output=True, text=True)
    return result.stdout.strip() if result.returncode == 0 else None

def get_project_data():
    """Fetch project items with field values."""
    query = '''query($login: String!, $number: Int!) {
      user(login: $login) {
        projectV2(number: $number) {
          id
          title
          fields(first: 50) {
            nodes {
              ... on ProjectV2IterationField {
                id name
                configuration {
                  iterations { id title startDate duration }
                  completedIterations { id title startDate duration }
                }
              }
              ... on ProjectV2SingleSelectField {
                id name options { id name }
              }
              ... on ProjectV2Field {
                id name dataType
              }
            }
          }
          items(first: 200) {
            nodes {
              id
              content {
                ... on Issue {
                  number title state
                  labels(first: 10) { nodes { name } }
                }
                ... on PullRequest {
                  number title state
                }
              }
              fieldValues(first: 20) {
                nodes {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    field { ... on ProjectV2SingleSelectField { name } }
                    name
                  }
                  ... on ProjectV2ItemFieldNumberValue {
                    field { ... on ProjectV2Field { name } }
                    number
                  }
                  ... on ProjectV2ItemFieldIterationValue {
                    field { ... on ProjectV2IterationField { name } }
                    title startDate duration iterationId
                  }
                }
              }
            }
          }
        }
      }
    }'''
    out = run_gh(["api", "graphql", "-f", f"query={query}", "-f", f"login={OWNER}", "-F", f"number={NUMBER}"])
    if not out:
        return None
    return json.loads(out)

def find_target_sprint(fields, sprint_filter):
    """Find the target sprint iteration."""
    sprint_field = None
    for f in fields:
        if f and f.get("configuration", {}).get("iterations") is not None:
            sprint_field = f
            break
    if not sprint_field:
        return None, None

    all_iterations = (
        sprint_field["configuration"].get("iterations", []) +
        sprint_field["configuration"].get("completedIterations", [])
    )
    if not all_iterations:
        return None, None

    # Sort by start date
    all_iterations.sort(key=lambda x: x.get("startDate", ""), reverse=True)

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    if sprint_filter == "current":
        for it in all_iterations:
            start = it["startDate"]
            end_date = datetime.strptime(start, "%Y-%m-%d")
            from datetime import timedelta
            end = (end_date + timedelta(days=it["duration"])).strftime("%Y-%m-%d")
            if start <= now <= end:
                return it, sprint_field["id"]
        # Fallback to most recent
        return all_iterations[0], sprint_field["id"]
    elif sprint_filter == "previous":
        current_found = False
        for it in all_iterations:
            start = it["startDate"]
            end_date = datetime.strptime(start, "%Y-%m-%d")
            from datetime import timedelta
            end = (end_date + timedelta(days=it["duration"])).strftime("%Y-%m-%d")
            if start <= now <= end:
                current_found = True
                continue
            if current_found:
                return it, sprint_field["id"]
        # Fallback to second most recent
        return all_iterations[1] if len(all_iterations) > 1 else all_iterations[0], sprint_field["id"]
    else:
        for it in all_iterations:
            if it["title"] == sprint_filter:
                return it, sprint_field["id"]
        return None, None

def get_item_field(item, field_name):
    """Get field value from item."""
    for fv in item.get("fieldValues", {}).get("nodes", []):
        if fv and fv.get("field", {}).get("name") == field_name:
            return fv.get("name") or fv.get("number") or fv.get("title")
    return None

def get_item_sprint_id(item):
    """Get sprint iteration ID from item."""
    for fv in item.get("fieldValues", {}).get("nodes", []):
        if fv and fv.get("iterationId"):
            return fv["iterationId"]
    return None

def is_blocked(item):
    """Check if item has blocked label."""
    content = item.get("content", {})
    labels = content.get("labels", {}).get("nodes", [])
    return any(l.get("name") == "blocked" for l in labels)

# Main
data = get_project_data()
if not data:
    print("エラー: プロジェクトデータを取得できませんでした")
    sys.exit(1)

project = data["data"]["user"]["projectV2"]
fields = project["fields"]["nodes"]
all_items = project["items"]["nodes"]

# Find target sprint
sprint, sprint_field_id = find_target_sprint(fields, SPRINT_FILTER)
if not sprint:
    print("エラー: 対象の Sprint が見つかりません")
    print("利用可能な Sprint:")
    for f in fields:
        if f and f.get("configuration", {}).get("iterations"):
            for it in f["configuration"]["iterations"]:
                print(f"  - {it['title']} ({it['startDate']})")
            for it in f["configuration"].get("completedIterations", []):
                print(f"  - {it['title']} ({it['startDate']}) [completed]")
    sys.exit(1)

# Calculate sprint end date
from datetime import timedelta
sprint_start = sprint["startDate"]
sprint_end = (datetime.strptime(sprint_start, "%Y-%m-%d") + timedelta(days=sprint["duration"])).strftime("%Y-%m-%d")

# Filter items for this sprint
sprint_items = [item for item in all_items if get_item_sprint_id(item) == sprint["id"]]

# Calculate stats
total = len(sprint_items)
status_counts = {}
priority_counts = {}
completed = 0
estimate_total = 0
estimate_completed = 0
blocked_items = []

for item in sprint_items:
    status = get_item_field(item, "Status") or "Unknown"
    priority = get_item_field(item, "Priority") or "Unset"
    estimate = get_item_field(item, "Estimate")

    status_counts[status] = status_counts.get(status, 0) + 1

    # Priority: extract P0-P4 prefix
    p_key = priority.split(" ")[0] if priority.startswith("P") else priority
    priority_counts[p_key] = priority_counts.get(p_key, 0) + 1

    if estimate:
        try:
            est_val = float(estimate)
            estimate_total += est_val
            if status == "Done":
                estimate_completed += est_val
        except (ValueError, TypeError):
            pass

    if status == "Done":
        completed += 1

    if is_blocked(item):
        content = item.get("content", {})
        blocked_items.append({
            "number": content.get("number", "-"),
            "title": content.get("title", "(Draft)"),
        })

# JSON output
if JSON_OUTPUT:
    report = {
        "sprint": sprint["title"],
        "period": {"start": sprint_start, "end": sprint_end},
        "summary": {
            "total": total,
            "completed": completed,
            "completion_rate": round(completed / total * 100, 1) if total > 0 else 0,
            "blocked": len(blocked_items),
        },
        "velocity": {
            "estimate_total": estimate_total,
            "estimate_completed": estimate_completed,
        },
        "status_breakdown": status_counts,
        "priority_distribution": priority_counts,
        "blocked_items": blocked_items,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    sys.exit(0)

# Text output
def bar(count, max_count, width=20):
    filled = int(count / max(max_count, 1) * width)
    return "█" * filled

print(f"Sprint Report: {sprint['title']}")
print(f"Period: {sprint_start} ~ {sprint_end}")
print()

completion_rate = round(completed / total * 100) if total > 0 else 0
in_progress = status_counts.get("開発中", 0) + status_counts.get("コードレビュー", 0)
not_started = total - completed - in_progress - len(blocked_items)

print("Summary:")
print(f"  Total items:      {total}")
print(f"  Completed (Done): {completed} ({completion_rate}%)")
print(f"  In Progress:      {in_progress}")
print(f"  Blocked:          {len(blocked_items)}")
print(f"  Not Started:      {max(0, not_started)}")
print()

print("Velocity:")
print(f"  Estimate total:   {estimate_total:.0f} points")
print(f"  Completed:        {estimate_completed:.0f} points")
print(f"  Velocity:         {estimate_completed:.0f} pts/sprint")
print()

if status_counts:
    max_count = max(status_counts.values())
    print("Status Breakdown:")
    for status, count in sorted(status_counts.items(), key=lambda x: -x[1]):
        print(f"  {status:<16} {bar(count, max_count):<22} {count}")
    print()

if priority_counts:
    print("Priority Distribution:")
    for p in ["P0", "P1", "P2", "P3", "P4", "Unset"]:
        if p in priority_counts:
            print(f"  {p}: {priority_counts[p]}")
    print()

if blocked_items:
    print("Blocked Items:")
    for b in blocked_items:
        print(f"  #{b['number']}: {b['title']}")
    print()
PYTHON_SCRIPT
