# 03_data_model.md

## ChangeLog

- 2026-01-10: schema.sql の内容に合わせてモデル属性と制約を詳細化
- 2026-01-10: Attempt 作成タイミングと session 取り扱いの補足を追記
- 2026-01-10: Ticket に exam_version_id を紐づけ、Attempt の選定基準を明文化

## データモデル仕様（論理設計・不変条件）

---

## 1. 本資料の位置づけ

本資料は、社内SPIアプリにおける **全データモデルの論理仕様** を定義する。
実装担当者は、以下を厳守すること。

- 本資料に記載されたエンティティは **すべて実装対象**
- テーブル削減・統合・省略は禁止
- 不変条件は DB / アプリの両方で担保する
- 「後から追加」前提の未定義モデルは禁止

---

## 2. 設計原則（最重要）

### 2.1 スナップショット原則

- 試験開始時点の条件は **Attempt に固定**する
- 試験・問題・配点・時間配分が後から変更されても、
  **既存 Attempt には影響しない**

### 2.2 追記型ログ原則

- 行動ログ・監査ログは原則 **追記のみ**
- 更新・削除は行わない（集計テーブルは除く）

### 2.3 公開不変原則

- 公開済み（PUBLISHED）の試験バージョンは変更不可
- 変更が必要な場合は新バージョンを作成する

---

## 3. ユーザー・認証関連

### 3.1 Staff

#### staff_users

- 社内運営者
- Google Workspace アカウントに紐づく

主な属性

- id
- email（UNIQUE）
- display_name
- is_active
- created_at / updated_at

#### staff_roles

- ロール定義（ADMIN / AUTHOR / PROCTOR / REPORT_VIEWER）

主な属性

- id
- code（UNIQUE）
- name
- created_at

#### staff_user_roles

- staff_users と staff_roles の多対多

主な属性

- staff_user_id
- staff_role_id
- created_at

**不変条件**

- is_active=false の staff はログイン不可
- 権限判定は role ベースで行う

---

### 3.2 Candidate

#### candidates

- 受験者本人情報
- 応募者として事前登録されている

主な属性

- id
- full_name
- email
- education
- birth_date
- created_at / updated_at

---

## 4. 来社・受験票関連

### 4.1 Visit / Slot

#### visit_slots

- 来社日時の枠

主な属性

- id
- starts_at / ends_at
- capacity
- created_at / updated_at

**不変条件**

- ends_at > starts_at
- capacity >= 0

#### candidate_slot_assignments

- candidate と visit_slot の紐付け

主な属性

- id
- candidate_id
- visit_slot_id
- created_at

---

### 4.2 Ticket（受験票）

#### tickets

- 受験票を表す
- QRコードに埋め込まれるコードを持つ

主な属性

- id
- ticket_code（UNIQUE）
- candidate_id
- exam_version_id
- visit_slot_id（NULL 可）
- pin_hash
- status（ACTIVE / REVOKED / USED）
- replaced_by_ticket_id（NULL 可）
- created_by_staff_user_id（NULL 可）
- created_at / updated_at

**不変条件**

- REVOKED / USED の ticket は利用不可
- 再発行時、旧 ticket は必ず REVOKED
- REVOKED / USED から ACTIVE へ戻さない

**運用ルール（補足）**

- Ticket は **1つの exam_version に紐づく**
- Candidate が試験開始する際は、Ticket に紐づく exam_version を使用する

---

## 5. 試験定義

### 5.1 Exam / Version

#### exams

- 試験の論理的なまとまり（例：SPI本試験）

主な属性

- id
- name
- description
- created_at / updated_at

#### exam_versions

- 試験の改訂単位

主な属性

- exam_id
- version_number
- status（DRAFT / PUBLISHED / ARCHIVED）
- published_at（PUBLISHED 時は必須）
- archived_at（ARCHIVED 時に使用）
- created_at / updated_at

**不変条件**

- PUBLISHED の version は編集不可
- 試験実施は常に特定の version に対して行う
- PUBLISHED の version は published_at を必須とする

---

### 5.2 モジュール定義

#### exam_modules（マスタ）

- SPI3 モジュール定義
  - VERBAL
  - NONVERBAL
  - ENGLISH
  - STRUCTURAL
  - PERSONALITY（将来拡張用）

主な属性

- id
- code（UNIQUE）
- name
- created_at

#### exam_version_modules

- 試験バージョンに含まれるモジュール

主な属性

- exam_version_id
- module_id
- duration_seconds
- position
- created_at

**不変条件**

- VERBAL / NONVERBAL / ENGLISH / STRUCTURAL は必須
- position により実施順を固定する
- 同一 exam_version 内で position は重複不可

---

## 6. 問題定義

### 6.1 問題・選択肢

#### questions

- 単一選択式の問題

主な属性

- id
- stem
- explanation
- is_active
- created_at / updated_at

#### question_options

- 問題の選択肢

主な属性

