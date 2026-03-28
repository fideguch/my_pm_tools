# GitHub Project Manager

[English](README.en.md)

GitHub Projects V2 のPM支援スキル。環境構築・日常運用・Sprint分析・移行を統合サポート。

「Issue作って」「ステータス変えて」「Sprintレポート出して」— PMの日常操作を CLI で即実行。新規プロジェクトの一括構築から Jira/Linear からの移行まで対応。

## 3つのモード

| モード                 | 用途                                          | 主な操作                                                            |
| ---------------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| **Mode A: 環境構築**   | 新規プロジェクトのセットアップ                | 14ステータス・6ビュー・13ラベル・テンプレート・ワークフロー一括構築 |
| **Mode B: 日常運用** ★ | Issue/PR 作成、ステータス変更、バックログ管理 | `project-ops.sh` + 自然言語対話                                     |
| **Mode C: 分析**       | Sprint レポート、ベロシティ追跡               | `sprint-report.sh`                                                  |

### Lite モード（小〜中規模チーム向け）

`--lite` フラグで、1-3人チーム向けの簡素構成を構築できます:

```bash
./scripts/setup-all.sh <OWNER/REPO> <PROJECT_NUMBER> --lite
```

| 構成              | ステータス | ビュー | ラベル | 推奨チーム規模 |
| ----------------- | ---------- | ------ | ------ | -------------- |
| Lite              | 8          | 3      | 5      | 1-3人          |
| Full (デフォルト) | 14         | 6      | 13     | 4人以上        |

Lite → Full への移行はいつでも可能（`setup-all.sh` を `--lite` なしで再実行）。

初回起動時にプロジェクト状態を自動検出し、未構築なら Mode A、構築済みなら Mode B で起動します。プロジェクト情報は `.github-project-config.json` に保存され、2回目以降は即座に操作可能です。

## 前提条件

- `gh` CLI がインストール済み＆認証済み
- GitHub Classic PAT（`ghp_` トークン）— Fine-grained PAT は Projects V2 GraphQL API 非対応
- PAT スコープ: `project`, `repo`, `read:org`

## インストール

```bash
git clone git@github.com:fideguch/my_pm_tools.git
cd my_pm_tools
./install.sh    # ~/.claude/skills/github-project-manager/ にインストール
```

Claude Code または Devin で以下のように起動:

```
「Issue を作成して」「プロジェクト環境を構築して」「Sprint レポートを出して」
```

## クイックスタート

### 新規プロジェクト構築（Mode A）

```bash
./scripts/setup-all.sh <OWNER/REPO> <PROJECT_NUMBER>
```

### 日常運用（Mode B）

```bash
# Issue/PR をプロジェクトに追加
./scripts/project-ops.sh <OWNER> <NUMBER> add-issue <REPO> <ISSUE_NUM>
./scripts/project-ops.sh <OWNER> <NUMBER> add-pr <REPO> <PR_NUM>

# ステータス変更（カード移動）
./scripts/project-ops.sh <OWNER> <NUMBER> move <ITEM_ID> "開発中"

# Priority 設定
./scripts/project-ops.sh <OWNER> <NUMBER> set-priority <ITEM_ID> P1

# アイテム一覧
./scripts/project-ops.sh <OWNER> <NUMBER> list-items
```

### 分析・レポート（Mode C）

```bash
./scripts/sprint-report.sh <OWNER> <NUMBER>                    # 現在の Sprint
./scripts/sprint-report.sh <OWNER> <NUMBER> --sprint previous  # 前回の Sprint
./scripts/sprint-report.sh <OWNER> <NUMBER> --json             # JSON 出力
```

### 他ツールからの移行

```bash
./scripts/migrate-import.sh <OWNER/REPO> <NUMBER> export.csv --format jira     # Jira
./scripts/migrate-import.sh <OWNER/REPO> <NUMBER> export.csv --format linear   # Linear
./scripts/migrate-import.sh <OWNER/REPO> <NUMBER> export.csv --format notion   # Notion
./scripts/migrate-import.sh <OWNER/REPO> <NUMBER> tasks.csv --dry-run          # プレビュー
```

## 構築される環境

| 要素                   | 内容                                                                          |
| ---------------------- | ----------------------------------------------------------------------------- |
| **ステータス**         | 14段階（Icebox → Planning → Design → Dev → Release → Done）                   |
| **ビュー**             | 6種（Issues, Product Backlog, Sprint Board, Sprint Table, Roadmap, My Items） |
| **カスタムフィールド** | Priority (P0-P4), Sprint (1w Iteration), Estimate (Number), Target (Text)     |
| **ラベル**             | 13種（Type 6 + Area 4 + Ops 3）                                               |
| **テンプレート**       | Issue (feature/bug) + PR テンプレート                                         |
| **自動化**             | Built-in Workflows 5 + GitHub Actions 5                                       |

## スクリプト一覧

| スクリプト           | モード | 用途                                       |
| -------------------- | ------ | ------------------------------------------ |
| `setup-all.sh`       | A      | 全環境一括構築                             |
| `setup-labels.sh`    | A      | ラベル13種一括作成                         |
| `setup-fields.sh`    | A      | カスタムフィールド作成                     |
| `setup-status.sh`    | A      | Status 14オプション設定                    |
| `setup-views.sh`     | A      | 5ビュー作成                                |
| `setup-templates.sh` | A      | テンプレート＆ワークフロー自動配置         |
| `project-ops.sh`     | B      | Issue/PR追加・ステータス変更・Priority設定 |
| `migrate-import.sh`  | A      | Jira/Linear/Notion CSV 移行                |
| `sprint-report.sh`   | C      | Sprint レポート（ベロシティ・完了率）      |

