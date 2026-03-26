# コード品質ツールチェーン導入スキル

## メタデータ

- **トリガー**: 「コード品質を設定したい」「ESLint導入」「Prettier設定」「lint-staged」「Husky設定」「コード品質ツールチェーン」
- **前提条件**: Node.js プロジェクト（package.json が存在）

## 概要

ESLint + Prettier + Husky + lint-staged の統合セットアップを自動化するスキル。
プロジェクトの技術スタックを自動検出し、最適な設定を生成する。

---

## Phase 1: プロジェクト検出

### 1.1 技術スタック判定

```bash
# package.json の存在確認
cat package.json

# TypeScript 判定
[ -f tsconfig.json ] && echo "TypeScript" || echo "JavaScript"

# フレームワーク判定
node -e "
const pkg = require('./package.json');
const deps = {...(pkg.dependencies||{}), ...(pkg.devDependencies||{})};
if (deps.next) console.log('Next.js');
else if (deps.react) console.log('React');
else if (deps.vue) console.log('Vue');
else if (deps.express) console.log('Express');
else console.log('Node.js');
"
```

### 1.2 既存ツール確認

```bash
# 既存の lint/format 設定を確認
ls -la .eslintrc* eslint.config.* .prettierrc* .prettierignore biome.json 2>/dev/null
ls -la .husky/ 2>/dev/null
```

既存設定がある場合はユーザーに確認: 「既存の設定を上書きしますか？それともマージしますか？」

---

## Phase 2: パッケージインストール

### 2.1 ESLint + Prettier（標準構成）

```bash
# TypeScript プロジェクトの場合
npm install --save-dev \
  eslint \
  @eslint/js \
  typescript-eslint \
  prettier \
  eslint-config-prettier \
  eslint-plugin-prettier \
  globals

# JavaScript プロジェクトの場合
npm install --save-dev \
  eslint \
  @eslint/js \
  prettier \
  eslint-config-prettier \
  eslint-plugin-prettier \
  globals
```

### 2.2 フレームワーク固有プラグイン

```bash
# React / Next.js の場合
npm install --save-dev eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y

# Vue の場合
npm install --save-dev eslint-plugin-vue
```

### 2.3 Husky + lint-staged

```bash
npm install --save-dev husky lint-staged
npx husky init
```

---

## Phase 3: 設定ファイル生成

### 3.1 ESLint 設定（Flat Config — eslint.config.mjs）

**TypeScript プロジェクト:**
```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
    },
  },
  {
    ignores: ['dist/', 'build/', 'node_modules/', 'coverage/', '*.config.js', '*.config.mjs'],
  }
);
```

**JavaScript プロジェクト:**
```javascript
import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  eslint.configs.recommended,
  prettierConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
    },
  },
  {
    ignores: ['dist/', 'build/', 'node_modules/', 'coverage/'],
  },
];
```

### 3.2 Prettier 設定（.prettierrc）

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

### 3.3 .prettierignore

```
dist/
build/
node_modules/
coverage/
*.min.js
*.min.css
package-lock.json
```

### 3.4 Husky pre-commit フック（.husky/pre-commit）

```bash
npx lint-staged
```

### 3.5 lint-staged 設定（package.json に追加）

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml,css,scss}": ["prettier --write"]
  }
}
```

### 3.6 package.json scripts 追加

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "quality": "npm run lint && npm run format:check"
  }
}
```

TypeScript でない場合は `typecheck` と `quality` から `typecheck` を除外。

---

## Phase 4: 動作確認

### 4.1 リントテスト

```bash
npm run lint 2>&1 | head -20
npm run format:check 2>&1 | head -20
```

### 4.2 Git フック確認

```bash
# テストコミットで pre-commit フックが動作するか確認
echo "// test" >> /tmp/test.js
git add /tmp/test.js 2>/dev/null || true
```

### 4.3 問題修正

エラーが出た場合:
1. `eslint --fix .` で自動修正可能なものを修正
2. `prettier --write .` でフォーマット修正
3. 残りの手動修正が必要なものをユーザーに報告

---

## Phase 5: CI 連携

### 5.1 GitHub Actions に品質チェックステップ追加

既存の `.github/workflows/ci.yml` がある場合、以下のステップを追加提案:

```yaml
- name: Lint
  run: npm run lint
- name: Format Check
  run: npm run format:check
- name: Type Check
  run: npm run typecheck
```

---

## 完了チェックリスト

| # | 確認項目 | 状態 |
|---|---------|------|
| 1 | eslint.config.mjs が存在する | |
| 2 | .prettierrc が存在する | |
| 3 | .prettierignore が存在する | |
| 4 | .husky/pre-commit が存在する | |
| 5 | lint-staged が package.json に設定されている | |
| 6 | `npm run lint` が正常動作する | |
| 7 | `npm run format:check` が正常動作する | |
| 8 | pre-commit フックが動作する | |

## Biome 代替オプション

Biome（Rust製の高速リンター+フォーマッター）を選択する場合:

```bash
npm install --save-dev @biomejs/biome
npx biome init
```

Biome は ESLint + Prettier の代替として使用可能。新規プロジェクトや速度重視の場合に推奨。
既存の ESLint プラグインエコシステムが必要な場合は ESLint + Prettier を推奨。
