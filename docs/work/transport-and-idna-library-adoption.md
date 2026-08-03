# Transport And IDNA Library Adoption

## Snapshot

- Status: active
- Priority: P2
- Plan: `docs/superpowers/plans/2026-08-01-transport-and-idna-library-adoption-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-01-attribution-observability-and-foundation-libraries-design.md`
- Last verified: 2026-08-01 against the CJ client, destination parser, address policy, and their focused suites.

## Target Outcome

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
- Remaining scope: Task 2 replaces only the destination URL local punycode
  encoder with `idna`; its parser and address-policy contract remain untouched
  by this milestone.
