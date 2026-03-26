# Set Up GitHub Project

GitHub Projects V2 の開発環境を一括構築する Devin プレイブック＆スキル集。

14ステータスワークフロー、5ビュー構成、カスタムフィールド、ラベル13種、Issueテンプレート、PR テンプレート、GitHub Actions 自動化を一括セットアップします。

## 概要

このリポジトリは、GitHub Projects V2 のベストプラクティスに基づいた開発環境を、再現可能な形で構築するためのスキル・スクリプト・テンプレート集です。

### 構築される環境

| 要素 | 内容 |
|------|------|
| **ステータス** | 14段階（Icebox → Planning → Design → Dev → Release → Done） |
| **ビュー** | 5種（Product Backlog, Sprint Board, Sprint Table, Roadmap, My Items） |
| **カスタムフィールド** | Priority (P0-P4), Sprint (1w Iteration), Estimate (Number), Target (Text) |
| **ラベル** | 13種（Type 6 + Area 4 + Ops 3） |
| **テンプレート** | Issue (feature/bug) + PR テンプレート |
| **自動化** | Built-in Workflows 5 + GitHub Actions 5 |

## 前提条件

- `gh` CLI がインストール済み
- GitHub Classic PAT（`ghp_` トークン）が必要（Fine-grained PAT は Projects V2 GraphQL API 非対応）
- PAT スコープ: `project`, `repo`, `read:org`

## 使い方

### Devin プレイブックとして使用

Devin で `!setup_github_project` マクロを実行すると、プレイブックが起動し対話的に環境構築を進めます。

### スクリプトで直接実行

```bash
# ラベル一括作成
./scripts/setup-labels.sh <OWNER/REPO>

# 全環境一括構築（対話式）
./scripts/setup-all.sh <OWNER/REPO> <PROJECT_NUMBER>
```

## ファイル構成

```
set-up-github-project/
├── README.md                          # このファイル
├── SKILL.md                           # Devin プレイブック（メインロジック）
├── scripts/
│   ├── setup-labels.sh                # ラベル13種一括作成
│   ├── setup-fields.sh                # カスタムフィールド作成
│   ├── setup-views.sh                 # 5ビュー作成
│   └── setup-all.sh                   # 全環境一括構築
├── skills/
│   ├── code-quality/SKILL.md          # ESLint + Prettier + Husky + lint-staged 導入
│   ├── ci-cd-pipeline/SKILL.md        # GitHub Actions CI/CD 品質パイプライン構築
│   ├── typescript-best-practices/SKILL.md  # TypeScript ベストプラクティス & 初期設定
│   ├── git-workflow/SKILL.md          # Git ワークフロー & ブランチ戦略
│   └── project-setup-automation/SKILL.md   # GitHub Projects V2 環境自動構築
├── templates/
│   ├── ISSUE_TEMPLATE/
│   │   ├── feature_request.yml        # 機能要望テンプレート
│   │   └── bug_report.yml             # バグ報告テンプレート
│   ├── pull_request_template.md       # PR テンプレート
│   └── workflows/
│       ├── ci.yml                     # CI 品質チェック
│       ├── project-automation.yml     # Project 自動化
│       ├── pr-labeler.yml             # PR 自動ラベル
│       ├── stale-detection.yml        # 滞留タスク検知
│       └── roadmap-date-sync.yml      # Roadmap 日付同期
└── docs/
    ├── workflow-definition.md         # 14ステータスワークフロー定義書
    ├── view-design.md                 # 5ビュー設計書
    ├── automation-guide.md            # 自動化ガイド
    └── USAGE.md                       # プロジェクト運用ガイド
```

## コーディングスキル

プロジェクト環境構築で活用できる5つのスキルを同梱しています：

| スキル | 説明 |
|--------|------|
| **code-quality** | ESLint + Prettier + Husky + lint-staged の統合セットアップ。プロジェクトの技術スタックを自動検出し、最適な設定を生成 |
| **ci-cd-pipeline** | GitHub Actions を使った品質パイプライン構築。lint → typecheck → test → build の品質ゲートを自動実行 |
| **typescript-best-practices** | TypeScript の推奨 tsconfig、型安全コーディングガイドライン、テスト設定 |
| **git-workflow** | Conventional Commits、ブランチ命名規則、PR/Issue テンプレート、commitlint 設定 |
| **project-setup-automation** | GitHub Projects V2 の14ステータス・5ビュー・カスタムフィールド・ラベルを一括構築 |

## 14ステータスワークフロー

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Planning Phase       │  Design Phase        │  Dev Phase          │  Release Phase       │
│                       │                      │                     │                      │
│  Icebox               │  デザイン待ち          │  アサイン待ち         │  テスト中             │
│  進行待ち              │  デザイン作成中        │  開発待ち            │  テスト落ち           │
│  要件作成中            │                      │  開発中              │  リリース待ち         │
│                       │                      │  コードレビュー       │  リリース済み         │
│                       │                      │                     │  Done                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## ラベル一覧

| カテゴリ | ラベル | 色 | 説明 |
|---------|--------|-----|------|
| Type | `feature` | #0E8A16 | 新機能追加 |
| Type | `bug` | #D73A4A | バグ修正 |
| Type | `refine` | #FBCA04 | 改善・リファクタリング |
| Type | `infra` | #6F42C1 | インフラ・DevOps |
| Type | `docs` | #0075CA | ドキュメント |
| Type | `research` | #C5DEF5 | 調査・技術検証 |
| Area | `frontend` | #F9A825 | フロントエンド関連 |
| Area | `backend` | #795548 | バックエンド関連 |
| Area | `design` | #E91E8F | デザイン関連 |
| Area | `growth` | #2EA44F | グロース施策 |
| Ops | `blocked` | #000000 | ブロッカーあり |
| Ops | `needs-review` | #FEF2C0 | レビュー必要 |
| Ops | `good-first-issue` | #7057FF | 初心者向け |

## プロジェクト運用ガイド

GitHub Projects V2 で構築されたプロジェクト管理環境の詳細な運用方法は、以下のドキュメントを参照してください。

**[運用ガイド（USAGE.md）](docs/USAGE.md)** — ビューの使い方、ステータスワークフロー、Sprint運用、Roadmap活用、自動化ワークフローなど

## License

Private. All rights reserved.
