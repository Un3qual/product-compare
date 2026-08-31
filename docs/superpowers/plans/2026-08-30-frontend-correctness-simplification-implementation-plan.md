# Frontend Correctness And Simplification Implementation Plan

## Goal

Narrow unsafe partial recovery and replace manual Relay pagination, lifted
mutation state, unused select modes, and serialized operation text with their
existing owner-local contracts.

## Constraints

- Preserve Relay fragment masking, generated types, URL/transport validation,
  mutation outcomes, SSR query retention, and operation identity.
- Keep route state only when multiple steps genuinely coordinate through it.
- Prefer inference and generated Relay types; do not introduce generic hooks or
  aliases merely to reduce repeated lines.

## Implementation

1. Recover product-detail partial data only when errors are confined to the
   optional merchant-offers region and retained product data is valid.
2. Move community review, question, and answer accumulation to Relay pagination
   fragments.
3. Move compare-picker and comparison-snapshot accumulation to Relay pagination
   fragments.
4. Move each affiliate mutation's pending, error, result, and duplicate-submit
   state into its submitting step.
5. Remove the unused multi-select contract and store generated request identity
   plus variables instead of serialized GraphQL text in preload descriptors.

## Owned Areas

- Product-detail, community, compare, and affiliate setup routes
- assets/src/ui/primitives/Select.tsx
- assets/src/relay/route-preload.ts
- Matching generated Relay artifacts and focused frontend tests

## Verification

Run focused route and primitive tests, Relay validation, strict typecheck, lint,
format checks, unit tests, client/SSR builds, StyleX and bundle gates, then the
relevant Playwright flows. Completion evidence and milestone commits live in
docs/work/frontend-correctness-simplification.md.

