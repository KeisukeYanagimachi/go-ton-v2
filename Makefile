.PHONY: up down migrate seed generate test test-unit test-integration test-e2e

up:
	docker compose up -d --build

down:
	docker compose down

migrate:
	docker compose exec app npm run db:migrate

seed:
	docker compose exec app npm run db:seed

generate:
	docker compose exec app npm run db:generate

test:
	docker compose exec app npm run test

test-unit:
	docker compose exec app npm run test:unit

test-integration:
	docker compose exec app npm run test:integration

test-e2e:
	docker compose up -d app-e2e
	docker compose exec app-e2e npm run db:generate
	docker compose run --rm e2e
