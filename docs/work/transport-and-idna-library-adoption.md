# Transport And IDNA Library Adoption

## Snapshot

- Status: ready
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

- Implementation evidence pending.
