# 07_testing_strategy.md

## ChangeLog

- 2026-01-10: Unit / Integration のテストランナーを Vitest に統一
- 2026-01-10: Integration / E2E は専用スキーマで実行し、終了後にクリーンアップする

## テスト戦略（Unit / Integration / E2E）

---

## 1. 本資料の位置づけ

本資料は、社内SPIアプリにおける **テスト戦略全体** を定義する。
本アプリでは「後付けのテスト」を禁止し、**設計段階からテストを前提に実装する**。

特に **E2Eテストは必須要件**であり、Playwright による知見蓄積を目的として採用する。

---

## 2. テストレイヤ構成（確定）

| レイヤ      | 目的                 | ツール              |
| ----------- | -------------------- | ------------------- |
| Unit        | 純粋ロジックの正当性 | Vitest              |
| Integration | DB含む処理の検証     | Vitest + PostgreSQL |
| E2E         | 実利用動線の保証     | Playwright          |

---

## 3. Unit テスト

### 3.1 対象

- domain 層のロジック
- 状態遷移判定
- 採点ロジック
- 行動計測の集計ロジック（idle=15秒）

### 3.2 方針

- DB や外部 I/O に依存しない
- 時刻は抽象化（clock）を利用し、決定論的にテストできること
- 正常系・異常系を明確に分ける

---

## 4. Integration テスト

### 4.1 対象

- Prisma を利用した DB 操作
- トランザクション境界
- 制約違反（正解1つ、公開済み編集不可 等）

### 4.2 方針

- Docker の PostgreSQL を使用する
- Integration 用のスキーマを分離する（schema=integration）
- 実行前に `migrate reset --force --skip-seed` で初期化する
- 実行後に `migrate reset --force --skip-seed` でクリーンアップする

---

## 5. E2E テスト（必須）

### 5.1 採用理由

- Candidate / Staff の実利用動線が最も壊れやすい
- 試験進行・引き継ぎ・計測はユニットテストだけでは保証できない
- Playwright の知見を将来資産として残すため

---

### 5.2 E2E 実行環境

- Docker compose 上で実行する
- app / app-e2e / db / e2e の4サービス構成
- CI でも同一構成を使用する
- E2E 用のスキーマを分離する（schema=e2e）
- 実行前に `migrate reset --force` を行い、seed まで済ませる
- 実行後に `migrate reset --force --skip-seed` でクリーンアップする

---

### 5.3 E2E における認証の扱い（重要）

#### Staff

- Google SSO は使用しない
- テスト専用ログイン API を使用する
- whitelist / role 判定は **本番と同一ロジック**

#### Candidate

- seed された ticket + PIN を使用する
- 実メール送信は行わない

---

### 5.4 必須 E2E シナリオ（確定）

#### Candidate 系

1. Ticket + PIN でログインできる
2. モジュール順序固定で試験が進行する
3. 回答を選択して次の問題に進める
4. 制限時間経過でモジュールが終了する
5. 試験を提出できる
6. 行動計測イベントが記録され、metrics が更新される

---

#### Staff 系

1. whitelist 登録済み staff のみログインできる
2. whitelist 未登録 staff は拒否される
3. ticket を再発行できる
4. 試験中の attempt を LOCKED にできる
5. 引き継ぎ後、candidate が継続できる

---

### 5.5 安定性のためのルール

- UI 要素の取得には `data-testid` を必須とする
- `sleep` 等の固定待機は禁止
- Playwright の自動待機（expect）を使用する
- 失敗時は screenshot / trace / video を保存する
- Prisma Client は **常に最新スキーマで生成**されている必要がある
  - app コンテナで `prisma generate` を実行した上で E2E を開始する
  - 古い Client のまま実行すると、未反映カラム参照で 500 が発生するため
- E2E は **毎回同じ初期状態**から開始する
  - seed 実行前に、E2E 用 Ticket に紐づく Attempt を削除して状態を戻す
  - Attempt が残ると「使用中」判定となり、ログインが失敗するため

---

## 6. テストデータ（Seed）

### 6.1 Seed の目的

- E2E / Integration テストの再現性を担保する
- 毎回同じ条件でテストできること

### 6.2 Seed に含める内容

- exam_modules（VERBAL / NONVERBAL / ENGLISH / STRUCTURAL / PERSONALITY）
- staff_roles
- staff_users（E2E 用）
- candidates
- tickets
- 試験（Exam / ExamVersion / Modules / Questions）

---

## 7. CI における扱い

- CI では必ず以下を実行する
  - docker build
  - migrate
  - seed
  - Unit / Integration / E2E
- E2E が失敗した場合は **ビルドを失敗扱い**とする

---

## 8. テスト戦略としての不変条件

- E2E は省略不可
- テストを通さずにマージしない
- 本番と異なるロジックをテスト用に分岐させない
- 認証入口は異なっても、認可ロジックは共通

---

## 9. 次に読むべき資料

- `08_project_structure_and_coding_rules.md`
  （ディレクトリ構成・コーディング規約）
