# Authenticated Specification Corrections Implementation Plan

**Goal:** Let authenticated shoppers propose typed, source-explained
specification replacements while keeping current catalog truth operator-
moderated, auditable, and private where appropriate.

**Design:**
`docs/superpowers/specs/2026-07-13-canonical-catalog-and-provenance-design.md`

**Owned paths:**

- `lib/product_compare/specs.ex`
- `lib/product_compare_schemas/specs/product_attribute_claim.ex`
- `lib/product_compare_schemas/specs/specification_correction.ex`
- `lib/product_compare_web/graphql/global_id.ex`
- `lib/product_compare_web/resolvers/specs_resolver.ex`
- `lib/product_compare_web/schema.ex`
- `priv/repo/migrations/*_add_specification_corrections.exs`
- `test/product_compare/specs/corrections_test.exs`
- `test/product_compare_web/graphql/specification_corrections_test.exs`
- `assets/schema.graphql`
- `docs/work/product-trust-and-discovery.md`

## Safety Contract

- Anonymous users cannot propose or read owner-scoped corrections.
- A proposal creates a typed user claim that supersedes the attribute's current
  claim, but never accepts or selects itself.
- Every proposal requires a bounded reason plus either a safe HTTP(S) source
  URL or a bounded explanation. Moderator notes remain private.
- Only operators may list the moderation queue or accept/reject a proposal.
- Acceptance and current-claim selection happen atomically; rejection leaves
  current truth unchanged. Terminal decisions are idempotent only for the same
  decision and cannot be reversed through this API.
- Public product attributes expose aggregate pending/accepted correction state,
  never submitter identity, explanations, or moderation notes.

## Tasks

1. Write failing context and GraphQL tests for authentication, typed value
   validation, safe sources, owner scope, operator scope, public aggregates,
   atomic acceptance, rejection, and terminal replay behavior.
2. Add the correction proposal schema and migration with bounded fields,
   explicit statuses, ownership, moderation audit fields, and one proposal per
   created claim.
3. Add Specs workflows for proposing, listing, aggregating, and atomically
   moderating corrections through the existing claim/current authority.
4. Add typed GraphQL inputs, owner/operator connections, proposal and moderation
   payloads, global IDs, and public aggregate fields.
5. Regenerate the schema and run focused, affected, Relay, type, format, queue,
   and diff gates.

Price watchlists and alerts are the next program milestone after this trusted-
catalog dependency is green.
