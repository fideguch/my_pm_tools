# Handoff: GitHub Project Manager v3.0.0

## 現在の状態

- **リポジトリ**: https://github.com/fideguch/my_pm_tools
- **リモート**: `git@github.com:fideguch/my_pm_tools.git` (SSH)
- **ブランチ**: main
- **最新コミット**: `ae0f32f` feat: add MCP Server — 6 tools for AI agent integration (ADR-007)
- **テスト**: 293 passed (3.4s)
- **品質**: lint + typecheck + format:check 全パス
- **ビルド**: `npm run build` 成功
- **評価スコア**: 3.53/5.00 → MCP 実装済み（再評価で 3.83+ 見込み）

## セッションで実施した作業

### Phase 8: MCP Server 実装（v3.0.0）— 今回のセッション

#### 8-0: 公開安全性監査

- リポジトリ全体のセキュリティ監査実施 → **A評価（安全）**
- `.gitignore` に `.env*` と `.claude/` を防御的に追加
- ハードコード秘密鍵: なし、個人情報: 公開 GitHub ユーザー名のみ

#### 8-1: North Star 矛盾の解決

- Non-Goals「Slack/Teams 連携の自前実装はしない」と P05-P08 の矛盾を発見
- **解決**: v1 = MCP core API 層のみ（North Star 尊重）、Slack/Google は v2 以降
- ADR-007 作成、DECISION-LOG 更新（P05/P06 を deferred に変更、P07/P08 を ADR-007 で実現）

#### 8-2: MCP Server 基盤構築

- 依存パッケージ: `@modelcontextprotocol/sdk` v1.28.0, `@octokit/graphql` v9, `zod` v4
- `tsconfig.build.json` 新規作成、`tsconfig.json` に `src/` 追加
- `src/types/index.ts` — 型定義（ProjectV2, FieldNode, ItemNode, SprintReport 等）
- `src/graphql/client.ts` — @octokit/graphql クライアント（GITHUB_TOKEN 認証）
- `src/graphql/queries.ts` — 4つの GraphQL クエリ（project-ops.sh/sprint-report.sh から移植）
- `src/graphql/mutations.ts` — 2つの GraphQL ミューテーション
- `src/schemas/index.ts` — 6つの Zod スキーマ
- `package.json` に `"type": "module"`, `bin`, `build` script 追加

#### 8-3: 6 MCP ツール実装

| ツール                  | ファイル                     | 元スクリプト                           |
| ----------------------- | ---------------------------- | -------------------------------------- |
| `project_list_fields`   | `src/tools/list-fields.ts`   | project-ops.sh `list-fields`           |
| `project_list_items`    | `src/tools/list-items.ts`    | project-ops.sh `list-items`            |
| `project_add_item`      | `src/tools/add-item.ts`      | project-ops.sh `add-issue/add-pr`      |
| `project_move_status`   | `src/tools/move-status.ts`   | project-ops.sh `move`                  |
| `project_set_priority`  | `src/tools/set-priority.ts`  | project-ops.sh `set-priority`          |
| `project_sprint_report` | `src/tools/sprint-report.ts` | sprint-report.sh (Python → TypeScript) |

- `src/tools/index.ts` — registerTool で6ツールを登録
- `src/server.ts` — McpServer ファクトリ（テスト用に分離）
- `src/index.ts` — stdio エントリポイント（shebang 付き）

#### 8-4: テスト追加（+62 テスト）

- `tests/mcp/schemas.spec.ts` — Zod スキーマ検証（17テスト）
- `tests/mcp/server.spec.ts` — サーバーライフサイクル（3テスト）
- `tests/mcp/tools/*.spec.ts` — 6ツール別テスト（GraphQL モック、27テスト）
- `tests/skill-structure.spec.ts` — MCP 構造検証セクション追加（15テスト）
- 既存テストの ESM 対応修正（`__dirname` → `fileURLToPath`）

#### 8-5: ドキュメント更新

- README.md / README.en.md — MCP Server セクション追加、テスト数更新
- CLAUDE.md — `src/` 構造追加、Tech Stack に MCP Server 追加、テスト数更新
- ADR-007 作成、DECISION-LOG 更新、MEMORY.md 更新

## メトリクス

| 指標           | v2.1.0          | v3.0.0                    |
| -------------- | --------------- | ------------------------- |
| テスト         | 231 件          | **293 件** (+62)          |
| スクリプト     | 9 本 (1,498 行) | 9 本 (1,498 行)           |
| MCP ツール     | 0               | **6 ツール**              |
| TypeScript src | 0 行            | **~800 行** (13 ファイル) |
| 総行数         | ~10,000 行      | **~12,400 行**            |
| ADR            | 6 件            | **7 件**                  |
| テスト実行時間 | 2.6 秒          | 3.4 秒                    |

## 次のセッションでやること

### 優先度 1: 評価スコア再計算

MCP Server 実装後のスコアを再評価する:

- AI Intelligence: 2.5 → 4.0 (MCP 経由で AI エージェントから操作可能に)
- Integration: 3.5 → 4.0 (MCP プロトコル対応)
- 目標: 3.53 → **3.83+**

### 優先度 2: バーンダウン + サイクルタイム（Analytics 強化）

- sprint-report.sh / sprint-report.ts にバーンダウンチャートデータ追加
- サイクルタイム（Issue オープン → Done の日数）計算
- 影響: Analytics 3.0 → 4.5、総合 +0.15

### 優先度 3: スクリプト動作 E2E テスト

- 現在のテストは構造/内容検証のみ
- setup-all.sh, project-ops.sh の実際の動作テスト（モック GitHub API）
- 影響: Maturity 3.5 → 4.5、総合 +0.10

### 優先度 4: CI/CD にビルドステップ追加

- `.github/workflows/ci.yml` に `npm run build` を追加
- MCP Server のビルド成功を CI で保証

### 将来検討（v2 以降）

- **Slack 連携** (P05): ADR-007 で deferred。MCP core 安定後に検討
- **Google Workspace 連携** (P06): 同上
- **npm パッケージ化** (P01): `npx github-project-manager` で MCP Server を起動
- **Streamable HTTP transport**: リモートクライアント対応