## MCP Server

AI エージェント（Claude Code, GitHub Copilot 等）から MCP 経由でプロジェクト操作を実行できます。

### セットアップ

```bash
npm install && npm run build
```

Claude Desktop の設定 (`~/.claude/settings.json` または MCP 設定):

```json
{
  "mcpServers": {
    "github-project-manager": {
      "command": "node",
      "args": ["/path/to/my_pm_tools/dist/index.js"],
      "env": { "GITHUB_TOKEN": "ghp_..." }
    }
  }
}
```

### MCP ツール一覧

| ツール                     | 方式    | 説明                                                               |
| -------------------------- | ------- | ------------------------------------------------------------------ |
| `project_list_fields`      | GraphQL | フィールド・オプション一覧                                         |
| `project_list_items`       | GraphQL | アイテム一覧（ステータス/優先度フィルタ対応、ページネーション）    |
| `project_add_item`         | GraphQL | Issue/PR をプロジェクトに追加                                      |
| `project_move_status`      | GraphQL | ステータス変更（別名対応: "dev"→"開発中"）                         |
| `project_set_priority`     | GraphQL | 優先度設定（P0-P4）                                                |
| `project_sprint_report`    | GraphQL | Sprint レポート生成                                                |
| `project_get_issue`        | GraphQL | Issue 詳細取得（タイトル、本文、ラベル、アサイン、マイルストーン） |
| `project_edit_issue`       | gh CLI  | Issue のタイトル・本文を編集                                       |
| `project_manage_labels`    | gh CLI  | Issue のラベル追加・削除                                           |
| `project_manage_assignees` | gh CLI  | Issue のアサイン追加・削除                                         |
| `project_set_issue_state`  | gh CLI  | Issue のクローズ・リオープン                                       |

**ステータス別名**: `dev`→`開発中`、`review`→`コードレビュー`、`testing`→`テスト中` など。英語の省略形で日本語ステータスを操作可能。

## 連携スキル

| スキル                        | 説明                                         |
| ----------------------------- | -------------------------------------------- |
| **code-quality**              | ESLint + Prettier + Husky + lint-staged 導入 |
| **ci-cd-pipeline**            | GitHub Actions CI/CD 品質パイプライン        |
| **typescript-best-practices** | TypeScript 推奨設定 & ガイドライン           |
| **git-workflow**              | Conventional Commits & ブランチ戦略          |
| **project-setup-automation**  | GitHub Projects V2 環境自動構築              |

## ドキュメント

| ドキュメント                                        | 内容                                |
| --------------------------------------------------- | ----------------------------------- |
| **[運用ガイド (USAGE.md)](docs/USAGE.md)**          | 日常運用・ビュー・Sprint・移行・FAQ |
| **[ワークフロー定義](docs/workflow-definition.md)** | 14ステータスの詳細仕様              |
| **[ビュー設計](docs/view-design.md)**               | 6ビューの設定仕様                   |
| **[自動化ガイド](docs/automation-guide.md)**        | ワークフロー・スクリプトの設定手順  |

## 開発者向け

```bash
npm install
npm test            # リグレッションテスト (375件+)
npm run build       # MCP Server ビルド
npm run quality     # lint + typecheck + format:check
```

前提: Node.js 20+, ShellCheck（オプション）。詳細は [CONTRIBUTING.md](CONTRIBUTING.md) を参照。

## PM Tool Suite

このリポジトリは、Claude Code で PM ワークフローを自動化する5つのツールスイートの一部です。

| #   | Skill                 | Purpose                        | Repo                                                                                |
| --- | --------------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| 1   | **my_pm_tools**       | **GitHub Projects V2 管理**    | **this repo**                                                                       |
| 2   | requirements_designer | 要件定義 + Figma UI生成        | [fideguch/requirements_designer](https://github.com/fideguch/requirements_designer) |
| 3   | speckit-bridge        | 要件→仕様変換（品質ゲート≥70） | [fideguch/speckit-bridge](https://github.com/fideguch/speckit-bridge)               |
| 4   | pm-data-analysis      | GAFA品質データ分析             | [fideguch/pm_data_analysis](https://github.com/fideguch/pm_data_analysis)           |
| 5   | pm-ad-analysis        | 全自動広告運用（5チャネル）    | [fideguch/pm_ad_analysis](https://github.com/fideguch/pm_ad_analysis)               |

### Pipeline

```
requirements_designer → speckit-bridge → my_pm_tools (project tracking)
                              |
                    pm-data-analysis ← pm-ad-analysis
```

### Recommended Install Order

1. **my_pm_tools** (基盤 — GitHub Projects 環境構築)
2. **requirements_designer** (上流 — 要件定義)
3. **speckit-bridge** (変換 — 要件→仕様)
4. **pm-data-analysis** (分析 — データ駆動意思決定)
5. **pm-ad-analysis** (広告 — マルチチャネル最適化)

## License

ISC License. See [LICENSE](LICENSE) for details.
