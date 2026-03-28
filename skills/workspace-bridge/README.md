# Workspace Bridge

## 概要

GitHub Project Manager に Notion と Google Workspace の連携機能を提供するスキルです。11の MCP ツールを通じて、外部ドキュメントやデータソースとプロジェクト管理ワークフローを橋渡しします。

## 対応サービス

### Notion（5ツール）

- **検索**: ワークスペース内のページ・データベースをタイトルで検索
- **ページ取得**: ページ内容を Markdown 形式で取得（再帰ブロック取得対応）
- **データベースクエリ**: フィルタ・ソート条件付きでデータベースを検索
- **ページ作成**: データベースまたはページ配下に新規ページを作成
- **ブロック追加**: 既存ページにパラグラフブロックを追記

### Google Workspace（6ツール）

- **Drive 検索**: クエリと MIME タイプでファイルを検索
- **Docs 取得**: Google Docs を Markdown としてエクスポート
- **Sheets 取得**: スプレッドシートの指定範囲をヘッダー＋行データで取得
- **Slides 取得**: Google Slides をプレーンテキストとしてエクスポート
- **Calendar イベント一覧**: 時間範囲フィルタ付きでイベントを一覧
- **Gmail 検索**: メール検索とメタデータ（件名、差出人、日付、スニペット）取得

## セットアップ

### Notion

1. https://www.notion.so/my-integrations でインテグレーションを作成
2. Internal Integration Token をコピー
3. 環境変数を設定:
   ```bash
   export NOTION_TOKEN="ntn_xxxxxxxxxxxxx"
   ```
4. 対象のページ・データベースにインテグレーションを共有

### Google Workspace

1. Google Cloud Console で OAuth 2.0 認証情報を作成
2. Drive, Sheets, Calendar, Gmail の API を有効化
3. OAuth フローでリフレッシュトークンを取得
4. 環境変数を設定:
   ```bash
   export GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
   export GOOGLE_CLIENT_SECRET="GOCSPX-xxxxx"
   export GOOGLE_REFRESH_TOKEN="1//xxxxx"
   ```

## API 仕様リファレンス

各サービスの API 仕様は `api-specs/` ディレクトリに整理されています:

| ファイル                       | 内容                   |
| ------------------------------ | ---------------------- |
| `api-specs/notion.md`          | Notion API v1          |
| `api-specs/google/drive.md`    | Google Drive API v3    |
| `api-specs/google/sheets.md`   | Google Sheets API v4   |
| `api-specs/google/calendar.md` | Google Calendar API v3 |
| `api-specs/google/gmail.md`    | Gmail API v1           |

仕様更新プロトコルは `refresh-specs.md` を参照してください。

## 関連ドキュメント

- [SKILL.md](./SKILL.md) — スキル定義（ツール一覧、使用例）
- [refresh-specs.md](./refresh-specs.md) — API 仕様更新プロトコル
