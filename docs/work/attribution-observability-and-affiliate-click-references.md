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
- `user_agent_hash` and `ip_hash` exist only as storage/test/seed fields; no production hashing writer exists.
- Revenue suppression currently nulls all metrics below two conversions even though the query is operator-only.
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
- Implementation evidence pending.
