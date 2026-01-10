# .codex/file_map.md

## ファイル・ディレクトリ マップ（Codex向け）

本ファイルは、社内SPIアプリにおける
**主要ディレクトリとその責務を一望できるマップ**である。

Codex は、実装や修正の際に必ず本マップを参照し、
**責務に反した場所へコードを置かない**こと。

---

## 1. 仕様書（一次情報）

```
docs/spec/
README.md                           # 仕様書の入口（必読）
01_application_spec.md              # 業務仕様・要件定義
02_technical_spec.md                # 技術仕様・アーキテクチャ
03_data_model.md                    # データモデル・不変条件
04_auth_and_access_control.md       # 認証・認可
05_exam_and_state_machine.md        # 試験進行・状態遷移
06_telemetry_spec.md                # 行動計測
07_testing_strategy.md              # テスト戦略（E2E必須）
08_project_structure_and_coding_rules.md
```

👉 **最優先で読むべき情報源**
👉 実装判断に迷ったら必ずここに立ち返る

---

## 2. Codex 向け設定ファイル

```
AGENTS.md                             # Codexへのトップ指示（最重要）
.codex/
prompt.md                           # 初回プロンプト固定文
workflow.md                         # 作業フロー
definition_of_done.md               # 完了条件
file_map.md                         # このファイル
```

👉 Codex の行動・思考を縛るためのファイル群
👉 実装よりも **優先度が高いルール**

---

## 3. アプリケーションコード

### 3.1 app/（Next.js App Router）

```
app/
(public)/                           # 未ログイン向け
(staff)/                            # staff 用 UI
(candidate)/                        # candidate 用 UI
api/                                # Route Handlers
layout.tsx
```

**責務**

- UI 表示
- 画面遷移
- Server Actions / Route Handlers の呼び出し

**禁止**

- ビジネスロジック
- 状態遷移判定
- 採点・集計ロジック

---

### 3.2 src/features/（業務ロジックの本体）

```
src/features/
auth/
staff-users/
candidates/
visits/
tickets/
exams/
questions/
attempts/
proctoring/
scoring/
telemetry/
audit/
```

各 feature は必ず以下の構造を持つ。

```
domain/       # 純粋な業務ロジック・状態遷移
usecase/      # ユースケース・トランザクション境界
infra/        # DB・外部I/O（Prisma等）
```

👉 **業務仕様の実体はここにある**

---

### 3.3 src/shared/（横断的関心事）

```
src/shared/
  db/                                # Prisma Client / Tx管理
  time/                              # clock 抽象化
  errors/                            # 共通エラー定義
  validation/                        # 入力検証
  utils/                             # 汎用ユーティリティ
```

---

## 4. DB・マイグレーション

```
prisma/
  schema.prisma
  migrations/
  seed.ts
```

👉 データモデルの正は `03_data_model.md`
👉 schema.prisma は仕様書の写像であること

---

## 5. テスト

```
tests/
e2e/                               # Playwright
```

- Unit / Integration は各 feature 配下に置いてよい
- E2E は必ずここに集約する

---

## 6. Docker / 実行環境

```
docker/
  Dockerfile
  compose.yaml
```

👉 ローカル / CI / 本番で同一構成が再現できることが前提

---

## 7. よくある誤り（注意喚起）

- app/ に domain ロジックを書く ❌
- infra から domain に依存させる ❌
- テスト用ロジックを production に混入させる ❌
- 仕様書よりコードを正として判断する ❌

---

## 8. 最重要メッセージ

> **仕様書が正、コードは従。**
> 実装に迷ったら、新しいコードを書く前に
> 「どの仕様書の、どの不変条件か」を明示すること。
