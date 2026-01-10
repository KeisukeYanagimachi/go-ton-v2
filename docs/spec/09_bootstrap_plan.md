# 09_bootstrap_plan.md

## プロジェクト立ち上げ計画（Phase 0〜）

---

## 1. 本資料の目的

本資料は、社内SPIアプリの実装を開始する前に、
**Next.js / Docker / DB / テスト基盤を破綻なく整えるための実行計画**を定義する。

- 本資料は「実装の順番」を固定し、コーディングエージェント（Codex）の迷いを排除する
- ここで定義する Phase 0 は **省略不可**（後付け禁止）

---

## 2. Phase 0（基盤構築）— 省略不可

### 2.1 ゴール（Definition of Done）

Phase 0 完了条件は以下を **すべて満たすこと**。

1. Next.js（App Router / TypeScript）プロジェクトが初期化されている
2. `docs/spec/08_project_structure_and_coding_rules.md` のディレクトリ構成が存在する
3. `docker compose up` で以下が起動する
   - app（Next.js）
   - db（PostgreSQL 16）
   - e2e（Playwright 実行環境）
4. Prisma が導入され、以下が実行できる
   - migrate
   - seed
5. Playwright による **スモークE2E** が1本存在し、CI相当環境で実行できる
6. 規約ファイル（AGENTS.md / .codex/_ / docs/spec/_）を壊さずに維持している

---

### 2.2 実施内容（順序固定）

#### Step 0-1: Next.js 初期化（App Router + TS）

- Next.js を App Router 構成で初期化する
- `app/` が存在し、ビルドが通る状態にする

**注意**

- この時点ではアプリ機能は実装しない（「起動できる器」が目的）

---

#### Step 0-2: ディレクトリ骨格の作成

`docs/spec/08_project_structure_and_coding_rules.md` に従い、以下の骨格を作る。

- `app/`（UI・ルーティングのみ）
- `src/features/**`（domain/usecase/infra）
- `src/shared/**`
- `prisma/`（schema/migrations/seed）
- `tests/e2e/`

**不変条件**

- app/ に業務ロジックを置かない方針がこの段階から守れる構造であること

---

#### Step 0-3: Docker / Compose の導入（必須）

- 開発の再現性のため、Docker + docker compose を前提にする
- compose には最低限以下を含める
  - app（Next.js）
  - db（PostgreSQL 16）
  - e2e（Playwright）

**目的**

- 開発環境とCI環境の差異をなくす
- ローカルにDBを入れない運用を固定する

---

#### Step 0-4: Prisma 導入（DB接続・migrate・seed）

- Prisma を導入し、`DATABASE_URL` で Postgres に接続できること
- migrate が動くこと
- seed が動くこと

**seed の最低要件（Phase 0 時点）**

- exam_modules（VERBAL/NONVERBAL/ENGLISH/STRUCTURAL/PERSONALITY）
- staff_roles（ADMIN/AUTHOR/PROCTOR/REPORT_VIEWER）
- E2E用 staff_users（whitelist前提）
- ダミー candidate / ticket（E2Eでログインできる最小データ）

※ 本格的なデータモデルは Phase 1 で実装するが、Phase 0 でも「E2Eが回る」seedは必須。

---

#### Step 0-5: Playwright 導入（E2E基盤）

- Playwright を導入し、最低1本のスモークE2Eを作成する
- スモークE2Eの内容は以下でよい
  - アプリが起動してトップページが表示される
  - （可能なら）Candidateログイン画面まで遷移できる

**不変条件**

- E2E対象のUIには data-testid を付ける方針を、この段階から崩さない

---

#### Step 0-6: 実行手順の統一（コマンド固定）

- 開発者・CI・Codex が同じ手順で動かせるように、実行コマンドを固定する
- 例（具体名は実装側で確定してよい）
  - `make up` / `make down`
  - `make migrate`
  - `make seed`
  - `make test`（unit/integration）
  - `make test-e2e`

---

## 3. Phase 1（データモデル）— 仕様書の写像

### 3.1 目的

- `docs/spec/03_data_model.md` の論理モデルを Prisma schema に落とす
- 制約（不変条件）をDB/アプリで担保する

### 3.2 完了条件（概要）

- schema.prisma が主要エンティティをすべて含む
- migrate/seed 更新
- 主要テーブルの Integration テストが存在する

---

## 4. Phase 2（認証・認可）

### 4.1 目的

- `docs/spec/04_auth_and_access_control.md` を満たす
- production/dev/e2e の認証入口を分離し、認可ロジックを共通化する

### 4.2 完了条件（概要）

- staff: whitelist + RBAC がサーバ側で機能する
- candidate: ticket + PIN で認証できる
- E2Eで staff/candidate のログインが安定する

---

## 5. Phase 3（試験進行・状態遷移）

- `docs/spec/05_exam_and_state_machine.md` を満たす
- Attempt / ExamVersion の状態遷移を実装
- モジュール順序固定、タイマー、提出、採点への接続まで

---

## 6. Phase 4（Telemetry）

- `docs/spec/06_telemetry_spec.md` を満たす
- idle=15秒を厳守
- events と metrics を実装し、E2Eで検証する

---

## 7. Phase 5（管理・分析）

- Staffの運用画面（再発行・引き継ぎ・成績閲覧）
- 監査ログの可視化/出力など

---

## 8. 本資料の運用ルール

- Phase 0 を飛ばして Phase 1 以降を進めることは禁止
- 各 Phase の完了条件（DoD）を満たしてから次へ進む
- 仕様の変更がある場合は docs/spec を先に更新し、その後実装に反映する
