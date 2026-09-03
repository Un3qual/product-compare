# CJ Conversion Ingestion Development Seeds Design

## Goal

Populate the shipped CJ conversion-ingestion operator workspace with useful,
offline development data while preserving deterministic reruns and any
operator configuration created after seeding.

## Scope

The development seed flow will add:

- one persisted CJ sync-setting row when the application has not created one;
- three terminal sync runs covering scheduled, operator, and CLI triggers;
- a successful run recent enough to populate ingestion freshness;
- a safe synthetic failure that populates failure status and ledger evidence;
- CJ correction evidence tied to the existing reversed development conversion;
- a printed guide entry for `/commerce/revenue/ingestion`.

The fixtures apply to both bounded and full density profiles because they are a
small operator scenario set rather than scalable marketplace inventory.

## Ownership and Reruns

Sync runs use stable seed UUIDs and are restored by those UUIDs. Correction
evidence uses the reserved development action reference already attached to the
seeded conversion. Records outside those reserved identities are never removed
or adopted.

The CJ setting is a singleton without a seed-ownership column. Seeding may
create it with safe disabled defaults, but it must not overwrite an existing
operator-managed setting on rerun.

## Safety

- Keep the seeded schedule disabled with `next_run_at` unset.
- Do not seed provider credentials.
- Do not insert Oban jobs or running sync rows.
- Do not contact CJ or any other external provider.
- Store only synthetic, secret-safe failure and correction payloads.

## Verification

Focused repository tests will prove stable fixture identities and preservation
of operator-managed settings and unrelated sync history. The existing
development-seed GraphQL test will prove that the operator UI contract exposes
the settings, freshness, failure, requester, and run-ledger scenarios.
