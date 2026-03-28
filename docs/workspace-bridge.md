# Workspace Bridge — Notion + Google Workspace 連携

## 概要

Workspace Bridge は、GitHub Projects V2 の管理に加えて、Notion と Google Workspace のデータを MCP 経由で読み書きする統合機能です。PM の日常業務で使う外部ツールのデータを、プロジェクト管理フローにシームレスに組み込みます。

### 対応サービス

| カテゴリ   | サービス                                     |
| ---------- | -------------------------------------------- |
| **Notion** | ページ、データベース、ブロック               |
| **Google** | Drive, Docs, Sheets, Slides, Calendar, Gmail |

---

## セットアップ

### Notion API

1. [Notion Integrations](https://www.notion.so/my-integrations) で Internal Integration を作成
2. トークンを環境変数に設定:

```bash
export NOTION_TOKEN="ntn_xxxxxxxxxxxxxxxxxxxxx"
```

3. 対象のページ・データベースで Integration を「コネクトに追加」する

### Google Workspace API

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. 必要な API を有効化:
   - Google Drive API
   - Google Sheets API
   - Google Docs API
   - Google Slides API
   - Google Calendar API
   - Gmail API
3. OAuth 2.0 クレデンシャルを作成し、認証を完了:

```bash
export GOOGLE_CLIENT_ID="xxxxxxxxxxxx.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxx"
export GOOGLE_REFRESH_TOKEN="1//xxxxxxxxxxxxx"
```

### MCP 設定

Claude Desktop または Claude Code の MCP 設定に追加:

```json
{
  "mcpServers": {
    "github-project-manager": {
      "command": "node",
      "args": ["/path/to/my_pm_tools/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_...",
        "NOTION_TOKEN": "ntn_...",
        "GOOGLE_CLIENT_ID": "...",
        "GOOGLE_CLIENT_SECRET": "...",
        "GOOGLE_REFRESH_TOKEN": "..."
      }
    }
  }
}
```

---

## ツールリファレンス

### Notion ツール（5種）

#### `notion_search`

Notion ワークスペース内のページとデータベースを検索。

```
ユーザー: 「Notionで要件定義を検索して」
→ notion_search { query: "要件定義" }
```

#### `notion_get_page`

指定ページの内容を Markdown 形式で取得。

```
ユーザー: 「Notionのページを読んで」
→ notion_get_page { pageId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }
```

#### `notion_query_database`

データベースをフィルタ・ソート付きでクエリ。

```
ユーザー: 「NotionのDBからステータスが完了のものを取得して」
→ notion_query_database { databaseId: "...", filter: { property: "Status", status: { equals: "完了" } } }
```

#### `notion_create_page`

新規ページを作成。

```
ユーザー: 「Notionにスプリント振り返りを書き出して」
→ notion_create_page { parentId: "...", title: "Sprint 5 振り返り", content: "..." }
```

#### `notion_append_blocks`

既存ページにブロックを追記。

```
ユーザー: 「Notionのページに議事録を追記して」
→ notion_append_blocks { pageId: "...", blocks: [...] }
```

### Google Workspace ツール（6種）

#### `workspace_search_drive`

Google Drive 内のファイルを検索。

```
ユーザー: 「Driveでプロジェクト計画書を検索して」
→ workspace_search_drive { query: "プロジェクト計画書" }
```

#### `workspace_get_doc`

Google ドキュメントの内容を Markdown 形式で取得。

```
ユーザー: 「Googleドキュメントを読んで」
→ workspace_get_doc { documentId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" }
```

#### `workspace_get_sheet`

スプレッドシートのデータを取得。シート名・範囲指定可能。

```
ユーザー: 「スプシのデータを取得して」
→ workspace_get_sheet { spreadsheetId: "...", range: "Sheet1!A1:D100" }
```

#### `workspace_get_slides`

Google スライドのテキスト内容を抽出。

```
ユーザー: 「プレゼン資料を読んで」
→ workspace_get_slides { presentationId: "..." }
```

#### `workspace_list_events`

Google カレンダーのイベントを取得。期間指定可能。

```
ユーザー: 「今週のカレンダーの予定を確認して」
→ workspace_list_events { calendarId: "primary", timeMin: "2026-03-28T00:00:00Z", timeMax: "2026-04-04T00:00:00Z" }
```

#### `workspace_search_gmail`

Gmail を検索。Gmail の検索構文をサポート。

```
ユーザー: 「メールでリリースノートを検索して」
→ workspace_search_gmail { query: "subject:リリースノート after:2026/03/01" }
```

---

## トラブルシューティング

| 問題                         | 解決策                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------ |
| Notion API 認証エラー        | `NOTION_TOKEN` が正しいか確認。対象ページで Integration が接続されているか確認 |
| Notion ページが見つからない  | Integration がページに「コネクトに追加」されているか確認                       |
| Google API 認証エラー        | `GOOGLE_REFRESH_TOKEN` の有効期限を確認。`gcloud auth` で再認証                |
| Google API が有効でない      | Cloud Console で対象 API が有効化されているか確認                              |
| スプレッドシートの範囲エラー | `range` パラメータの書式を確認（例: `Sheet1!A1:D100`）                         |
| Gmail 検索結果が空           | Gmail 検索構文を確認。`from:`, `subject:`, `after:` 等のオペレータを使用       |
| レートリミット               | 短時間に大量のリクエストを避ける。バッチ処理にはスロットリングを追加           |

---

## セキュリティ注意事項

- **トークンをコードにハードコードしない** — 必ず環境変数を使用
- **`.env` ファイルを `.gitignore` に追加** — クレデンシャルの漏洩を防止
- **最小権限の原則** — Notion Integration や Google OAuth には必要最小限のスコープを設定
- **トークンローテーション** — 定期的にリフレッシュトークンを更新
