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
- `mix precommit`
- `mix ci`

## Planning Docs

- `2026-03-03-product-compare-backend-mvp-plan.md`
- `backend_starting_guide.md`
- `starting_schema.dbml`
