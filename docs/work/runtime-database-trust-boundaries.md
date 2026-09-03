# Runtime And Database Trust Boundaries

## Snapshot

- Status: complete
- Priority: P0
- Plan: `docs/superpowers/plans/2026-08-30-runtime-database-trust-boundaries-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-30-whole-project-quality-and-complexity-remediation-design.md`
- Last verified: 2026-08-30 against the focused runtime, commerce,
  relationship-error, GraphQL-error, and community-storage suites.

## Batch Outcome

Configured Phoenix authority, finite commerce facts, mapped relationships, and
community storage constraints fail closed at both the application and database
boundaries without host-header trust, sibling-domain cookie sharing, preflight
relationship queries, or generic constraint machinery.

## Completion Evidence

- Same-origin enforcement now derives canonical scheme, host, and effective
  port from configured endpoint authority. A forged request `Host` plus
  matching `Origin` is rejected, while exact configured trusted origins remain
  supported.
- Production requires a valid explicit `PHX_HOST`. Session cookies are
  host-only by default and use `SESSION_COOKIE_DOMAIN` only when deployment
  explicitly configures cross-subdomain sharing.
- Decimal schema fields use a shared Ecto type that turns `NaN` and both
  infinities into ordinary cast errors without rewriting input maps. Shared
  boundary parsing rejects the same values once, while finite-aware PostgreSQL
  checks reject direct bypass writes and preserve nullable values and finite
  signed deltas.
- Product, product-taxon, and community-report changesets map every cast
  foreign key without relationship preflight queries. GraphQL changeset error
  fields now reuse the existing camelCase normalizer.
- Community write receipt and window tests now prove key shape, digest length,
  non-negative counts, and UTC-hour alignment through both changesets and
  named PostgreSQL checks; the existing schemas required no behavior change.
- The complete focused outcome command passed 149 tests with zero failures on
  `MIX_TEST_PARTITION=quality_runtime`.
- `mix typecheck`, `mix format --check-formatted`, and `git diff --check`
  passed.
