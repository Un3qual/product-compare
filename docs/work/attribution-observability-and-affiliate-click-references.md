# Attribution Observability And Affiliate Click References

## Snapshot

- Status: complete
- Priority: P1
- Owner: `codex/attribution-observability-libraries`
- Plan: `docs/superpowers/plans/2026-08-01-attribution-observability-and-affiliate-click-references-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-01-attribution-observability-and-foundation-libraries-design.md`
- Last verified: 2026-08-03 with the affected attribution suites and complete repository gates.

## Batch Outcome

Operators always see real revenue totals and can trace individual clicks to users, raw request diagnostics, affiliate-network references, and matched conversions. CJ, Impact, Awin, and Rakuten receive their documented publisher click reference; Amazon and unknown networks are not dynamically decorated.

## Validated Scope

- Click sessions already have a unique public UUID and optional user association.
- The GraphQL click mutation associates signed-in users; the direct fallback currently does not load the session.
- Click sessions persist raw `referrer`, `user_agent`, and Phoenix-resolved `ip_address`; the unreleased hash-named storage had no production hashing writer and was replaced in place.
- Revenue summaries return their calculated metrics to operators at every conversion volume; no threshold or suppression metadata remains.
- The operator route exposes the aggregate summary and a paginated individual click/conversion ledger.
- Impact uses publisher-controlled `subId1` for ProductCompare's UUID and retains Impact's network-generated `ClickId` as provider evidence.
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
- Task 4: focused CJ, Impact, Awin, and Rakuten adapters normalize already-fetched provider payloads through the shared click-reference decoder and existing conversion ingestion boundary. The explicit local transaction shapes are CJ `commissionId` / `actionStatus` / `saleAmount` / `commissionAmount` / `eventDate` / `postingDate`, Awin `id` / `commissionStatus` / nested sale and commission amounts / `transactionDate` / `validationDate`, and Rakuten `transactionId` / `status` / `saleAmount` / `commissionAmount` / `transactionDate` / `processDate`. Valid publisher references hydrate click dimensions with high confidence; blank or malformed references remain unmatched without losing provider evidence; stale updates and click-dimension conflicts retain the existing ingestion behavior. The focused commerce-attribution suite passes with atom- and string-keyed payload coverage.
- Task 5: `commerceAttributionClicks` is a non-null operator-only forward connection ordered by click creation time and ID, with the shared revenue filter model, raw request diagnostics, user-or-anonymous identity, commerce dimensions, and matched conversions. The schema excludes provider raw payloads, destination URLs and campaign parameters, and credential fields. Page-level preloads keep table-level SELECT counts fixed between 2- and 8-node pages; the focused ledger, revenue-summary, and batching suites pass with 59 tests and 0 failures.
- Task 6: the operator revenue route keeps its summary first and passes the same normalized `RevenueSummaryInput` into a Relay `@refetchable` attribution-ledger connection. The ledger renders click, identity, raw request diagnostics, commerce/network, and conversion evidence with explicit anonymous and empty states; Relay owns load-more cursor state, and each changed route filter preloads a fresh null cursor.
- Task 7: a fixed-anchor development-seed regression exposed a stale temporary percentage-drop baseline; `60ba5a63` now promotes that temporary observation to the current time unless preserved local history is later, then restores the fixture timestamp. The isolated regression passes (1 test) and the seed suite passes (50 tests). Fresh final verification: affected backend suite 153 tests, 0 failures; focused frontend suite 5 files and 51 tests passing; `mix format --check-formatted`, `mix typecheck`, `mix work_queue.validate`, and `git diff --check` clean; `mix quality` exits 0 with 3 existing adapter warnings and 2 batching-test refactoring notices; `mix test --cover` 1,130 tests, 0 failures, 85.24% coverage; `mix frontend_check` passes Relay validation, TypeScript, lint, 394-file format check, 104 files/1,518 tests, builds, and the 269,837-byte gzip client bundle under its 300,000-byte budget. The known Node 25 versus pinned Node 24 engine warning remained non-blocking.
