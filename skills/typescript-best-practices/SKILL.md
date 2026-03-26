# TypeScript ベストプラクティス & プロジェクト初期設定スキル

## メタデータ

- **トリガー**: 「TypeScript設定」「tsconfig設定」「TypeScriptプロジェクト初期設定」「型安全」
- **前提条件**: Node.js プロジェクト

## 概要

TypeScript プロジェクトの初期設定と型安全なコーディングのベストプラクティスを提供するスキル。
tsconfig.json の最適設定、パス エイリアス、厳格モードの段階的導入をガイドする。

---

## Phase 1: TypeScript 導入判定

### 1.1 新規プロジェクト

```bash
npm install --save-dev typescript @types/node
npx tsc --init
```

### 1.2 既存 JavaScript プロジェクトの移行

```bash
npm install --save-dev typescript @types/node
# allowJs: true で段階的に移行
```

---

## Phase 2: tsconfig.json 推奨設定

### 2.1 厳格モード（推奨）

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": false,

    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "coverage", "**/*.test.ts"]
}
```

### 2.2 フレームワーク別追加設定

**Next.js:**
```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }]
  }
}
```

**React (Vite):**
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "moduleResolution": "bundler"
  }
}
```

---

## Phase 3: 型安全コーディングガイドライン

### 3.1 避けるべきパターン

```typescript
// BAD: any の使用
function process(data: any) { ... }

// GOOD: 適切な型定義
interface ProcessInput {
  id: string;
  value: number;
}
function process(data: ProcessInput) { ... }

// BAD: 型アサーション の乱用
const user = response as User;

// GOOD: 型ガードの使用
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}
if (isUser(response)) { ... }

// BAD: Non-null assertion の乱用
const name = user!.name;

// GOOD: オプショナルチェーン + nullish coalescing
const name = user?.name ?? 'Unknown';
```

### 3.2 推奨パターン

```typescript
// Branded Types で型安全な ID
type UserId = string & { readonly __brand: 'UserId' };
type OrderId = string & { readonly __brand: 'OrderId' };

function createUserId(id: string): UserId {
  return id as UserId;
}

// Discriminated Union で安全な状態管理
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Exhaustive check
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

// Readonly で不変性を保証
interface Config {
  readonly apiUrl: string;
  readonly timeout: number;
}
```

### 3.3 ユーティリティ型の活用

```typescript
// Partial — 全プロパティをオプショナルに
type UpdateUser = Partial<User>;

// Pick / Omit — 必要なプロパティだけ抽出
type UserSummary = Pick<User, 'id' | 'name'>;
type UserWithoutPassword = Omit<User, 'password'>;

// Record — キー・値の型を指定
type StatusMap = Record<string, boolean>;

// Extract / Exclude — Union 型の操作
type NumericStatus = Extract<Status, number>;
```

---

## Phase 4: テスト設定

### 4.1 Vitest（推奨）

```bash
npm install --save-dev vitest @vitest/coverage-v8
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['node_modules/', 'dist/', '**/*.config.*'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 4.2 package.json scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 完了チェックリスト

| # | 確認項目 | 状態 |
|---|---------|------|
| 1 | TypeScript がインストールされている | |
| 2 | tsconfig.json が strict: true で設定されている | |
| 3 | パスエイリアス (@/*) が設定されている | |
| 4 | `npm run typecheck` が正常動作する | |
| 5 | テストフレームワークが設定されている | |
| 6 | any の使用が最小限に抑えられている | |
