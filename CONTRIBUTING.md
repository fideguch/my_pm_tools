# Contributing Guide

GitHub Project Manager への貢献ガイドです。

## 開発フロー

### 1. Issue の作成

- [機能要望テンプレート](/.github/ISSUE_TEMPLATE/feature_request.yml) または [バグ報告テンプレート](/.github/ISSUE_TEMPLATE/bug_report.yml) を使用
- テンプレートに沿って必要情報を入力

### 2. ブランチの作成

```bash
# 機能追加
git checkout -b feature/<issue番号>-<概要>

# バグ修正
git checkout -b fix/<issue番号>-<概要>

# リファクタリング
git checkout -b refine/<issue番号>-<概要>
```

### 3. コミットメッセージ

```
<type>: <概要> (#<issue番号>)

<詳細説明（任意）>
```

**type 一覧:**

- `feat`: 新機能
- `fix`: バグ修正
- `refine`: リファクタリング
- `docs`: ドキュメント
- `infra`: インフラ・CI/CD
- `test`: テスト追加・修正

### 4. Pull Request の作成

- [PR テンプレート](/.github/pull_request_template.md) に沿って記述
- `closes #XX` で関連 Issue を紐付け

### 5. PR 作成前のローカル検証

```bash
npm run quality    # lint + typecheck + format:check
npm test           # Playwright リグレッションテスト (375件)
```

両方パスしてから PR を作成してください。

### 6. コードレビュー

- 最低 1 名のレビュー承認が必要
- CI チェック（lint, typecheck, format:check, shellcheck, test）が全て通過している必要があります

### 7. マージ

- Squash merge を推奨
- マージ後、関連 Issue は自動的に「Done」に遷移

## Five-File Sync Rule

ラベル・ステータス・ビュー・フィールドを変更する際は、以下の5ファイルを同時に更新してください:

1. `SKILL.md` — モード・コマンドリファレンス
2. `README.md` — 概要テーブル・スクリプト一覧
3. `scripts/*.sh` — 自動化スクリプト
4. `docs/*.md` — 詳細ドキュメント
5. `tests/skill/*.spec.ts` — リグレッションテスト（structure, content, validation）

## 優先度

| 優先度 | 定義     | SLA          |
| ------ | -------- | ------------ |
| P0     | 即日着手 | 当日中       |
| P1     | 高       | 1〜3 営業日  |
| P2     | 中       | スプリント内 |
| P3     | 低       | 時間あれば   |
| P4     | 未定     | 保留中       |

## ラベル

### Type（種別）

- `feature` — 新機能追加
- `bug` — バグ修正
- `refine` — 改善・リファクタリング
- `infra` — インフラ・DevOps
- `docs` — ドキュメント
- `research` — 調査・技術検証

### Area（領域）

- `frontend` — フロントエンド関連
- `backend` — バックエンド関連
- `design` — デザイン関連
- `growth` — グロース施策

### Ops（運用）

- `blocked` — ブロッカーあり
- `needs-review` — レビュー必要
- `good-first-issue` — 初心者向け
