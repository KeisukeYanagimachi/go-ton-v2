# 05_exam_and_state_machine.md

## 試験進行・状態遷移仕様（Exam / Attempt / Module）

---

## ChangeLog

- 2026-01-10: Candidate 試験開始時の Attempt 作成タイミングとスナップショット範囲を明文化

## 1. 本資料の位置づけ

本資料は、社内SPIアプリにおける **試験進行ロジックと状態遷移** を定義する。
状態遷移はアプリの正当性・信頼性に直結するため、**本資料は厳密に遵守**すること。

---

## 2. 試験定義の状態遷移（ExamVersion）

### 2.1 ExamVersion 状態

ExamVersion は以下の状態を持つ。

| 状態      | 説明                       |
| --------- | -------------------------- |
| DRAFT     | 編集可能な状態             |
| PUBLISHED | 公開済み・受験可能         |
| ARCHIVED  | 過去バージョン（参照のみ） |

### 2.2 遷移ルール

- DRAFT → PUBLISHED
- PUBLISHED → ARCHIVED
- 逆方向遷移は禁止

### 2.3 不変条件

- PUBLISHED の ExamVersion は **一切編集不可**
- 試験実施は常に PUBLISHED の ExamVersion に対して行う

---

## 3. Attempt の状態遷移

### 3.1 Attempt 状態

Attempt は以下の状態を持つ。

| 状態        | 説明                 |
| ----------- | -------------------- |
| NOT_STARTED | 作成済みだが未開始   |
| IN_PROGRESS | 受験中               |
| LOCKED      | 引き継ぎ等で一時停止 |
| SUBMITTED   | 提出済み             |
| SCORED      | 採点済み             |
| ABORTED     | 中断・無効           |

---

### 3.2 Attempt 状態遷移図（論理）

```
NOT_STARTED
↓
IN_PROGRESS ←→ LOCKED
↓
SUBMITTED
↓
SCORED

IN_PROGRESS → ABORTED
LOCKED → ABORTED
```

### 3.3 遷移ルール

- NOT_STARTED → IN_PROGRESS
  - Candidate が認証に成功し試験開始
- IN_PROGRESS → LOCKED
  - staff が引き継ぎ操作を実行
- LOCKED → IN_PROGRESS
  - 新端末で再開
- IN_PROGRESS → SUBMITTED
  - 受験完了・提出
- SUBMITTED → SCORED
  - 採点処理完了
- IN_PROGRESS / LOCKED → ABORTED
  - 運営判断による中断

**禁止**

- SUBMITTED 以降の状態から他状態へ戻ること
- SCORED 後の再採点

---

## 4. モジュール進行（SPI3準拠）

### 4.1 モジュール構成

- 常に以下4モジュールを実施する
  - VERBAL
  - NONVERBAL
  - ENGLISH
  - STRUCTURAL

### 4.2 実施順序

- `exam_version_modules.position` の昇順で実施
- 受験者は順序を選択できない
- モジュールを飛ばすことは禁止

---

### 4.3 モジュール進行ルール

- モジュール開始時にタイマーを開始
- モジュール終了条件
  - 制限時間超過
  - 最終問題完了

終了後は自動的に次モジュールへ遷移する。

---

## 5. モジュールタイマー

### 5.1 基本仕様

- モジュールごとに独立した制限時間を持つ
- Attempt 開始時点で **残り時間をスナップショット**として保持する

### 5.2 AttemptModuleTimer（論理）

- module_id
- time_limit_seconds
- remaining_seconds
- started_at
- ended_at

### 5.3 不変条件

- 残り時間はマイナスにならない
- LOCKED 中はタイマーを進めない
- 再開時は remaining_seconds から再開する

---

## 6. 出題進行

### 6.1 問題順

- 各モジュール内の問題は `exam_version_questions.position` 順
- 出題順は Attempt 開始時に確定

### 6.2 戻り操作

- 同一モジュール内での「前の問題に戻る」可否は UI 設計次第
- ただし、**モジュールを跨いで戻ることは禁止**

---

## 7. 引き継ぎ（Takeover）

### 7.1 発生条件

- PCトラブル
- ブラウザクラッシュ
- ネットワーク不安定

### 7.2 引き継ぎ手順（論理）

1. staff が Attempt を LOCKED にする
2. 旧 AttemptSession を無効化
3. 新端末で AttemptSession を発行
4. Attempt を IN_PROGRESS に戻す
5. Candidate が続きから再開

### 7.3 引き継ぎ時に保持すべき情報

- Attempt 状態
- 現在モジュール
- 回答内容
- モジュール残り時間
- 行動計測データ

---

## 8. 提出処理

### 8.1 提出条件

- 最終モジュール終了時
- または staff 判断による強制提出

### 8.2 提出時の処理

- Attempt 状態を SUBMITTED に変更
- 以降、Candidate 操作は不可
- 採点処理を実行

---

## 9. 採点処理

### 9.1 採点タイミング

- SUBMITTED → SCORED の遷移時

### 9.2 採点ルール

- 問題単位で正誤判定
- モジュール単位・全体で集計
- 採点結果は不変（再計算不可）

---

## 10. 状態遷移としての不変条件まとめ

- 試験進行は **状態遷移で厳密に管理**
- 公開済み試験は変更不可
- Attempt 開始後の条件は固定
- LOCKED 中は Candidate 操作不可
- SCORED 後の変更は禁止

---

## 11. Attempt 作成タイミングとスナップショット（追加）

### 11.1 Attempt 作成タイミング

- Candidate が **「試験開始」操作を実行した時点**で Attempt を作成する
- 認証直後に作成しない（未開始 Attempt の無制限増加を防ぐ）

### 11.2 Attempt 初期状態

- 作成直後の status は `NOT_STARTED`
- 試験開始処理の中で `IN_PROGRESS` に遷移する

### 11.3 Attempt 開始時に作成するスナップショット

- Attempt 開始時点で以下を **全て作成**する
  - `attempt_items`（出題内容・配点・順序）
  - `attempt_module_timers`（モジュール残り時間）
- 「モジュール開始時に順次作成」などの遅延作成は行わない

---

## 11. 次に読むべき資料

- `06_telemetry_spec.md`
  （行動計測・時間計測仕様）
