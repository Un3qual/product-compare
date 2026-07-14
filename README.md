# ProductCompare Backend

Phoenix modular-monolith backend for collaborative, AI-assisted product comparison.

## Stack

- Elixir 1.19.x
- Erlang/OTP 28
- Phoenix 1.8.x
- PostgreSQL 18
- Nix dev shell + Docker Compose

## Local Development

1. Enter nix shell:
   ```bash
   XDG_CACHE_HOME=$PWD/.cache nix --extra-experimental-features 'nix-command flakes' develop
   ```
2. Start Postgres 18:
   ```bash
   docker compose up -d db
   ```
3. Install dependencies and setup DB:
   ```bash
   mix setup
   ```
4. Run server:
   ```bash
   mix phx.server
   ```

Default DB URLs are configured for `localhost:5433`.

## Operator-access upgrade decision

The migration that adds `users.is_operator` never infers operator ownership
from an email address, password hash, or reputation. Before deploying that
migration to a database containing `admin@example.com` or
`moderator@example.com`, inspect the target database and decide explicitly
which existing user IDs, if any, are trusted operators. For example:

```sql
SELECT users.id, users.email, users.inserted_at, user_reputation.points
FROM users
LEFT JOIN user_reputation ON user_reputation.user_id = users.id
WHERE users.email IN ('admin@example.com', 'moderator@example.com')
ORDER BY users.id;
```

Account ownership must be verified outside the database as appropriate for the
deployment; the legacy email and reputation values are not proof of ownership.
Set `PRODUCT_COMPARE_OPERATOR_USER_IDS` for the migration to one of:

- A canonical comma-separated list of unique, positive, existing database user
  IDs to promote, with no whitespace, such as `12,34`.
- The literal `none` to acknowledge explicitly that no legacy account should be
  promoted.

Missing, malformed, duplicate, non-positive, or nonexistent IDs make the
migration fail and roll back with an actionable error. The variable is not
required when neither legacy staff email exists. It may be removed after the
migration succeeds. Fresh development and test databases continue to create
trusted seed operators through the transactional seed bootstrap.

## Context Boundaries

- `ProductCompare.Accounts` - users and reputation
- `ProductCompare.Taxonomy` - taxonomies, taxons, closure, tagging
- `ProductCompare.Catalog` - brands and products
- `ProductCompare.Specs` - attributes, units, claims, current selection, filtering
- `ProductCompare.Pricing` - merchants, listings, price history
- `ProductCompare.Affiliate` - networks, programs, links, coupons
- `ProductCompare.Discussions` - threads, posts, reviews

Schema modules live under `ProductCompareSchemas` and remain schema-only.

## Commands

- `mix test`
- `mix typecheck`
- `mix quality`
- `mix precommit` - formats the backend, runs all backend checks and tests, then
  runs the complete frontend gate.
- `mix ci` - checks backend formatting, runs all backend checks and tests, then
  runs the complete frontend gate.
- `cd assets && bun run check` - validates Relay artifacts, type-checks, runs
  all unit tests, builds the client and SSR bundles, and verifies the client
  bundle contract.
- `cd assets && bun run test:e2e` - runs the service-dependent Playwright suite
  separately from the deterministic frontend gate.

## Planning Docs

- `2026-03-03-product-compare-backend-mvp-plan.md`
- `backend_starting_guide.md`
- `starting_schema.dbml`
