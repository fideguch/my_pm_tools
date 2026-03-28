# Handoff: PM Tool Suite v4.7 — P6 Complete, P7 Implementation Ready

## Current State

- **Repository**: https://github.com/fideguch/my_pm_tools
- **Branch**: main
- **Uncommitted**: HANDOFF.md, README.md, README.en.md changes + skills/pm-figjam-diagrams/ + skills/speckit-bridge/
- **Tests**: 375 passed (my_pm_tools) + quality all pass
- **Remote**: up to date with origin/main (except uncommitted changes)

## What Was Done (v4.7 Session)

### 1. P6: GAFA v2 Strict Re-evaluation

- 全5リポを独立検証(VP-1)付きで厳密採点
- v4.5推定85.8 → P6実測**81.4**（4.4pt楽観バイアス発覚）
- サブエージェントのテスト数報告が38%過大だったことを検証で発見

### 2. Product Vision 策定

- `memory/suite-product-vision.md` 作成（Suite全体のミッション、5リポのJTBD/Non-Goals）
- 全5リポのREADMEにProduct Visionセクション追加
- 改善原則：「目的を変えるな、品質を上げろ」

### 3. README Full Audit（コードベース全読）

- 全5リポのSKILL.md/コードを全読み、README未記載の仕様を洗い出し
- my_pm_tools: ビュー数6→5修正、エイリアス11種全記載、PM Suite名修正（9箇所）
- speckit-bridge: 272→531行（全10ステップ詳細化）
- pm-data-analysis: 133→464行（20件の仕様追記）
- pm-ad-operations: 127→484行（17件の仕様追記）
- requirements_designer: 186→231行（8件修正）
- Post-README: Suite avg **83.0** (+1.6)

### 4. PDCA Cycle 確立

- 5つのアンチパターン発見・命名（AP-1~5）
- 3つの検証プロトコル確立（VP-1,2,3）
- グローバルルール `rules/common/quality-pdca.md` 作成

## Suite Metrics (v4.7)

| Repo                  | Score    | D1   | D2   | D3   | D4   | D5   | Tests |
| --------------------- | -------- | ---- | ---- | ---- | ---- | ---- | ----- |
| my_pm_tools           | **88**   | 17   | 18   | 16   | 19   | 18   | 324   |
| requirements_designer | **88**   | 18   | 16   | 16   | 19   | 19   | 267   |
| speckit-bridge        | **75**   | 14   | 15   | 12   | 18   | 16   | 38    |
| pm-data-analysis      | **84**   | 16   | 17   | 15   | 18   | 18   | 72    |
| pm-ad-operations      | **80**   | 16   | 16   | 14   | 17   | 17   | 63    |
| **Suite Average**     | **83.0** | 16.2 | 16.4 | 14.6 | 18.2 | 17.4 | 764   |

**最弱次元**: Dim3 (Testing & CI) = 14.6

## Next Session: P7 Implementation (87+ Target)

### 実装プラン

**ファイル**: `~/.claude/plans/robust-wibbling-hamming.md`

### 実行順序と内容

| Phase | Repo                  | Score Change | Key Actions                                                                          |
| ----- | --------------------- | ------------ | ------------------------------------------------------------------------------------ |
| **1** | speckit-bridge        | 75→83 (+8)   | テスト3分割(38→55+), ESLint, CI lint+audit, CHANGELOG, SECURITY.md, 空templates/削除 |
| **2** | pm-ad-operations      | 80→83 (+3)   | ESLint, CI lint+audit, SECURITY.md, +15シナリオテスト                                |
| **3** | pm-data-analysis      | 84→86 (+2)   | ESLint, CI lint+audit, SECURITY.md                                                   |
| **4** | requirements_designer | 88→89 (+1)   | テストファイル2分割×2, CI audit, SECURITY.md                                         |
| **5** | my_pm_tools           | 88→90 (+2)   | validation.spec.ts 3分割, pm-workflows.spec.ts 2分割                                 |

Phase 2/3 は並列実行可能。

### 復元コマンド

```
プランを読んで実装を開始してください。Phase 1 (speckit-bridge) から着手。
プラン: ~/.claude/plans/robust-wibbling-hamming.md
HANDOFF: /private/tmp/my_pm_tools/HANDOFF.md
```

### 厳守事項（次のエージェントへ）

1. **VP-1**: テスト数は `grep -rc 'test(\|it(' tests/` で独立検証。サブエージェント数値は参考値
2. **VP-2**: 改善後の再評価は前回スコアを見る前にブラインドで採点
3. **VP-3**: 改善した項目だけでなく全ルーブリック項目をpass/fail判定
4. **AP-1~5**: 楽観推定、数値膨張、スコアアンカリング、Phantom Addition、代理信頼を回避
5. **Product Vision**: 各リポのJTBD/Non-Goals境界を遵守（`memory/suite-product-vision.md`参照）
6. **Five-File Sync**: my_pm_tools の構造変更は5ファイル同時更新
7. **テスト分割後**: `npm test` で全テストgreen確認してから次のステップへ

## Key Files Map

| Purpose                  | Path                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| 実装プラン               | `~/.claude/plans/robust-wibbling-hamming.md`                                                             |
| Product Vision           | `memory/suite-product-vision.md`                                                                         |
| PDCA Cycle               | `memory/feedback_quality-pdca-cycle.md`                                                                  |
| GAFA Rubric              | `memory/gafa_eval_rubric.md` (詳細: `~/.claude/bochi-data/memos/2026-03-28-gafa-code-quality-rubric.md`) |
| Planning Anti-patterns   | `memory/feedback_planning-antipatterns.md`                                                               |
| Quality PDCA Global Rule | `~/.claude/rules/common/quality-pdca.md`                                                                 |
| Suite Quality Baseline   | `memory/project_suite-quality-baseline.md`                                                               |
| North Star               | `memory/north-star.md`                                                                                   |
