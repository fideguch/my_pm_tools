# Git ワークフロー & ブランチ戦略スキル

## メタデータ

- **トリガー**: 「Gitワークフロー設定」「ブランチ戦略」「Git運用ルール」「コミット規約」
- **前提条件**: Git リポジトリが初期化済み

## 概要

チーム開発に最適な Git ワークフロー（GitHub Flow ベース）とコミット規約を設定するスキル。
Conventional Commits、ブランチ命名規則、PR テンプレートを一括整備する。

---

## Phase 1: ブランチ戦略

### 1.1 GitHub Flow（推奨）

```
main（本番）
  ├── feature/add-login-page
  ├── fix/user-validation-error
  ├── refactor/api-layer
  └── docs/update-readme
```

### 1.2 ブランチ命名規則

| プレフィックス | 用途             | 例                              |
| -------------- | ---------------- | ------------------------------- |
| `feature/`     | 新機能           | `feature/user-authentication`   |
| `fix/`         | バグ修正         | `fix/login-redirect-loop`       |
| `refactor/`    | リファクタリング | `refactor/api-error-handling`   |
| `docs/`        | ドキュメント     | `docs/api-reference`            |
| `infra/`       | インフラ         | `infra/ci-pipeline`             |
| `test/`        | テスト追加       | `test/payment-integration`      |
| `hotfix/`      | 緊急修正         | `hotfix/security-vulnerability` |

---

## Phase 2: Conventional Commits

### 2.1 コミットメッセージ形式

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### 2.2 Type 一覧

| Type       | 説明                               | SemVer |
| ---------- | ---------------------------------- | ------ |
| `feat`     | 新機能                             | MINOR  |
| `fix`      | バグ修正                           | PATCH  |
| `docs`     | ドキュメント                       | -      |
| `style`    | フォーマット変更（動作に影響なし） | -      |
| `refactor` | リファクタリング                   | -      |
| `perf`     | パフォーマンス改善                 | -      |
| `test`     | テスト追加・修正                   | -      |
| `build`    | ビルド関連                         | -      |
| `ci`       | CI/CD変更                          | -      |
| `chore`    | その他の変更                       | -      |

### 2.3 例

```
feat(auth): ソーシャルログイン機能を追加

Google OAuth 2.0 による認証フローを実装。
セッション管理にJWTを使用。

Closes #123
```

### 2.4 commitlint 設定（オプション）

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore'],
    ],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
  },
};
```

Husky に commit-msg フックを追加:

```bash
echo 'npx --no -- commitlint --edit "$1"' > .husky/commit-msg
```

---

## Phase 3: PR テンプレート

### 3.1 `.github/pull_request_template.md`

```markdown
## 概要

<!-- 変更の概要を1-2文で -->

## 関連Issue

<!-- closes #XXX -->

## 変更種別

- [ ] 新機能 (feat)
- [ ] バグ修正 (fix)
- [ ] リファクタリング (refactor)
- [ ] ドキュメント (docs)
- [ ] インフラ (infra)
- [ ] テスト (test)

## 変更内容

<!-- 具体的な変更内容を箇条書きで -->

## テスト

- [ ] 新規テスト追加
- [ ] 既存テスト通過
- [ ] 手動テスト実施

## レビュー観点

<!-- レビュアーに注目してほしい点 -->

## スクリーンショット

<!-- UI変更がある場合 -->
```

---

## Phase 4: Issue テンプレート

### 4.1 機能要望テンプレート（`.github/ISSUE_TEMPLATE/feature_request.yml`）

```yaml
name: 機能要望
description: 新しい機能やの改善提案
labels: ['feature']
body:
  - type: textarea
    id: summary
    attributes:
      label: 概要
      description: 機能の概要を説明してください
    validations:
      required: true
  - type: textarea
    id: motivation
    attributes:
      label: 背景・動機
      description: なぜこの機能が必要ですか？
    validations:
      required: true
  - type: textarea
    id: solution
    attributes:
      label: 提案する解決策
      description: どのように実装すべきですか？
  - type: dropdown
    id: priority
    attributes:
      label: 優先度
      options:
        - P0 - 即日着手
        - P1 - 高 (1〜3営業日)
        - P2 - 中 (スプリント内)
        - P3 - 低 (時間あれば)
        - P4 - 未定 (保留中)
```

### 4.2 バグ報告テンプレート（`.github/ISSUE_TEMPLATE/bug_report.yml`）

```yaml
name: バグ報告
description: バグや不具合の報告
labels: ['bug']
body:
  - type: textarea
    id: description
    attributes:
      label: バグの説明
      description: 何が起きていますか？
    validations:
      required: true
  - type: textarea
    id: reproduce
    attributes:
      label: 再現手順
      description: バグを再現する手順
      value: |
        1. ...
        2. ...
        3. ...
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: 期待される動作
    validations:
      required: true
  - type: textarea
    id: actual
    attributes:
      label: 実際の動作
    validations:
      required: true
  - type: dropdown
    id: severity
    attributes:
      label: 深刻度
      options:
        - Critical（サービス停止）
        - Major（主要機能に影響）
        - Minor（回避策あり）
        - Trivial（軽微）
```

---

## 完了チェックリスト

| #   | 確認項目                                   | 状態 |
| --- | ------------------------------------------ | ---- |
| 1   | ブランチ命名規則がドキュメント化されている |      |
| 2   | Conventional Commits が設定されている      |      |
| 3   | PR テンプレートが存在する                  |      |
| 4   | Issue テンプレートが存在する               |      |
| 5   | commitlint が設定されている（オプション）  |      |
