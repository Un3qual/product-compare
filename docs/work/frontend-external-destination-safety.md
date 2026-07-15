# Frontend External Destination Safety Work Doc

## Snapshot

- Status: complete (external destination safety contract)
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-14 after direct contract, consumer-suite, TypeScript,
  dependency, and patch validation (229 tests: 90 direct plus 139 consumer).

## External Destination Safety Contract

- Status: complete on 2026-07-14 on `codex/route-policy-data-contracts`.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`.
- Result: added a 90-case direct behavioral contract and corrected three
  parser-boundary safety gaps: single-label external hosts, explicit empty or
  zero ports, and public IPv4 addresses embedded in IPv6 forms.
- Owned paths:
  - `assets/src/routes/external-links.ts`
  - `assets/test/routes/external-links.test.ts`
  - `docs/work/frontend-external-destination-safety.md`
- Prerequisites:
  - Existing product-offer, product-detail, offer-discovery, merchant-directory,
    and merchant-detail suites remain green.
- Verification:
  - `cd assets && bun x vitest run test/routes/external-links.test.ts test/routes/products/product-offer-panel-data.test.ts test/routes/products/detail.route.test.tsx test/routes/offers/offer-discovery.route.test.tsx test/routes/merchants/merchant-directory.route.test.tsx test/routes/merchants/merchant-detail.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: the shared contract directly preserves safe public HTTP(S)
  destinations, optional bare-domain HTTPS promotion, and exact safe hrefs
  while rejecting credentials, malformed authorities, unsupported schemes,
  invalid hostnames and ports, localhost, and reserved IPv4/IPv6 destinations.
- Completion evidence:
  - Initial consumer baseline passed 139 tests across the five named suites.
  - The first direct run passed 74 characterization cases and failed six
    focused regressions for the three parser-boundary gaps above.
  - The corrected policy passed all 90 direct cases plus all 139 unchanged
    consumer cases (229 total), with TypeScript, framework/runtime dependency
    scan, and `git diff --check` clean.
  - The policy remains framework-free and adds no runtime dependency.