- id
- question_id
- option_text
- is_correct
- position
- created_at

**不変条件**

- 正解は必ず1つ
- 同一 question に複数 is_correct=true を持たせない
- 同一 question 内で position は重複不可
- DB は「正解が複数存在しない」ことを担保し、
  「正解が必ず1つ存在する」ことはアプリ層で担保する

---

### 6.2 カテゴリ

#### question_categories

- 階層構造を持つカテゴリ

主な属性

- id
- name
- parent_id（NULL 可）
- created_at / updated_at

#### question_category_assignments

- questions と categories の多対多

主な属性

- question_id
- category_id
- created_at

---

## 7. 試験編成

### 7.1 出題割当

#### exam_version_questions

- 試験バージョンに出題する問題

主な属性

- exam_version_id
- module_id
- question_id
- position
- points
- created_at

**不変条件**

- 同一 exam_version 内で question 重複不可
- module と question のカテゴリ整合性を保つ
- 同一 exam_version + module 内で position 重複不可

---

## 8. 受験（Attempt）

### 8.1 Attempt 本体

#### attempts

- 受験の実体

主な属性

- candidate_id
- exam_version_id
- ticket_id
- status
- started_at / submitted_at / finished_at / locked_at
- created_at / updated_at

**Attempt 状態**

- NOT_STARTED
- IN_PROGRESS
- LOCKED
- SUBMITTED
- SCORED
- ABORTED

**作成タイミング**

- Candidate の「試験開始」操作で Attempt を作成する
- 認証直後に作成しない

---

### 8.2 セッション・端末

#### devices

- 会場PC等の端末情報

主な属性

- id
- device_code（UNIQUE）
- description
- created_at / updated_at

#### attempt_sessions

- Attempt と端末の紐付け
- 引き継ぎ単位

主な属性

- attempt_id
- device_id（NULL 可）
- status（ACTIVE / REVOKED / EXPIRED）
- started_at / ended_at / revoked_at
- created_by_staff_user_id（NULL 可）
- created_at

**不変条件**

- 同一 Attempt に有効な session は1つのみ
- status=ACTIVE は 1 つまで

**運用ルール（補足）**

- Attempt 作成時に AttemptSession を作成する
- device_id は NULL を許容し、後から紐づけ可能とする

### 8.3 モジュールタイマー

#### attempt_module_timers

- モジュールごとの残り時間スナップショット

主な属性

- attempt_id
- module_id
- time_limit_seconds
- remaining_seconds
- started_at / ended_at
- created_at / updated_at

**不変条件**

- remaining_seconds は 0 以上

---

## 9. 出題スナップショット

### 9.1 AttemptItem

#### attempt_items

- Attempt 開始時点で確定した出題内容

主な属性

- attempt_id
- question_id
- module_id
- position
- points
- created_at

---

### 9.2 回答

#### attempt_answers

- AttemptItem に対する回答

主な属性

- attempt_item_id（UNIQUE）
- selected_option_id（NULL 可）
- answered_at
- updated_at

**不変条件**

- 同一 AttemptItem に対して回答は1つ
- 回答変更は更新として扱う（履歴はイベントで保持）

---

## 10. 採点・スコア

### 10.1 個別採点

#### attempt_answer_scores

- 問題単位の採点結果

主な属性

- attempt_item_id（UNIQUE）
- is_correct
- points_awarded
- scored_at

---

### 10.2 集計

#### attempt_module_scores

- モジュール単位の集計

主な属性

- attempt_id
- module_id
- raw_score
- max_score
- scored_at

#### attempt_scores

- 試験全体の集計

主な属性

- attempt_id（UNIQUE）
- raw_score
- max_score
- scored_at

**不変条件**

- 採点は SUBMITTED 後にのみ実行
- 採点結果は再計算不可（不変）

---

## 11. 行動計測（Telemetry）

### 11.1 イベントログ

#### attempt_item_events

- 問題単位の行動イベント
- 追記専用

主な属性

- attempt_id
- attempt_item_id（NULL 可）
- event_type
- server_time
- client_time（NULL 可）
- metadata_json

---

### 11.2 集計指標

#### attempt_item_metrics

- 問題単位の集計結果

主な指標

- observed_seconds
- active_seconds
- view_count
- answer_change_count
- computed_at

**不変条件**

- active_seconds <= observed_seconds
- idle 判定は 15 秒

---

## 12. 監査ログ

#### audit_logs

- staff 操作・重要イベントを記録
- 追記専用

主な属性

- actor_staff_user_id（NULL 可）
- action
- entity_type
- entity_id
- server_time
- metadata_json

---

## 13. データモデルとしての不変条件まとめ

- 公開済み試験は変更不可
- Attempt 開始後の条件は固定
- 正解は必ず1つ
- モジュール順序は固定
- 行動計測は「材料」であり断定に使わない

---

## 14. 次に読むべき資料

- `04_auth_and_access_control.md`
  （認証・認可・環境別ログイン仕様）
