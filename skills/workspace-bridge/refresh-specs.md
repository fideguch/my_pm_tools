# API Spec Update Protocol

## When to Update

### Reactive (on error)

API仕様の更新が必要なケース:

1. **HTTP 4xx/5xx エラーが新しいレスポンス形式を示す場合** — エンドポイントの仕様変更の可能性
2. **非推奨警告ヘッダー (`Deprecation`, `Sunset`) を受信した場合** — API バージョンの移行が必要
3. **フィールドが消えた、または新しいフィールドが出現した場合** — スキーマ変更の可能性

### Scheduled (monthly)

- GitHub Actions ワークフロー `monthly-api-check.yml` が毎月1日 09:00 UTC に実行
- 認証情報の安全性チェック（トークン漏洩の検出）
- 将来的に API チェンジログの自動チェックを追加予定

## How to Update

### Step 1: Fetch latest documentation

| Service         | Documentation URL                                          |
| --------------- | ---------------------------------------------------------- |
| Notion          | https://developers.notion.com/reference                    |
| Google Drive    | https://developers.google.com/drive/api/reference/rest/v3  |
| Google Sheets   | https://developers.google.com/sheets/api/reference/rest/v4 |
| Google Calendar | https://developers.google.com/calendar/api/v3/reference    |
| Gmail           | https://developers.google.com/gmail/api/reference/rest/v1  |

### Step 2: Update spec files

1. 該当する `api-specs/` のファイルを開く
2. エンドポイント、レスポンス構造、レート制限を最新に更新
3. 変更箇所にコメントで更新日を記録（例: `<!-- Updated: 2026-04-01 -->`）

### Step 3: Verify

1. 対象ツールのテストを実行: `npm test -- --grep "notion\|workspace"`
2. モックデータのレスポンス構造が最新 API と一致することを確認
3. 型定義 (`src/types/notion.ts`, `src/types/workspace.ts`) を必要に応じて更新

### Step 4: Commit

```bash
git add skills/workspace-bridge/api-specs/
git commit -m "docs: update workspace-bridge API specs (YYYY-MM)"
```

## CI Reference

- **Workflow**: `.github/workflows/monthly-api-check.yml`
- **Schedule**: 毎月1日 09:00 UTC
- **現在の機能**: 認証情報の安全性チェック（leaked token detection）
- **将来の機能**: API バージョンチェンジログの自動フェッチと差分通知
