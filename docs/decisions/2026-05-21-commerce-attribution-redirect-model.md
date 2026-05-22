# Commerce Attribution Redirect Model (2026-05-21)

## Decision Summary

- Use an owned redirect hop at `/r/:click_id` for outbound commerce links.
- Persist one `commerce_click_sessions.click_id` UUID per outbound click and use it as the public attribution token.
- Use deterministic last-click attribution in phase 1 by resolving network payload click IDs back to `commerce_click_sessions`.
- Store conversions in network-neutral `commerce_conversions` rows keyed by `(source_network, network_conversion_ref)`.
- Store price-paid facts separately from conversions so conversion lifecycle updates do not overwrite normalized purchase-price evidence.

## Why This Decision Exists

- A first-party click ID gives web and future extension clients one attribution contract.
- Network integrations differ by webhook, report, and feed shape; a neutral conversion table keeps adapter variance outside the core reporting model.
- Idempotency must be enforced in the database because postbacks and report imports can replay.
- Revenue reporting needs conversion status history and paid-price facts without exposing user-level data publicly.

## Initial Implementation Boundaries

- `commerce_links` is the canonical outbound destination row for phase 1 redirects.
- `commerce_click_sessions` records the public click UUID plus minimal hashed/referrer metadata.
- `commerce_conversions` stores normalized network conversions plus the raw payload snapshot for reconciliation.
- `purchase_price_facts` stores one normalized paid-price fact per conversion.
- Impact is the first adapter because it exercises the conversion upsert and click-resolution path with a compact action payload.

## Deferred Decisions

- Link variants and legacy `affiliate_links` backfill are deferred until the core redirect/conversion path is stable.
- Daily aggregate storage and public GraphQL/dashboard read models are the next implementation slice.
- Authenticated source-field mapping for CJ and Awin remains a follow-up unless sample payloads or account docs are available.
