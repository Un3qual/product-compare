# Attribution Observability And Affiliate Click References

## Snapshot

- Status: active
- Priority: P1
- Owner: `codex/attribution-observability-libraries`
- Plan: `docs/superpowers/plans/2026-08-01-attribution-observability-and-affiliate-click-references-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-01-attribution-observability-and-foundation-libraries-design.md`
- Last verified: 2026-08-01 against current click-session storage, redirect decoration, conversion adapters, revenue GraphQL, and revenue route behavior.

## Target Outcome

Operators always see real revenue totals and can trace individual clicks to users, raw request diagnostics, affiliate-network references, and matched conversions. CJ, Impact, Awin, and Rakuten receive their documented publisher click reference; Amazon and unknown networks are not dynamically decorated.

## Validated Scope

- Click sessions already have a unique public UUID and optional user association.
- The GraphQL click mutation associates signed-in users; the direct fallback currently does not load the session.
- Click sessions persist raw `referrer`, `user_agent`, and Phoenix-resolved `ip_address`; the unreleased hash-named storage had no production hashing writer and was replaced in place.
- Revenue summaries return their calculated metrics to operators at every conversion volume; no threshold or suppression metadata remains.
- The operator route exposes only the aggregate summary.
- Impact currently writes ProductCompare's UUID into network-generated `ClickId`; official Impact publisher reporting uses `subId1`.
- Official mappings are CJ `sid`, Impact `subId1`, Awin `clickref`, and Rakuten `u1`.
- Amazon tags are pre-issued and its policy forbids dynamically associating a sub-tag with a specific end user.

## Boundaries

- Keep public identities, logs, secrets, auth, same-origin, URL safety, and provider raw evidence protected.
- Persist raw referrer, user agent, and Phoenix-resolved IP, but do not log or publicly expose them.
- Add no anonymous fingerprint/cookie, generic network parameter, provider poller, or Amazon tag generator.
- Keep summary and ledger filters aligned and use forward Relay pagination.

## Verification

- focused attribution domain, click/controller, summary, ledger, seed, and GraphQL query-count suites
- focused revenue route, loader, data, Relay pagination, and tracked-click frontend suites
- Relay generation, frontend check, backend formatting/types/quality/full coverage
- `mix work_queue.validate`
- `git diff --check`

## Evidence

- Design commits: `7db814a8`, `283dce78`, `d404117d`.
- Task 1: focused domain, summary GraphQL, batching, development-seed, and revenue-route tests pass after Relay generation; one-conversion summaries expose clicks, conversions, order value, commission, average paid price, and currency.
- Task 2: click sessions store raw referrer, user-agent, and Phoenix-resolved remote IP values; GraphQL and direct fallback clicks share one request-diagnostics boundary, and the fallback preserves a signed-in session user without adding anonymous tracking. Focused attribution, context, GraphQL, redirect, and seed suites pass after a test-environment-only reset of the unreleased attribution migration.
- Task 3: active affiliate redirects replace only CJ `sid`, Impact `subId1`, Awin `clickref`, or Rakuten `u1` with the public click UUID (Rakuten uses reversible UUID hex). The closed mapping leaves Amazon, custom or nil-network, and non-affiliate destinations unchanged; focused attribution and redirect-controller suites pass.
