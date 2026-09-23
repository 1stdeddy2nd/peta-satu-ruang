# Developer entry points. `make check` is what must pass before a commit.
#
# Caching: eslint keeps its result cache under .cache/, tsc is incremental via
# tsconfig, and `next build` reuses .next/cache. First run is cold; every run
# after that only reprocesses what changed.

.PHONY: install hooks dev build lint typecheck test check e2e verify kill clean db-up db-down db-reset db-migrate db-seed db-studio

CACHE := .cache

install: hooks
	npm install

## Point git at the versioned hooks in .githooks/. The pre-push hook refuses a
## direct push to main — a habit guard while MC-048 stays parked.
hooks:
	@git config core.hooksPath .githooks

## Run the dev server.
dev:
	npm run dev

## Production build. Refuses to run while dev is up — they share .next, and
## building underneath a live dev server leaves it serving 404s.
build:
	@if command -v lsof >/dev/null 2>&1 && lsof -ti:3000 -sTCP:LISTEN >/dev/null 2>&1; then \
		echo "!! dev server is running on :3000 and shares .next with the build."; \
		echo "!! stop it first:  make kill"; \
		exit 1; \
	fi
	npm run build

lint:
	npx eslint . --cache --cache-location $(CACHE)/eslint/

typecheck:
	npx tsc --noEmit

test:
	@echo "no test suite yet — see MC-037"

## --- database (MC-015) -------------------------------------------------
## Local Postgres + PostGIS in Docker. Production is Railway (MC-033).

## Start the database and wait until it actually accepts connections.
db-up:
	docker compose up -d
	@printf "waiting for postgres"; \
	for i in $$(seq 1 40); do \
		if docker compose exec -T db pg_isready -U mapcanva -d mapcanva >/dev/null 2>&1; then \
			echo " ready"; exit 0; fi; \
		printf "."; sleep 1; \
	done; echo " timed out"; exit 1

db-down:
	docker compose down

## Drop the volume too — a clean slate, not just a stopped container.
db-reset:
	docker compose down -v
	$(MAKE) db-up
	$(MAKE) db-migrate
	$(MAKE) db-seed

## Apply migrations and regenerate the client.
db-migrate:
	npx prisma migrate dev

## Create the one account that can sign in.
db-seed:
	npx prisma db seed

db-studio:
	npx prisma studio

## Run the walkthroughs as a regression gate, in parallel. E2E_WORKERS=n to pin.
## Whole set:  make e2e           One ticket:  make e2e T=MC-003
e2e:
	@if command -v lsof >/dev/null 2>&1 && lsof -ti:3000 -sTCP:LISTEN >/dev/null 2>&1; then \
		echo "!! port 3000 is busy — the run serves a production build there."; \
		echo "!! stop the dev server first:  make kill"; \
		exit 1; \
	fi
	@set -o pipefail; npx playwright test $(T) 2>&1 | tee e2e/run.log
	@node scripts/check-server-errors.mjs e2e/run.log

## Record acceptance walkthroughs (MC-038). One video per ticket, in e2e/videos/.
## Recording runs serially so the captions stay readable.
## Whole set:  make verify        One ticket:  make verify T=MC-003
verify:
	@if command -v lsof >/dev/null 2>&1 && lsof -ti:3000 -sTCP:LISTEN >/dev/null 2>&1; then \
		echo "!! port 3000 is busy — the recording serves a production build there."; \
		echo "!! stop the dev server first:  make kill"; \
		exit 1; \
	fi
	E2E_RECORD=1 E2E_WORKERS=1 npx playwright test $(T)
	@node e2e/collect-videos.mjs

## Everything that guards a commit. Fast checks first so failures surface early.
check: typecheck lint test build
	@echo "✓ check passed"

kill:
	@lsof -ti:3000 -sTCP:LISTEN | xargs -r kill 2>/dev/null || true

clean:
	rm -rf .next $(CACHE) tsconfig.tsbuildinfo e2e/.output e2e/videos e2e/run.log
