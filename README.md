# go-ton-v2

社内SPIアプリの開発リポジトリです。Docker Compose 前提で動作します。

## Prerequisites

- Docker / docker compose
- Node.js (コンテナ内で使用)

## Windows Setup

Windows で開発する場合は WSL2 を利用します。

- Docker Desktop をインストールし、WSL2 バックエンドを有効化
- WSL2 (Ubuntu など) を用意し、リポジトリは WSL2 のホーム配下に配置
  - 例: `/home/<user>/projects/go-ton-v2`
- 以降のコマンドは WSL2 上のシェルで実行

## Environment Variables

Docker Compose で設定しています。

- `DATABASE_URL` (app): `postgresql://postgres:postgres@db:5432/go-ton?schema=public`
- `NODE_ENV` (app): `development`
- `E2E_BASE_URL` (e2e): `http://app:3000`
- `NODE_ENV` (e2e): `test`

## Seed Data

`make migrate` または `make seed` で以下が投入されます。

- exam_modules: `VERBAL`, `NONVERBAL`, `ENGLISH`, `STRUCTURAL`, `PERSONALITY`
- staff_roles: `ADMIN`, `AUTHOR`, `PROCTOR`, `REPORT_VIEWER`
- staff_users: `e2e-staff@example.com` (is_active=true)
- candidates: `E2E Candidate`
- visit_slots: `2030-01-01T09:00:00Z` - `2030-01-01T12:00:00Z`
- tickets: `E2E-TICKET-0001` (PIN: `19900101`, status: `ACTIVE`)

## Make Commands

### 起動/停止

```bash
make up
make down
```

- `make up`: app/db/e2e を build して起動します。
- `make down`: compose を停止します。

### DB

```bash
make migrate
make seed
make generate
```

- `make migrate`: Prisma migrate を実行します（seed が設定されている場合は実行されます）。
- `make seed`: Prisma seed のみ実行します。
- `make generate`: Prisma client を生成します。

### DB確認（直接確認）

```bash
docker compose exec db psql -U postgres -d go-ton
```

- テーブル一覧: `\dt`
- 例: `SELECT * FROM staff_users LIMIT 5;`

### E2E

```bash
make test-e2e
```

- `make test-e2e`: Playwright の E2E を Docker で実行します。

## ログイン動線（開発用）

### UI

- Candidate ログイン: `http://localhost:3000/candidate-login`
- Staff dev ログイン: `http://localhost:3000/staff-dev-login`

### API

- Staff test ログイン: `POST /api/staff/test-login`（`NODE_ENV=test` のみ）
