# GitHub Project Manager — 運用ガイド

GitHub Projects V2 の日常管理・環境構築・分析を統合的にサポートするスキルの運用ガイドです。

## 目次

- [はじめに（オンボーディング）](#はじめにオンボーディング)
- [日常運用](#日常運用)
  - [プロジェクトアイテムの操作](#プロジェクトアイテムの操作)
  - [Issueの作成と管理](#issueの作成と管理)
  - [PRワークフロー](#prワークフロー)
  - [Sprintの運用](#sprintの運用)
- [分析・レポート](#分析レポート)
- [Lite モード](#liteモード)
- [環境構築（新規プロジェクト）](#環境構築新規プロジェクト)
- [他ツールからの移行](#他ツールからの移行)
- [ビューの使い方](#ビューの使い方)
- [リファレンス](#リファレンス)
  - [14ステータスワークフロー](#14ステータスワークフロー)
  - [カスタムフィールド](#カスタムフィールド)
  - [ラベル体系](#ラベル体系)
  - [自動化ワークフロー](#自動化ワークフロー)
- [ベストプラクティス](#ベストプラクティス)
- [トラブルシューティング](#トラブルシューティング)

---

## はじめに（オンボーディング）

初回起動時に `.github-project-config.json` が生成されます。このファイルにプロジェクト情報（OWNER、REPO、プロジェクト番号、各種フィールドID）が保存され、以降の操作で自動的に使用されます。

**初回**: プロジェクト状態を自動検出し、未構築なら環境構築モード、構築済みなら日常運用モードで起動します。

**2回目以降**: `.github-project-config.json` を読み込み、即座に操作可能です。

---

## Lite モード

1-3人の小規模チーム向けに、簡素な構成でプロジェクトを構築できます。

```bash
./scripts/setup-all.sh owner/repo 1 --lite
```

| 構成              | ステータス | ビュー | ラベル |
| ----------------- | ---------- | ------ | ------ |
| Lite              | 8          | 3      | 5      |
| Full (デフォルト) | 14         | 6      | 13     |

**Lite → Full 移行**: `setup-all.sh` を `--lite` なしで再実行するだけで完了。

**移行インポート（Lite）**: `--lite` フラグでステータスマッピングを Lite 用に切り替え:

```bash
./scripts/migrate-import.sh owner/repo 1 export.csv --format jira --lite
```

---

## 日常運用

### プロジェクト概要

GitHub Projects V2 を活用した開発プロジェクト管理環境です。

**主な特徴:**

- 14段階のステータスで開発フロー全体を管理
- 6種類のビューで異なる視点からタスクを可視化
- Sprint（Iteration）ベースの反復開発をサポート
- GitHub Actions による自動化（ステータス遷移・日付同期・品質チェック）

---

## ビューの使い方

### 1. Issues（全体一覧）

| 項目           | 内容                                                                 |
| -------------- | -------------------------------------------------------------------- |
| レイアウト     | テーブル                                                             |
| 用途           | 全Issue/PRを一覧表示                                                 |
| 表示フィールド | Title, Assignees, Status, Labels, Priority, Estimate, Sprint, Target |

すべてのアイテムをフラットに表示するデフォルトビューです。フィルターや並び替えで必要なアイテムを素早く見つけられます。

### 2. Product Backlog（プロダクトバックログ）

| 項目           | 内容                                       |
| -------------- | ------------------------------------------ |
| レイアウト     | ボード（カンバン）                         |
| 用途           | ステータスごとのタスク管理                 |
| グループ化     | Status                                     |
| ソート         | Priority（昇順: P0が最上位）               |
| 表示フィールド | Labels, Priority, Estimate, Sprint, Target |

**使い方:**

- カードをドラッグ＆ドロップでステータスを変更
- P0（最優先）のタスクが上に表示される
- Sprint計画時にIceboxや進行待ちからタスクを選定

### 3. Sprint Board（スプリントボード）

| 項目           | 内容                                       |
| -------------- | ------------------------------------------ |
| レイアウト     | ボード（カンバン）                         |
| 用途           | 現在のSprintのタスク進捗管理               |
| フィルター     | 現在のSprintに割り当てられたアイテム       |
| 表示フィールド | Labels, Priority, Estimate, Sprint, Target |

**使い方:**

- デイリースタンドアップでチーム全体の進捗を確認
- 各ステータス列のカード数でボトルネックを特定
- WIPリミット（開発中: チーム人数x1.5、コードレビュー: 10、テスト中: 5）を意識

### 4. Sprint Table（スプリントテーブル）

| 項目           | 内容                                               |
| -------------- | -------------------------------------------------- |
| レイアウト     | テーブル                                           |
| 用途           | Sprintの詳細管理・見積もり管理                     |
| グループ化     | Assignees                                          |
| 表示フィールド | Status, Labels, Priority, Estimate, Sprint, Target |

**使い方:**

- 担当者ごとのタスク量を確認（Estimateの合計で負荷把握）
- Sprint計画ミーティングで見積もりを入力
- 担当者の偏りがないかチェック

### 5. Roadmap（ロードマップ）

| 項目           | 内容                                                |
| -------------- | --------------------------------------------------- |
| レイアウト     | タイムライン                                        |
| 用途           | 中長期のスケジュール可視化                          |
| 日付フィールド | Start date = Sprint start, Target date = Sprint end |
| ズームレベル   | 月単位                                              |

**使い方:**

- Sprintの開始日〜終了日が青いバーでタイムライン上に表示
- 複数Sprintにまたがるタスクの全体像を把握
- マイルストーンの進捗を俯瞰的に確認

### 6. My Items（マイアイテム）

| 項目           | 内容                                               |
| -------------- | -------------------------------------------------- |
| レイアウト     | テーブル                                           |
| 用途           | 自分に割り当てられたタスクの管理                   |
| フィルター     | `assignee:@me is:open`                             |
| 表示フィールド | Status, Labels, Priority, Estimate, Sprint, Target |

**使い方:**

- 毎朝確認して今日取り組むタスクを決定
- 自分のタスクの優先度・期限を一目で把握
- Sprintごとの自分の作業量を管理

---

## カスタムフィールド

### Status（ステータス）

14段階のステータスで開発プロセス全体を管理します。詳細は[14ステータスワークフロー](#14ステータスワークフロー)を参照。

### Priority（優先度）

| 値            | 意味               | SLA目安          |
| ------------- | ------------------ | ---------------- |
| P0 - 即日着手 | 緊急・ブロッカー   | 即日対応         |
| P1 - 高       | 重要・早急に対応   | 1〜3営業日       |
| P2 - 中       | 通常の優先度       | 現スプリント内   |
| P3 - 低       | 時間があれば対応   | 次スプリント以降 |
| P4 - 未定     | 優先度未決定・保留 | 検討中           |

### Estimate（見積もり）

ストーリーポイントまたは時間（数値）で作業量を表現します。

| 値  | 目安                          |
| --- | ----------------------------- |
| 1   | 数時間で完了する小タスク      |
| 2   | 半日〜1日の作業               |
| 3   | 1〜2日の作業                  |
| 5   | 2〜3日の作業                  |
| 8   | 1週間程度の作業（分割を検討） |
| 13  | 1週間以上（必ず分割すること） |

### Sprint（スプリント）

1週間単位の反復サイクルです。Iteration フィールドとして設定されており、開始日と終了日を持ちます。

### Target（ターゲット）

リリースバージョンやマイルストーン名を自由テキストで入力します。例: `v1.0`, `MVP`, `Phase 2`

---

## 14ステータスワークフロー

### ステータス一覧

```
Planning phase:
  1. Icebox          — will do someday, not now
  2. 進行待ち         — prioritized but not started
  3. 要件作成中       — writing requirements / specs

Design phase:
  4. デザイン待ち     — waiting for designer assignment
  5. デザイン作成中   — creating UI/UX design

Dev phase:
  6. アサイン待ち     — waiting for developer assignment
  7. 開発待ち         — assigned but not started
  8. 開発中           — implementation in progress
  9. コードレビュー   — PR review pending / in progress

Release phase:
  10. テスト中        — QA testing in progress
  11. テスト落ち      — test failed, needs fix
  12. リリース待ち    — waiting for release approval
  13. リリース済み    — deployed to production

Done:
  14. Done            — fully completed and closed
```

### 遷移フロー

```
Icebox -> 進行待ち -> 要件作成中 -> デザイン待ち -> デザイン作成中
  -> アサイン待ち -> 開発待ち -> 開発中 -> コードレビュー
  -> テスト中 -> リリース待ち -> リリース済み -> Done
               ^
           テスト落ち -> 開発中 (fix and re-test)
```

**スキップルール:** デザイン不要なIssueは「要件作成中」->「アサイン待ち」へ直接遷移可能

### WIPリミット

| ステータス     | 上限             |
| -------------- | ---------------- |
| 開発中         | チーム人数 x 1.5 |
| コードレビュー | 10               |
| テスト中       | 5                |

---

## ラベル体系

### タイプラベル（Type）

| ラベル     | 色   | 説明                   |
| ---------- | ---- | ---------------------- |
| `feature`  | 緑   | 新機能追加             |
| `bug`      | 赤   | バグ修正               |
| `refine`   | 黄   | 改善・リファクタリング |
| `infra`    | 紫   | インフラ・DevOps       |
| `docs`     | 青   | ドキュメント           |
| `research` | 水色 | 調査・技術検証         |

### エリアラベル（Area）

| ラベル     | 色       | 説明               |
| ---------- | -------- | ------------------ |
| `frontend` | オレンジ | フロントエンド関連 |
| `backend`  | 茶       | バックエンド関連   |
| `design`   | ピンク   | デザイン関連       |
| `growth`   | 緑       | グロース施策       |

### 運用ラベル（Ops）

| ラベル             | 色       | 説明           |
| ------------------ | -------- | -------------- |
| `blocked`          | 黒       | ブロッカーあり |
| `needs-review`     | クリーム | レビュー必要   |
| `good-first-issue` | 紫       | 初心者向け     |

---

## Issueの作成と管理

### Issue テンプレート

2種類のテンプレートが用意されています:

#### Bug Report（バグ報告）

```
タイトル: [Bug] 具体的なバグの概要
```

テンプレートに従い、再現手順・期待動作・実際の動作・環境情報を記入してください。

#### Feature Request（機能リクエスト）

```
タイトル: [Feature] 機能の概要
```

テンプレートに従い、背景・提案内容・受け入れ基準を記入してください。

### Issue作成のベストプラクティス

1. **タイトル**: `[Type] 具体的で簡潔な説明` の形式
2. **ラベル**: Typeラベル + Areaラベルを必ず付与
3. **Priority**: 作成時に設定（不明なら P4）
4. **Estimate**: Sprint計画時に設定
5. **Sprint**: Sprint計画ミーティングで割り当て
6. **Assignees**: アサイン待ちステータスで割り当て

---

## プロジェクトアイテムの操作

### CLI でのアイテム操作

`scripts/project-ops.sh` を使って、コマンドラインから直接プロジェクトを操作できます。

```bash
# Issue をプロジェクトに追加
./scripts/project-ops.sh <OWNER> <PROJECT_NUMBER> add-issue <REPO> <ISSUE_NUMBER>

# PR をプロジェクトに追加
./scripts/project-ops.sh <OWNER> <PROJECT_NUMBER> add-pr <REPO> <PR_NUMBER>

# アイテム一覧表示（Item ID 確認用）
./scripts/project-ops.sh <OWNER> <PROJECT_NUMBER> list-items

# ステータス変更（カード移動）
./scripts/project-ops.sh <OWNER> <PROJECT_NUMBER> move <ITEM_ID> "開発中"

# Priority 設定
./scripts/project-ops.sh <OWNER> <PROJECT_NUMBER> set-priority <ITEM_ID> P1

# フィールドID一覧（設定確認用）
./scripts/project-ops.sh <OWNER> <PROJECT_NUMBER> list-fields
```

### GitHub UI でのアイテム操作

- **Issue/PR 追加**: プロジェクトページ → `+ Add item` → リポジトリから検索
- **ステータス変更**: ボードビューでカードをドラッグ＆ドロップ、またはテーブルビューでセル直接編集
- **Priority/Sprint 設定**: テーブルビューの各セルをクリックして選択

---

## PRワークフロー

### PR作成

1. Issueに基づいてブランチを作成
2. 実装が完了したらPRを作成
3. PR本文に `closes #<Issue番号>` を含める（自動ステータス遷移のため）

### PRテンプレート

リポジトリに設定されたPRテンプレートに従い、以下を記入:

- 変更概要
- 関連Issue（`closes #XX`）
- テスト内容
- レビューポイント

### 自動ステータス遷移

| イベント       | ステータス変更                  |
| -------------- | ------------------------------- |
| PR作成時       | 関連Issue -> 「コードレビュー」 |
| レビュー承認時 | 関連Issue -> 「テスト中」       |
| PRマージ時     | 関連Issue -> 「Done」           |

---

## Sprintの運用

### Sprint設定

- **サイクル**: 1週間（月曜開始〜日曜終了）
- **フィールド**: Sprint（Iteration型）

### Sprint計画ミーティング

1. Product Backlog ビューで優先度順にタスクを確認
2. Sprint Table ビューで担当者ごとのキャパシティを確認
3. Estimate を入力してベロシティに基づきタスクを選定
4. Sprint フィールドに現在のSprintを割り当て

### Sprint中の運用

1. **毎朝**: My Items ビューで自分のタスクを確認
2. **デイリー**: Sprint Board ビューでチーム全体の進捗を確認
3. **ブロッカー発生時**: `blocked` ラベルを付与してチームに共有
4. **Sprint終了時**: Sprint Table でEstimate合計を確認し、ベロシティを記録

### Sprint振り返り

- 完了タスク数 / 予定タスク数
- ベロシティ（完了したEstimate合計）
- テスト落ち率
- ブロッカー発生回数

---

## Roadmapの活用

### 日付表示の仕組み

Roadmapビューでは、Sprint（Iteration）フィールドの開始日・終了日が自動的にタイムラインのバーとして表示されます。

**設定:**

- Start date -> Sprint start（Sprintの開始日）
- Target date -> Sprint end（Sprintの終了日）

### 日付同期ワークフロー

`roadmap-date-sync.yml` GitHub Action が以下のタイミングで実行されます:

| トリガー                      | 説明                 |
| ----------------------------- | -------------------- |
| 手動実行（workflow_dispatch） | 全アイテムの一括同期 |
| 定期実行（毎日 9:00 UTC）     | 日次の自動同期       |
| Issue/PR イベント             | 変更時の即座の同期   |

### Roadmapの見方

- **青いバー**: Sprint期間（開始日〜終了日）
- **バーの長さ**: タスクが割り当てられたSprintの期間
- **ズームレベル**: 月単位（必要に応じて週単位に切替可能）

---

## 他ツールからの移行

### Jira からの移行

1. Jira で対象プロジェクトを開く
2. Filters → Advanced Search → Export → CSV (Current fields)
3. 移行スクリプトを実行:

```bash
./scripts/migrate-import.sh <OWNER/REPO> <PROJECT_NUMBER> jira-export.csv --format jira
```

**ステータスマッピング:** To Do→進行待ち, In Progress→開発中, In Review→コードレビュー, Done→Done

**Priorityマッピング:** Highest/Critical→P0, High→P1, Medium→P2, Low→P3, Lowest→P4

### Linear からの移行

1. Linear Settings → Export → CSV
2. 移行スクリプトを実行:

```bash
./scripts/migrate-import.sh <OWNER/REPO> <PROJECT_NUMBER> linear-export.csv --format linear
```

### Notion からの移行

1. Notion データベースを開く → `...` → Export → CSV
2. 移行スクリプトを実行:

```bash
./scripts/migrate-import.sh <OWNER/REPO> <PROJECT_NUMBER> notion-export.csv --format notion
```

### 汎用 CSV

最低限 `Title` 列があれば任意の CSV をインポート可能:

```bash
./scripts/migrate-import.sh <OWNER/REPO> <PROJECT_NUMBER> tasks.csv --format generic --dry-run
```

`--dry-run` で事前プレビューし、マッピングを確認してから実行してください。

---

## Sprint レポート

Sprint 完了時のベロシティ・完了率・ブロッカー統計を自動生成:

```bash
# 現在の Sprint
./scripts/sprint-report.sh <OWNER> <PROJECT_NUMBER>

# 前回の Sprint
./scripts/sprint-report.sh <OWNER> <PROJECT_NUMBER> --sprint previous

# 特定の Sprint
./scripts/sprint-report.sh <OWNER> <PROJECT_NUMBER> --sprint "Sprint 2026-W13"

# JSON 出力（CI/Notion/Slack 連携用）
./scripts/sprint-report.sh <OWNER> <PROJECT_NUMBER> --json
```

### レポートの見方

| 項目             | 説明                                                                    |
| ---------------- | ----------------------------------------------------------------------- |
| Velocity         | 完了した Estimate ポイント合計。Sprint 計画の基準値として使用           |
| Completion Rate  | 完了アイテム数 / 全アイテム数。80%以上が健全                            |
| Blocked Items    | `blocked` ラベル付きアイテム。Sprint 中に0が理想                        |
| Status Breakdown | 各ステータスのアイテム数。「開発中」に偏りがあればWIPリミット超過の兆候 |

### ベロシティ追跡のベストプラクティス

- 毎 Sprint 終了時にレポートを生成し、ベロシティを記録
- 直近3-5 Sprint の平均ベロシティで次 Sprint の計画を立てる
- ベロシティの80%を Sprint 計画の上限とする

---

## 自動化ワークフロー

### 1. CI Quality Check (`ci.yml`)

PRの品質チェックを自動実行します。

| チェック項目 | コマンド               |
| ------------ | ---------------------- |
| Lint         | `npm run lint`         |
| Type Check   | `npm run typecheck`    |
| Format Check | `npm run format:check` |
| Build        | `npm run build`        |

### 2. PR Labeler (`pr-labeler.yml`)

PRの変更内容に基づいてラベルを自動付与します。

### 3. Project Automation (`project-automation.yml`)

PR操作に連動してIssueのステータスを自動変更します。

| イベント     | アクション                  |
| ------------ | --------------------------- |
| PR作成       | 関連Issue -> コードレビュー |
| レビュー承認 | 関連Issue -> テスト中       |
| PRマージ     | 関連Issue -> Done           |

### 4. Stale Detection (`stale-detection.yml`)

同一ステータスで5日以上滞留しているIssueを検出し、通知します（毎週月曜 9:00 UTC）。

### 5. Roadmap Date Sync (`roadmap-date-sync.yml`)

Sprint（Iteration）フィールドの日付情報を確認し、Roadmapビューとの整合性をチェックします。

**前提**: `PROJECT_TOKEN` シークレットに Classic PAT を設定

### Built-in Workflows（プロジェクト組み込み）

| ワークフロー        | 動作                                   |
| ------------------- | -------------------------------------- |
| Auto-add to project | Issue/PR作成時にプロジェクトへ自動追加 |
| Auto-archive        | クローズ後14日で自動アーカイブ         |
| Item closed         | Issue/PRクローズ時 -> Done             |
| Item reopened       | Issue/PR再オープン時 -> 進行待ち       |
| PR merged           | PRマージ時 -> Done                     |

---

## ベストプラクティス

### Issue管理

- 1つのIssueには1つの責務（大きすぎるIssueは分割する）
- Estimate 8以上のタスクは必ず子Issueに分割
- `blocked` ラベルを付けたら、ブロッカーの理由をコメントに記載
- 完了条件（受け入れ基準）をIssue本文に明記

### PR管理

- PRタイトルは `feat:`, `fix:`, `docs:`, `refactor:` などの[Conventional Commits](https://www.conventionalcommits.org/)に準拠
- `closes #XX` で関連Issueを紐付け（自動ステータス遷移）
- 1つのPRは1つのIssueに対応（複数Issue修正は避ける）
- レビュー依頼前にセルフレビューを実施

### Sprint運用

- Sprint計画では、前回ベロシティの80%を目標に設定
- 未完了タスクは次Sprintに持ち越し、Priorityを再評価
- Sprint中のスコープ変更は最小限に
- 毎Sprint終了時に振り返り（KPT）を実施

### コード品質

- ESLint + Prettier でコードスタイルを統一
- Husky + lint-staged でコミット時に自動チェック
- TypeScript strict mode でコンパイルエラーをゼロに維持
- CIが通らないPRはマージしない

---

## トラブルシューティング

### よくある問題

#### Q: Issueがプロジェクトに追加されない

**A:** Built-in Workflow の "Auto-add to project" が有効になっているか確認してください。Settings -> Workflows から確認・有効化できます。

#### Q: PRを作成してもステータスが変わらない

**A:** PR本文に `closes #XX` 形式でIssue番号を記載しているか確認してください。また、`PROJECT_TOKEN` シークレットが正しく設定されているか確認してください。

#### Q: Roadmapにバーが表示されない

**A:** アイテムにSprintが割り当てられているか確認してください。Roadmapビューの Date fields 設定で "Sprint start" と "Sprint end" が選択されていることも確認してください。

#### Q: 滞留検知の通知が来ない

**A:** `stale-detection.yml` は毎週月曜 9:00 UTC に実行されます。手動で実行する場合は Actions タブから workflow_dispatch で実行してください。

---

## 参考リンク

- [GitHub Projects V2 ドキュメント](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [GitHub Actions ドキュメント](https://docs.github.com/en/actions)
- [Conventional Commits](https://www.conventionalcommits.org/)
