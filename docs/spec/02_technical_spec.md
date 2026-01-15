# 02_technical_spec.md

## ChangeLog

- 2026-01-10: バリデーション（Zod）、ORM（Prisma）、フォーム管理（React Hook Form）を明記
- 2026-01-10: UIコンポーネント（MUI）とスタイリング方針（MUI System + theme）を明記
- 2026-01-10: MUIの導入範囲（Core/Icon/X系の扱い）を詳細化
- 2026-01-10: Auth.js（Google SSO）の実装方針とセッション設計を明文化
- 2026-01-10: Auth.js 本番SSOの環境変数を明記
- 2026-01-10: Auth.js 本番SSOの境界と理由（whitelist / roleの正はDB）を追記
- 2026-01-11: QRコードの署名仕様を追記
- 2026-01-11: 試験構成の呼称を「モジュール」から「セクション」に統一

## 技術仕様（アーキテクチャ・技術方針）

---

## 1. 本資料の位置づけ

本資料は、`01_application_spec.md` に定義された業務仕様を **どのような技術構成で満たすか** を示す。
実装担当者は、本資料を **技術的な判断の最上位根拠**として扱うこと。

---

## 2. 全体方針（重要）

### 2.1 方針の要点

- フルスタックは **Next.js に集約**する
- フロントエンドとバックエンドを技術的に分離しない（APIサーバ分離は行わない）
- ただし **責務分離（設計上の分離）は厳密に行う**
- ローカル開発・CI・本番で **同一構成が再現できる**ことを最優先とする

---

## 3. 採用技術スタック（確定）

### 3.1 アプリケーション

- **Next.js（App Router）**
- TypeScript（strict: true）
- React（Server Components / Client Components 併用）

### 3.2 認証・認可

- Auth.js（旧 NextAuth、v5系想定）
- Google Provider（OIDC）
- 独自 whitelist + RBAC（アプリケーション側で制御）

### 3.3 DB / ORM

- **PostgreSQL 16**
- Prisma ORM
- JSONB を積極的に利用（イベント・監査・メタデータ）

### 3.4 テスト

- Unit / Integration：Node.js + DB
- **E2E：Playwright（必須）**

### 3.5 バリデーション / フォーム

- バリデーション：Zod
- フォーム/入力管理：React Hook Form

### 3.6 ORM

- Prisma ORM

### 3.7 UI / スタイリング

- UIコンポーネント：MUI
- スタイリング：MUI System（`sx`）+ theme で統一
- 導入範囲:
  - MUI Core（`@mui/material`）を基本コンポーネントとして使用
  - アイコンは `@mui/icons-material` を使用
  - データ表示が必要な画面は MUI X のコミュニティ版を使用（`@mui/x-data-grid`, `@mui/x-charts`）
  - 追加のUIライブラリは導入しない

---

## 4. インフラ構成（AWS想定）

### 4.1 本番環境

- アプリケーション：コンテナ実行
  - ECS（Fargate）または App Runner
- DB：Amazon RDS for PostgreSQL
- オブジェクトストレージ：Amazon S3
  - エクスポート
  - テスト成果物
- ログ・監視：CloudWatch

※ 本資料では IaC（Terraform等）の詳細は扱わないが、
**コンテナ前提であることは不変条件**とする。

---

## 5. Docker 利用方針（確定）

### 5.1 開発環境

- Docker + docker compose を必須とする
- ローカルPCに直接 DB をインストールしない
- 以下のサービスを compose で起動する
  - app（Next.js）
  - db（PostgreSQL）
  - e2e（Playwright）

### 5.2 CI

- CI上でも docker build / docker compose を使用する
- 「ローカルでは動くがCIで壊れる」構成を許容しない

---

## 6. 環境別の認証経路（技術仕様として明文化）

### 6.1 本番環境（production）

- Google Workspace SSO のみを使用
- 開発用・テスト用ログイン経路は **存在してはならない**

---

### 6.2 開発環境（development）

以下 **2種類のログイン経路**を持つ。

#### (1) Google SSO（本番同等）

- 本番と同じ Auth.js フロー
- whitelist / RBAC の最終確認用

