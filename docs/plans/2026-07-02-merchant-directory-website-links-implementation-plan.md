# Merchant Directory Website Links Implementation Plan

Goal: make `/merchants` more useful to shoppers by turning safe merchant domains
into explicit website links.

Constraints and non-goals:

- Use only the existing `Merchant.id`, `Merchant.name`, and `Merchant.domain`
  data already loaded by `MerchantDirectoryRouteQuery`.
- Do not add merchant-only offer browsing, backend filters, GraphQL schema
  changes, or affiliate setup mutations.
- Only render `http` or `https` destinations; domain-only values should be
  normalized to `https://<domain>`.

Owned paths:

- `assets/src/routes/merchants/index.tsx`
- `assets/test/routes/merchants/merchant-directory.route.test.tsx`
- `docs/work/frontend-merchant-discovery-demo-parity.md`

Batches:

1. Add route tests for domain-only website links, already absolute HTTPS links,
   and unsafe domain values that should render as text only.
2. Add a small route-local helper that trims domains, normalizes domain-only
   values to HTTPS, and rejects non-HTTP protocols.
3. Render a `Visit merchant website` link for safe destinations with
   `target="_blank"` and `rel="noopener noreferrer"`.
4. Preserve the existing merchant list, page-size selector, pagination links,
   empty state, and loader error state.
5. Record completion evidence under
   `### Merchant Directory Website Links Evidence`.

Verification:

- `cd assets && bun x vitest run test/routes/merchants/merchant-directory.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Fallback:

- If current fixture types assume non-null domains, keep the helper defensive
  and cover unsafe string values through route test data.
