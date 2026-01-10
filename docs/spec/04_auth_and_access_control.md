# 04_auth_and_access_control.md

## 認証・認可仕様（Auth / Access Control）

---

## 1. 本資料の位置づけ

本資料は、社内SPIアプリにおける **認証（Authentication）** と
**認可（Authorization / Access Control）** を定義する。

本資料はセキュリティ事故を防ぐため、**仕様の解釈余地を極力排除**することを目的とする。

---

## 2. 基本方針（不変）

- 認証と認可を混同しない
- 「ログインできる」ことと「操作できる」ことは別物とする
- UI 表示制御だけでなく **サーバ側で必ず権限チェック**を行う
- 環境（production / development / test）ごとに認証経路は異なるが、
  **認可ロジックは全環境で共通**とする

---

## 3. ユーザー種別ごとの認証方式

### 3.1 Staff（運営者）

#### 3.1.1 本番環境（production）

- Google Workspace SSO を使用する
- Auth.js（OIDC）による認証
- Google 側で認証成功後、アプリケーション側で以下を必ず確認する
  - staff_users に該当 email が存在すること
  - is_active=true であること

※ 社内ドメイン一致のみではログイン不可とする。

---

#### 3.1.2 開発環境（development）

開発効率と本番再現性を両立するため、**2系統の認証経路**を持つ。

##### (1) Google SSO（本番同等）

- production と同一の Auth.js フロー
- whitelist / RBAC の最終確認用

##### (2) 開発用ログイン

- 開発時の高速確認用
- staff を選択してログインできる UI を提供する
- 認証の入口が異なるだけで、以下は本番と完全に同一
  - whitelist 判定
  - is_active 判定
  - role 判定

**重要**

- 開発用ログインは `NODE_ENV !== production` の場合のみ有効
- production ビルドには含めない

---

#### 3.1.3 E2E（test）

- Google SSO は使用しない
- テスト専用ログイン API を使用する
- Playwright からのみ呼び出される
- production ではビルド対象外とする

---

### 3.2 Candidate（受験者）

#### 3.2.1 認証方式

- 以下 2 要素を必須とする
  - Ticket（受験票コード / QR）
  - PIN（生年月日）

#### 3.2.2 認証時の検証内容

- Ticket が存在すること
- Ticket の status が ACTIVE であること
- PIN が一致すること（ハッシュ比較）
- Ticket が他の Attempt で使用中でないこと

---

## 4. 認可（Authorization）

### 4.1 Staff ロール

| ロール        | 主な権限                             |
| ------------- | ------------------------------------ |
| ADMIN         | 全操作（staff管理含む）              |
| AUTHOR        | 問題作成・試験編成                   |
| PROCTOR       | 当日運用（再発行、引き継ぎ、ロック） |
| REPORT_VIEWER | 成績閲覧・出力                       |

- staff は複数ロールを持つことができる
- 権限判定は **ロールベース**で行う

---

### 4.2 認可の実施ポイント

以下すべてにおいて、サーバ側で認可を行う。

- Server Actions
- Route Handlers
- ページアクセス（Middleware 等）

UI 側の表示制御は **補助的手段**とする。

---

## 5. Candidate のアクセス制御

### 5.1 Candidate がアクセスできる範囲

- 自身の Attempt に関する画面のみ
- 他の Candidate 情報には一切アクセス不可

### 5.2 Attempt の排他制御

- 同一 Attempt に有効な session は常に1つ
- 引き継ぎ時は、旧 session を無効化してから新 session を発行する

---

## 6. セッション管理

### 6.1 Staff セッション

- Auth.js によるセッション管理
- role 情報はセッションに含めるが、**最終判断はDBを正**とする

### 6.2 Candidate セッション

- AttemptSession による管理
- session は Attempt に強く紐付く
- Attempt が LOCKED の場合、Candidate 操作は不可

---

## 7. セキュリティ上の禁止事項（明文化）

以下は **明確に禁止**する。

- production 環境に開発用 / テスト用ログイン経路を含めること
- whitelist を通さずに staff をログインさせること
- role をクライアント入力で決定すること
- UI 側の制御のみで認可を完結させること

---

## 8. 監査ログとの連携

以下の操作は必ず audit_logs に記録する。

- staff ログイン / ログアウト
- ticket 再発行
- attempt 開始
- attempt 引き継ぎ
- 試験提出
- 採点実行

---

## 9. 認証・認可仕様としての不変条件

- 認証経路は環境ごとに分離する
- 認可ロジックは全環境で共通
- staff 権限は whitelist + role の組み合わせでのみ決定される
- Candidate は ticket + PIN 以外の認証手段を持たない

---

## 10. 次に読むべき資料

- `05_exam_and_state_machine.md`
  （試験進行・状態遷移・引き継ぎ仕様）