#### (2) 開発用ログイン（高速確認用）

- 開発時の動作確認を高速化する目的
- staff を選択してログインできる UI を提供
- 認可ロジック（whitelist / role）は本番と同一

※ 開発用ログインは **production ビルドに含めない**

---

### 6.3 E2E（test）

- Google SSO は使用しない
- テスト専用ログイン API を使用
- Playwright からのみ利用される
- production ではビルド対象外とする

---

### 6.4 Auth.js 実装方針（production / development 共通）

- App Router の Route Handler として `/api/auth/[...nextauth]` を使用する
- Auth.js v5（Auth.js）を採用し、Provider は Google（OIDC）のみ
- 認証の成否は Auth.js の `signIn` コールバックで判断し、以下を満たさない場合は拒否する
  - staff_users に該当 email が存在する
  - is_active=true
- セッション方式は JWT を採用し、セッションには以下のみを含める
  - staffUserId
  - email
  - roleCodes（参照用）
- 役割情報は毎回 DB を正として取得する（セッションの role は参照用に限る）
  - 理由: role / is_active の変更は即時反映が必要なため

#### 6.4.1 本番SSOの境界と理由（補足）

- Auth.js の入口は `/api/auth/[...nextauth]` に統一する
  - 理由: App Router の標準導線に揃え、認証経路を明示するため
- whitelist / is_active の判定は Auth.js の `signIn` コールバックで必ず行う
  - 理由: Google 側で成功しても、社内運用として許可されていない staff を排除する必要があるため
- セッションは JWT を採用し、role は参照用・正はDBとする
  - 理由: role / is_active の変更を即時に反映し、運用上の取り消しを遅延させないため

**重要**

- development では Google SSO を動かすが、開発用ログイン UI / API は別経路として保持する
- production ビルドには dev/test ログイン経路を含めない

### 6.5 Auth.js 環境変数（production）

本番環境では以下を必須とする。

- `AUTH_SECRET`
- `AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

---

## 6.6 QRコード仕様（Candidate）

- QRコードのペイロードは **ticket_code と署名**のみを含む
- 署名は `AUTH_SECRET` を用いた HMAC-SHA256 とする
- 形式: `<ticket_code>.<signature>`
  - signature は base64url でエンコードする
- PIN などの個人情報は **QRコードに含めない**

## 7. API / 処理方式

### 7.1 Server Actions

- 管理系操作（CRUD、公開、引き継ぎなど）に使用
- 認可が明確で頻度が低い処理向け

### 7.2 Route Handlers

- 高頻度・リアルタイム性が必要な処理に使用
  - 行動計測イベント（telemetry）
- 明示的な認証・認可チェックを必須とする

---

## 8. 状態管理・トランザクション方針

### 8.1 トランザクション必須の操作

以下は **必ずトランザクション**で実装する。

- チケット使用開始
- Attempt 開始
- 試験提出
- 採点・スコア確定
- 端末引き継ぎ（旧セッション無効化 + 新セッション発行）
- 行動イベント記録と metrics 更新（同時更新の場合）

---

## 9. スナップショット設計（重要）

### 9.1 基本方針

- 受験開始時点の条件は **Attempt に固定**する
- 試験内容・配点・時間配分が後から変わっても、
  **既存 Attempt には影響しない**

### 9.2 対象

- 出題問題
- 配点
- セクション構成
- 時間配分

---

## 10. セキュリティ・信頼性

### 10.1 セキュリティ

- PIN は必ずハッシュ化して保存
- セッションは AttemptSession 単位で管理
- 権限チェックは UI だけでなくサーバ側で必須

### 10.2 信頼性

- 端末トラブルを前提とした引き継ぎ設計
- 計測値は「推定指標」として扱い、断定ロジックは持たない

---

## 11. 技術仕様としての不変条件

- PostgreSQL を使用する
- Docker / compose を前提とする
- E2E（Playwright）を必須とする
- production に dev / test 専用機構を含めない
- 公開済み試験は変更不可（改訂運用）

---

## 12. 次に読むべき資料

- `03_data_model.md`
  （本アプリの全データモデル・不変条件定義）
