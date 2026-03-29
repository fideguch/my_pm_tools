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

### Notion ツール（7種）

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
→ notion_query_database {
    databaseId: "...",
    filter: "{\"property\": \"Status\", \"status\": {\"equals\": \"完了\"}}"
  }
```

`filter` と `sorts` は JSON 文字列として渡します（Notion filter/sort 構文に準拠）。
カーソルベースのページネーションにより、自動的に最大 10 ページまで結果を取得します。

#### `notion_create_page`

新規ページを作成。

```
ユーザー: 「Notionにスプリント振り返りを書き出して」
→ notion_create_page {
    parentId: "...",
    parentType: "database",
    properties: "{\"Name\": {\"title\": [{\"text\": {\"content\": \"Sprint 5 振り返り\"}}]}}",
    content: "振り返り内容をここに記載..."
  }
```

`properties` は Notion プロパティ形式の JSON 文字列です。`content` はオプションで、プレーンテキストが段落ブロックとして追加されます。

#### `notion_append_blocks`

既存ページにブロックを追記。

```
ユーザー: 「Notionのページに議事録を追記して」
→ notion_append_blocks {
    blockId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    content: "追記したいテキスト内容"
  }
```

`blockId` はページ ID またはブロック ID です。`content` はプレーンテキストで、段落ブロックとして追加されます。

#### `notion_update_page`

既存ページのプロパティを更新。

```
ユーザー: 「Notionのタスクのステータスを完了に更新して」
→ notion_update_page {
    pageId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    properties: "{\"Status\": {\"status\": {\"name\": \"完了\"}}}"
  }
