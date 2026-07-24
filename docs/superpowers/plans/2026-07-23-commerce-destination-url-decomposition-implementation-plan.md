# Commerce Destination URL Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompare.CommerceAttribution.DestinationUrl.valid?/1` as
the stable commerce-safety boundary while moving parsing, address policy, and
punycode implementation into focused internal modules.

**Architecture:** The existing module remains the sole public predicate.
`Parser` owns browser-compatible URI, authority, and hostname
canonicalization, `AddressPolicy` owns hostname and public-address checks, and
`Punycode` owns the existing bounded RFC 3492 encoder.

**Tech Stack:** Elixir, URI, Erlang `:inet`, ExUnit.

## Global Constraints

- Preserve every accepted and rejected destination and all malformed-input
  failure behavior.
- Preserve backslash handling, userinfo rejection, port bounds, IDNA
  separator normalization, percent-decoding, NFKC, IPv4 number formats,
  IPv6 mapping, reserved ranges, and the current RFC 3492 behavior.
- Keep schema and production callers dependent only on `valid?/1`.
- Do not add DNS/network resolution, dependencies, schemas, migrations,
  commerce policy, GraphQL, controllers, or frontend policy.

---

### Task 1: Punycode Ownership

**Files:**

- Create:
  `lib/product_compare/commerce_attribution/destination_url/punycode.ex`
- Modify: `lib/product_compare/commerce_attribution/destination_url.ex`
- Test:
  `test/product_compare/commerce_attribution/destination_url_test.exs`
- Test:
  `test/product_compare/commerce_attribution/commerce_attribution_test.exs`

**Interfaces:** `Punycode.encode/1` returns the current ASCII encoding for one
Unicode hostname label and remains internal to parser canonicalization.

- [ ] Run the two named suites as the green baseline.
- [ ] Delegate label encoding to the missing owner and observe the expected
  compilation failure.
- [ ] Move the unchanged RFC 3492 constants and encoder into `Punycode`.
- [ ] Re-run the suites and confirm Unicode host acceptance and reserved-host
  rejection remain unchanged.
- [ ] Commit with message `refactor: isolate destination punycode`.

### Task 2: Public Address Policy Ownership

**Files:**

- Create:
  `lib/product_compare/commerce_attribution/destination_url/address_policy.ex`
- Modify: `lib/product_compare/commerce_attribution/destination_url.ex`
- Test:
  `test/product_compare/commerce_attribution/destination_url_test.exs`
- Test:
  `test/product_compare/commerce_attribution/commerce_attribution_test.exs`

**Interfaces:** `AddressPolicy.public_hostname?/1` returns the current hostname
validity, localhost, IPv4, IPv6, mapped-address, and reserved-range decision.

- [ ] Run the two named suites before extraction.
- [ ] Delegate public-host policy and observe the expected missing-owner
  failure.
- [ ] Move hostname labels, IPv4 number parsing, IPv6 parsing and mapping, and
  reserved-range policy into `AddressPolicy`.
- [ ] Re-run the suites and confirm every numeric, mapped, documentation,
  local, malformed, and public host case remains unchanged.
- [ ] Commit with message `refactor: isolate destination address policy`.

### Task 3: URI Parser And Canonicalization Ownership

**Files:**

- Create:
  `lib/product_compare/commerce_attribution/destination_url/parser.ex`
- Modify: `lib/product_compare/commerce_attribution/destination_url.ex`
- Read:
  `lib/product_compare/commerce_attribution/destination_url/punycode.ex`
- Read:
  `lib/product_compare/commerce_attribution/destination_url/address_policy.ex`
- Test:
  `test/product_compare/commerce_attribution/destination_url_test.exs`
- Test:
  `test/product_compare/commerce_attribution/commerce_attribution_test.exs`

**Interfaces:** `Parser.canonical_http_hostname/1` returns
`{:ok, canonical_hostname}` only when the existing syntactic, authority,
userinfo, port, IDNA, and hostname rules accept the URL.

- [ ] Run the two named suites before extraction.
- [ ] Delegate parser ownership and observe the expected missing-owner failure.
- [ ] Move browser backslash normalization, URI parsing, authority/port checks,
  percent-decoding, NFKC, IDNA separators, and label canonicalization into
  `Parser`.
- [ ] Re-run the suites and confirm schemes, whitespace, userinfo, ports,
  browser-compatible URLs, and Unicode hosts remain unchanged.
- [ ] Commit with message `refactor: isolate destination URL parsing`.

### Task 4: Full Contract And Lane Gate

**Files:**

- Modify: `docs/work/commerce-destination-url-decomposition.md`

- [ ] Keep `DestinationUrl.valid?/1` as the only public predicate and delegate
  through `Parser` and `AddressPolicy`.
- [ ] Run the exact 57-test characterization gate.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm schema and production callers still use only the stable
  predicate.
- [ ] Record final ownership, module sizes, exact test count, and gate results
  in the lane doc and include it in the final code/test milestone commit.
