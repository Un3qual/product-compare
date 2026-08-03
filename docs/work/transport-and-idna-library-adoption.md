# Transport And IDNA Library Adoption

## Snapshot

- Status: done
- Priority: P2
- Plan: `docs/superpowers/plans/2026-08-01-transport-and-idna-library-adoption-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-01-attribution-observability-and-foundation-libraries-design.md`
- Last verified: 2026-08-03 against the combined CJ transport, destination URL,
  address-policy, backend, frontend, and work-queue gates.

## Batch Outcome

Req owns CJ HTTP mechanics and `idna` owns Unicode hostname conversion; ProductCompare retains provider-domain normalization and URL/SSRF policy while deleting direct `:httpc` and local punycode code.

## Validated Scope

- The CJ client manually starts `:inets`/`:ssl`, converts strings to charlists, and calls `:httpc`.
- The client already has an injected transport seam and comprehensive non-live tests.
- The destination stack includes a 126-line local punycode encoder plus separate parser and public-address policy modules.
- The backend and frontend maintain distinct URL-safety boundaries; this Elixir batch changes only the backend.

## Boundaries

- Preserve all external result/error, timeout, pagination, secret, URL, port, hostname, IP, and SSRF behavior.
- Add no live provider tests and no wrapper around superseded code.
- Keep Req out of provider-domain normalization and `idna` out of address policy.

## Verification

- CJ client/parser/import/task suites
- destination URL, commerce attribution, and redirect-controller suites
- removed-code scans, dependency checks, backend/full repository gates
- `mix work_queue.validate`
- `git diff --check`

## Evidence

- Task 1 complete: `Req.post/2` now owns CJ HTTP mechanics with an injected
  request contract that preserves the POST endpoint, bearer and JSON headers,
  raw JSON body, 15-second receive timeout, 5-second connect timeout, and
  redirects. Req responses normalize to the existing `%{status:, body:}`
  shape; transport failures remain `{:transport_error, reason}`. The client
  keeps GraphQL, HTTP-status, JSON-decoding, pagination, and secret-redaction
  ownership.
- Added non-live `Req.Test` characterization coverage for success, non-2xx,
  malformed JSON, GraphQL errors, timeout normalization, request construction,
  and token exclusion from errors/logs.
- Verified 2026-08-03: `mix deps.get`; focused CJ client, parser, import, and
  feed-task suites (54 tests, 0 failures); `mix format`; queue validation; and
  `git diff --check`.
- Task 2 complete: `idna` 7.1.0 now owns hostname-to-ASCII conversion. The
  parser normalizes the library charlist result at its boundary, maps all
  library failures to `:error`, and rejects ASCII hostnames over 253 bytes.
  Browser URL syntax, explicit ports, userinfo rejection, IP literal handling,
  and the public-address policy remain in their existing owners; the local
  `DestinationUrl.Punycode` module is deleted.
- Verified 2026-08-03: destination URL, commerce-attribution, and redirect
  controller suites (89 tests, 0 failures); removed-code scan; `mix format`;
  queue validation (`4 ready`); and `git diff --check`.
- Task 3 complete, verified 2026-08-03: `mix deps.unlock --check-unused`;
  combined CJ ingestion/import/feed-task, commerce-attribution, and redirect
  suites (302 tests, 0 failures); `mix format --check-formatted`; `mix
  typecheck`; `mix quality`; `mix test --cover` (1,147 tests, 0 failures;
  85.74% total coverage); `mix frontend_check` (1,520 tests, client/SSR
  builds, and bundle contract); `mix work_queue.validate` (`4 ready`); and
  `git diff --check`. A scoped duplicate request-map cleanup in the CJ client
  restored the ExDNA clone budget without changing its request contract; the
  focused CJ client suite then passed (11 tests, 0 failures).
