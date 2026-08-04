# Transport And IDNA Library Adoption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete ProductCompare's hand-built CJ HTTP transport and punycode encoder by adopting Req and `idna` while preserving every external client and destination-safety contract.

**Architecture:** Keep CJ query construction/response normalization and ProductCompare URL/address policy in their current owners. Req owns HTTP mechanics; `idna` owns Unicode hostname conversion. Characterization tests form the boundary, and superseded code is deleted rather than wrapped.

**Tech Stack:** Elixir 1.19, Req, `idna`, Phoenix/Ecto application, ExUnit.

## Global Constraints

- Make no live provider requests in tests.
- Preserve the CJ client's public results, pagination, injected transport seam, explicit timeout behavior, non-2xx/GraphQL/JSON errors, and secret-safe error/log behavior.
- Preserve accepted schemes, browser-compatible URL parsing, explicit port rules, IP literal handling, private/reserved address denial, and final redirect validation.
- Do not move CJ domain normalization into Req and do not move SSRF policy into `idna`.
- Delete direct `:httpc`/`:inets`/`:ssl` startup and the local punycode module after tests pass.
- Commit code, dependency lock, tests, and lane evidence together.

---

### Task 1: Replace CJ `:httpc` With Req

**Files:**

- Modify: `mix.exs`
- Modify: `mix.lock`
- Modify: `lib/product_compare/ingestion/sources/cj/client.ex`
- Modify: `test/product_compare/ingestion/sources/cj/client_test.exs`
- Modify: `docs/work/transport-and-idna-library-adoption.md`

- [ ] **Step 1: Add failing transport characterizations**

Extend the injected-transport tests to assert method, URL, bearer header, JSON content type/body, timeout/redirect options, and the normalized `%{status:, body:}` response. Add a Req test-adapter case for success, non-2xx, timeout/transport failure, malformed JSON, and GraphQL errors. Assert the configured token is absent from returned errors and captured logs.

```bash
mix test test/product_compare/ingestion/sources/cj/client_test.exs
```

Expected before implementation: the default transport uses `:httpc` and cannot use the Req test adapter/options.

- [ ] **Step 2: Add Req and replace the transport**

Add `{:req, "~> 0.7"}`. Keep the current request map as the injected seam or replace it with one equally small explicit request contract. Implement the default with `Req.post/2`, converting Req's response into the existing `%{status:, body:}` shape and normalizing Req errors to `{:transport_error, reason}`. Preserve explicit receive/connect timeouts and automatic redirects.

Remove `Application.ensure_all_started/1`, charlist conversion, and `:httpc.request/4`. Do not log request headers or bodies.

- [ ] **Step 3: Verify and commit Req adoption**

```bash
mix deps.get
mix test test/product_compare/ingestion/sources/cj/client_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs test/mix/tasks/product_compare_ingestion_cj_import_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs
mix format
git diff --check
git add mix.exs mix.lock lib/product_compare/ingestion/sources/cj/client.ex test/product_compare/ingestion/sources/cj/client_test.exs docs/work/transport-and-idna-library-adoption.md
git commit -m "refactor: use Req for CJ transport"
```

### Task 2: Replace Local Punycode With `idna`

**Files:**

- Modify: `mix.exs`
- Modify: `mix.lock`
- Modify: `lib/product_compare/commerce_attribution/destination_url/parser.ex`
- Delete: `lib/product_compare/commerce_attribution/destination_url/punycode.ex`
- Modify: `test/product_compare/commerce_attribution/destination_url_test.exs`
- Modify: `test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- Modify: `test/product_compare_web/controllers/commerce_redirect_controller_test.exs`
- Modify: `docs/work/transport-and-idna-library-adoption.md`

- [ ] **Step 1: Add failing IDNA boundary cases**

Characterize Unicode labels, full-width dot separators, already-punycoded labels, percent-decoded labels, uppercase normalization, invalid code points, empty/overlong labels, overlong domains, IPv4/IPv6 literals, explicit ports, userinfo rejection, and private/reserved host denial. Assert `DestinationUrl.valid?/1` returns false instead of raising for every invalid input.

```bash
mix test test/product_compare/commerce_attribution/destination_url_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs
```

- [ ] **Step 2: Add `idna` and delete Punycode**

Add `{:idna, "~> 7.1"}`. Replace only Unicode hostname-to-ASCII conversion in `Parser` with the library's safe API, normalize its charlist/binary result at the boundary, and map every library failure to `:error`. Keep URL syntax and `AddressPolicy` unchanged. Delete the local encoder and remove its alias.

- [ ] **Step 3: Verify deletion and commit**

```bash
mix deps.get
mix test test/product_compare/commerce_attribution/destination_url_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs
rg -n "DestinationUrl.Punycode|:httpc|ensure_all_started\(:inets|ensure_all_started\(:ssl" lib test
mix format
git diff --check
git add mix.exs mix.lock lib/product_compare/commerce_attribution/destination_url test/product_compare/commerce_attribution test/product_compare_web/controllers/commerce_redirect_controller_test.exs docs/work/transport-and-idna-library-adoption.md
git commit -m "refactor: use idna for destination hosts"
```

The `rg` command must find no removed transport or punycode implementation references.

### Task 3: Batch Verification And Handoff

- [ ] **Step 1: Run affected suites and dependency checks**

```bash
mix deps.unlock --check-unused
mix test test/product_compare/ingestion test/mix/tasks/product_compare_ingestion_cj_import_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs test/product_compare/commerce_attribution test/product_compare_web/controllers/commerce_redirect_controller_test.exs
```

- [ ] **Step 2: Run repository gates**

```bash
mix format --check-formatted
mix typecheck
mix quality
mix test --cover
mix frontend_check
mix work_queue.validate
git diff --check
```

- [ ] **Step 3: Record exact evidence, complete the lane, and preserve at least three ready rows**
