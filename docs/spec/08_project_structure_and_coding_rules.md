# 08_project_structure_and_coding_rules.md

## プロジェクト構成・コーディング規約

---

## 1. 本資料の位置づけ

本資料は、社内SPIアプリを実装するにあたり、
**プロジェクト構成・コード配置・命名・設計規約**を定義する。

本資料の目的は以下である。

- コードの責務を明確にし、破綻しない構造を保つ
- コーディングエージェントの裁量を最小限にし、迷いを排除する
- 実装後の保守・拡張を容易にする

---

## 2. ディレクトリ構成（確定）

### 2.1 全体構成

以下の構成を **必ず採用**する。

```
.
├─ app/                       # Next App Router（UI・ルーティング）
│  ├─ (public)/
│  ├─ (staff)/
│  ├─ (candidate)/
│  ├─ api/                    # Route Handlers
│  └─ layout.tsx
│
├─ src/
│  ├─ features/               # 機能単位（業務境界）
│  │  ├─ auth/
│  │  ├─ staff-users/
│  │  ├─ candidates/
│  │  ├─ visits/
│  │  ├─ tickets/
│  │  ├─ exams/
│  │  ├─ questions/
│  │  ├─ attempts/
│  │  ├─ proctoring/
│  │  ├─ scoring/
│  │  ├─ telemetry/
│  │  └─ audit/
│  │
│  ├─ shared/                 # 横断的関心事
│  │  ├─ db/
│  │  ├─ time/
│  │  ├─ errors/
│  │  ├─ validation/
│  │  └─ utils/
│  │
│  └─ config/                 # 環境変数・定数
│
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts
│
├─ tests/
│  └─ e2e/                    # Playwright
│
├─ docker/
│  └─ Dockerfile
│
├─ compose.yaml
└─ README.md
```

---

## 3. app/ ディレクトリの役割（重要）

- `app/` は **UI とルーティングのみ**を担当する
- ビジネスロジック・状態遷移・採点・集計を実装してはならない
- app/ からは usecase 層を呼び出すだけとする

---

## 4. features 配下の構成規約

### 4.1 機能単位で分割する

- 仕様書で定義された業務境界ごとに feature を切る
- 「横断的に巨大な service」を作らない

---

### 4.2 各 feature の内部構成（固定）

各 feature は必ず以下 3 層を持つ。

```
src/features/
├─ domain/        # 純粋な業務ロジック
├─ usecase/       # ユースケース（トランザクション境界）
└─ infra/         # DB・外部I/O
```

#### domain 層

- エンティティ
- 値オブジェクト
- 状態遷移ロジック
- 副作用を持たない

#### usecase 層

- アプリケーションの操作単位
- トランザクション境界
- domain と infra を組み合わせる

#### infra 層

- Prisma を使った DB 操作
- 外部サービス連携
- domain/usecase に依存してよいが、逆は不可

---

## 5. 命名規約（確定）

### 5.1 データベース

- テーブル名：snake_case
- カラム名：snake_case

### 5.2 TypeScript

- クラス / 型：PascalCase
- 関数 / 変数：camelCase
- 定数：SCREAMING_SNAKE_CASE

### 5.3 ファイル名

- React Component：PascalCase.tsx
- それ以外：kebab-case.ts

---

## 6. TypeScript / 静的解析

- TypeScript：strict モード必須
- ESLint：next/core-web-vitals + @typescript-eslint
- Prettier を使用し、フォーマットを統一する
- any の使用は禁止（例外は infra 層の境界のみ）
- `src/` 配下の import は `@/` エイリアスで統一する（相対 import を避ける）

---

## 7. トランザクション規約（必須）

以下の操作は **必ずトランザクション**で実装する。

- Ticket 使用開始
- Attempt 開始
- Attempt 引き継ぎ
- 試験提出
- 採点・スコア確定
- 行動イベント記録と metrics 更新（同時更新時）

---

## 8. テストに関する規約

### 8.1 data-testid

- E2E を前提とし、操作対象の UI には必ず `data-testid` を付与する
- 表示文言で要素取得しない

### 8.2 テスト用分岐

- dev / test 用の認証入口は **production に含めない**
- それ以外のロジック分岐は禁止

---

## 9. 禁止事項（明文化）

以下は **明確に禁止**する。

- app/ 配下に業務ロジックを実装すること
- 公開済み試験の編集
- 認可チェックを UI のみで完結させること
- テストを省略してマージすること
- 「とりあえず動く」実装を後で直す前提で入れること

---

## 10. 本規約の不変条件

- 構成・規約は全実装期間を通じて不変
- 変更が必要な場合は、仕様書側を先に更新する
- 実装側の独断変更は禁止

---

## 11. 仕様書一式の完結

本資料をもって、`docs/spec` 配下の仕様書は **完結**とする。