```

`properties` は Notion プロパティ形式の JSON 文字列です。更新するプロパティのみ指定し、未指定のプロパティは変更されません。

#### `notion_archive_page`

ページをアーカイブ（ソフトデリート）。

```
ユーザー: 「Notionの古いページをアーカイブして」
→ notion_archive_page {
    pageId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
```

アーカイブしたページは Notion の UI から復元できます。完全削除は行いません。

### Google Workspace ツール（9種）

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

#### `workspace_update_sheet`

スプレッドシートの指定セル範囲に値を書き込む。

```
ユーザー: 「スプシの B2 セルに Sprint 5 の完了数を書き込んで」
→ workspace_update_sheet {
    spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
    range: "Sheet1!B2",
    values: [[42]]
  }
```

`values` は 2次元配列（行×列）です。`valueInputOption` のデフォルトは `USER_ENTERED`（数式・日付を自動解釈）。

#### `workspace_append_sheet`

スプレッドシートに行を追加。既存データの末尾に自動的に追記される。

```
ユーザー: 「スプシにスプリント実績行を追記して」
→ workspace_append_sheet {
    spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
    range: "Sheet1!A:D",
    values: [["Sprint 5", "2026-03-28", 42, "完了"]]
  }
```

`range` はシート名のみ（例: `Sheet1!A:D`）でも指定可能。Sheets API が既存データの末尾を自動検出して追記します。

#### `workspace_create_event`

Google カレンダーにイベントを作成。

```
ユーザー: 「Sprint レビューを来週月曜に登録して」
→ workspace_create_event {
    calendarId: "primary",
    summary: "Sprint 5 レビュー",
    start: "2026-04-06T14:00:00+09:00",
    end: "2026-04-06T15:00:00+09:00",
    description: "Sprint 5 の成果発表とレトロスペクティブ",
    attendees: ["team@example.com"]
  }
```

`attendees` は省略可能。`start`/`end` は RFC 3339 形式（タイムゾーンオフセット付き推奨）。

---

## OAuth スコープ変更（v5.2）

Phase 1 Workspace Bridge Read+Write の追加に伴い、Google OAuth スコープが変更されました。

### スコープ変更一覧

| スコープ                                             | 変更前                 | 変更後       | 理由                               |
| ---------------------------------------------------- | ---------------------- | ------------ | ---------------------------------- |
| `https://www.googleapis.com/auth/spreadsheets`       | `.readonly` サブセット | フルアクセス | `update_sheet`/`append_sheet` 追加 |
| `https://www.googleapis.com/auth/calendar`           | `.readonly` サブセット | フルアクセス | `create_event` 追加                |
| `https://www.googleapis.com/auth/drive.readonly`     | — (変更なし)           | 変更なし     | 読み取りのみのまま                 |
| `https://www.googleapis.com/auth/documents.readonly` | — (変更なし)           | 変更なし     | 読み取りのみのまま                 |
| `https://www.googleapis.com/auth/gmail.readonly`     | — (変更なし)           | 変更なし     | 読み取りのみのまま                 |

### 既存ユーザーへの移行手順

既存の `GOOGLE_REFRESH_TOKEN` を使用している場合は、新しいスコープで再認証が必要です。

```bash
# 1. Google Cloud Console で OAuth クレデンシャルを確認
#    https://console.cloud.google.com/apis/credentials

# 2. 新しいスコープでリフレッシュトークンを再発行
#    OAuth 認証フローを再実行し、以下のスコープを要求:
#    - https://www.googleapis.com/auth/spreadsheets
#    - https://www.googleapis.com/auth/calendar
#    - https://www.googleapis.com/auth/drive.readonly
#    - https://www.googleapis.com/auth/documents.readonly
#    - https://www.googleapis.com/auth/gmail.readonly

# 3. 新しい GOOGLE_REFRESH_TOKEN を環境変数に設定
export GOOGLE_REFRESH_TOKEN="1//new-token-here"
```

> **注意**: 読み取り専用操作のみを使用する場合は、以前の `readonly` スコープのままでも動作します。書き込みツール（`workspace_update_sheet`, `workspace_append_sheet`, `workspace_create_event`）はフルスコープが必要です。

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

## レート制限

各サービスのレート制限と、クライアントの自動リトライ動作:

| サービス         | 制限                                   | リトライ動作                                               |
| ---------------- | -------------------------------------- | ---------------------------------------------------------- |
| **Notion API**   | 平均 3 リクエスト/秒                   | 429 レスポンス時、`Retry-After` ヘッダーに従い自動リトライ |
| **Google Drive** | 12,000 リクエスト/60秒                 | 指数バックオフで自動リトライ                               |
| **Gmail**        | 15,000 quota units/分                  | 指数バックオフで自動リトライ                               |
| **Sheets**       | 300 リクエスト/60秒（ユーザーあたり）  | 指数バックオフで自動リトライ                               |
| **Docs**         | 300 リクエスト/60秒（ユーザーあたり）  | 指数バックオフで自動リトライ                               |
| **Slides**       | 300 リクエスト/60秒（ユーザーあたり）  | 指数バックオフで自動リトライ                               |
| **Calendar**     | 500 リクエスト/100秒（ユーザーあたり） | 指数バックオフで自動リトライ                               |

- **NotionClient**: 429 ステータス受信時、`Retry-After` ヘッダーの値（秒）を待機してからリトライ。ヘッダーがない場合は 1 秒後にリトライ
- **GoogleClient**: すべての Google API で指数バックオフ（exponential backoff）を内蔵。初回 1 秒、最大 32 秒まで倍増。5xx エラーおよび 429 エラーで自動リトライ
- バッチ処理を行う場合は、クライアント側でもスロットリング（1 リクエスト/秒）を追加することを推奨

---

## セキュリティ注意事項

- **トークンをコードにハードコードしない** — 必ず環境変数を使用
- **`.env` ファイルを `.gitignore` に追加** — クレデンシャルの漏洩を防止
- **最小権限の原則** — Notion Integration や Google OAuth には必要最小限のスコープを設定
- **トークンローテーション** — 定期的にリフレッシュトークンを更新
