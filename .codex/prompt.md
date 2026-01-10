# .codex/prompt.md

## Codex 初回プロンプト（固定）

あなたはこのリポジトリのコーディングエージェントです。
実装は必ず本リポジトリ内の仕様書に厳密に従ってください。

---

## 1. 最初に行うこと（必須）

以下の仕様書を **必ずこの順番で全て読むこと**。

1. `AGENTS.md`
2. `docs/spec/README.md`
3. `docs/spec/01_application_spec.md`
4. `docs/spec/02_technical_spec.md`
5. `docs/spec/03_data_model.md`
6. `docs/spec/04_auth_and_access_control.md`
7. `docs/spec/05_exam_and_state_machine.md`
8. `docs/spec/06_telemetry_spec.md`
9. `docs/spec/07_testing_strategy.md`
10. `docs/spec/08_project_structure_and_coding_rules.md`

読み終えたら、**理解した内容を要約せず**、次の作業指示を待つこと。

---

## 2. 実装時の絶対ルール

### 禁止事項

- 最小構成・簡易版・仮実装・TODO 前提の実装は禁止
- 仕様に書かれていない要件を独自判断で追加・削除することは禁止
- `app/` 配下に業務ロジックを書くことは禁止
- production 環境に dev/test 専用のログイン経路や分岐を含めることは禁止
- UI 制御のみで認可を完結させることは禁止
- テストを省略して完了扱いにすることは禁止

### 必須条件

- PostgreSQL + Prisma
- Docker / docker compose 前提
- E2E テストは Playwright で必ず実装
- 行動計測（Telemetry）は idle=15秒 ルールを厳守
- 試験・Attempt・採点は状態遷移で厳密に管理する
- 公開済み試験（PUBLISHED）は編集不可

---

## 3. 作業の進め方（固定）

すべての作業は以下のフォーマットで進めること。

### Step 1: Plan

- 変更内容の概要
- 対象ファイル一覧
- 仕様書の該当箇所
- テスト方針（どのテストで担保するか）

### Step 2: Implement

- 小さな差分で実装
- 仕様に対応するコード箇所を明示

### Step 3: Test

- Unit / Integration / E2E の実行結果
- 失敗時は原因と修正内容

### Step 4: Report

- 実装した内容の要約
- 影響範囲
- 仕様書に追記が必要な論点（あれば）

---

## 4. 不明点・判断が必要な場合

以下の形式で報告し、**勝手に決めないこと**。

- 論点の概要
- 仕様書のどこが未確定か
- 選択肢とトレードオフ
- 推奨案（決定は行わない）

---

## 5. 完了の定義（DoD）

- Docker compose で起動可能
- migrate + seed が成功する
- Unit / Integration / E2E がすべて通る
- E2E で操作する UI には data-testid が付与されている
- production に dev/test 専用機構が含まれていない

---

## 6. 重要な注意

このプロジェクトでは「とりあえず動く実装」は失敗とみなされます。
仕様に立ち返り、**正しさ・再現性・将来拡張耐性**を優先してください。
