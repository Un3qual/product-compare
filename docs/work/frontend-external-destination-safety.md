# Frontend External Destination Safety Work Doc

## Snapshot

- Status: ready (external destination safety contract)
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-14 after current source and consumer-suite validation
  (80 offer-discovery and merchant tests).

## External Destination Safety Contract

- Status: ready on 2026-07-14.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`.
- Next action: add direct behavioral coverage for the existing framework-free
  external HTTP and website destination policy, then simplify or correct only
  behavior proven duplicated or unsafe by that contract.
- Owned paths:
  - `assets/src/routes/external-links.ts`
  - `assets/test/routes/external-links.test.ts`
  - `docs/work/frontend-external-destination-safety.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/external-links.test.ts test/routes/offers/offer-discovery.route.test.tsx test/routes/merchants/merchant-directory.route.test.tsx test/routes/merchants/merchant-detail.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: the shared contract directly preserves safe public HTTP(S)
  destinations, optional bare-domain HTTPS promotion, and exact safe hrefs
  while rejecting credentials, malformed authorities, unsupported schemes,
  invalid hostnames and ports, localhost, and reserved IPv4/IPv6 destinations.
- Candidate evidence: current source inspection found the complete policy in a
  410-line framework-free module used by offer discovery, product offers, and
  merchant pages. The existing offer-discovery, merchant-directory, and
  merchant-detail suites pass 80 tests, but no direct suite owns the policy's
  security-sensitive edge cases.
