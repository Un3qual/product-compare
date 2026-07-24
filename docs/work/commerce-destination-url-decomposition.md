# Commerce Destination URL Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-commerce-destination-url-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against the direct destination-URL and commerce
  attribution characterization paths.

## Target Outcome

`ProductCompare.CommerceAttribution.DestinationUrl.valid?/1` remains the stable
commerce-safety boundary while browser-compatible URI parsing and hostname
canonicalization, public-address policy, and RFC 3492 encoding live in focused
internal modules with unchanged accepted and rejected destinations.

## Ready Evidence

- `lib/product_compare/commerce_attribution/destination_url.ex` is 428 lines
  and combines URI/authority parsing, IDNA and punycode canonicalization, and
  IPv4/IPv6 reserved-address policy behind one public predicate.
- `ProductCompareSchemas.CommerceAttribution.CommerceLink` delegates to the
  stable predicate; click and redirect callers use that schema compatibility
  API.
- The dedicated compatibility test plus commerce-attribution
  characterization gate passed 57 tests on 2026-07-23.
- Parsing, canonicalization, and address exclusion share one outbound
  destination-safety decision and remain internal slices.
- The owned source and tests are disjoint from the other ready rows.

## Internal Slices

1. Browser-compatible HTTP(S) URI and authority parsing.
2. IDNA separator, percent-decoding, NFKC, and hostname canonicalization.
3. IPv4, IPv6, mapped-address, localhost, and reserved-range policy.
4. RFC 3492 punycode encoding.
5. Stable predicate and schema compatibility parity.

## Boundaries

- Preserve `valid?/1`, accepted/rejected values, browser backslash handling,
  userinfo rejection, explicit-port bounds, IDNA normalization, IPv4 number
  formats, IPv6 mapping, reserved ranges, and malformed-input failure.
- Preserve the current documented non-goal: this is not a full UTS 46 IDNA
  mapping layer.
- Keep schema and production callers dependent only on the stable predicate.
- Do not add DNS or network resolution, dependencies, schemas, migrations,
  commerce policy, GraphQL, controllers, or frontend behavior.

## Verification

- `mix test test/product_compare/commerce_attribution/destination_url_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

## Completion Evidence

- Completed on 2026-07-23 on the aggregate detached-worktree commit stack.
- The stable predicate facade is 20 lines.
- `Parser` is 122 lines, `AddressPolicy` is 157 lines, and `Punycode` is 126
  lines.
- The exact characterization gate passed 57 tests with no failures.
- One full-gate run encountered an isolated 250-millisecond scheduler timing
  miss; that 9-test scheduler suite immediately passed independently.
- The clean `mix ci` rerun passed 913 backend tests at 83.47% coverage and
  1,507 frontend tests, plus every quality, duplication, type, Relay, build,
  and bundle gate.
- `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check` passed.
- Schema and production callers continue to use only the stable predicate.
