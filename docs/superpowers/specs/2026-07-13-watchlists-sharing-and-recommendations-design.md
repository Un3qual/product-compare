# Watchlists, Sharing, And Source-Backed Recommendations Design

## Goal

Help shoppers return when a decision changes, share a stable decision record,
and understand recommendations without trusting an opaque score.

## Price Watchlists And Alerts

Authenticated users can watch a product or one merchant offer. A rule may fire
when a same-currency eligible landed price reaches a target, drops by a
percentage from the watch baseline, returns in stock, or becomes newly
available. Rules store their currency, baseline observation, target, enabled
state, last evaluation, and cooldown.

Evaluation is edge-triggered: a rule creates one event when it crosses from
false to true and does not repeat until it resets or the cooldown plus a new
qualifying observation occurs. An event stores the triggering observation and
a fact snapshot. The first delivery surface is an authenticated in-app inbox
with unread/read state. Transport-neutral delivery-attempt records permit later
email or webhook adapters without reevaluating price history.

## Shareable Comparison Snapshots

A signed-in owner can publish the current two- or three-product comparison as
an immutable snapshot. The snapshot copies ordered public product identity,
accepted specification values and provenance references, eligible offer
summaries, recommendation output, and creation time. It receives a high-entropy
public token and optional owner-supplied title.

The public route reads only published, non-revoked snapshots. It reveals no
owner identity or saved-set entropy ID. Revocation returns 404. Republishing
creates a new version/token; existing links never change silently. Expired or
stale offer facts remain visible with their captured observation times and a
clear snapshot disclaimer.

## Decision Recommendations

Recommendations use versioned decision profiles such as `best_value`,
`lowest_current_cost`, and taxon-specific use cases. Each profile defines
required and optional accepted attributes, normalization, weights, hard
exclusions, missing-data behavior, and offer freshness requirements.

The engine returns no winner when required evidence is missing or top scores
are effectively tied. Otherwise it returns a ranked result with:

- profile and algorithm version;
- input observation time;
- per-product score components;
- human-readable reasons derived from those components;
- exact claim and offer-summary references; and
- explicit missing or stale inputs.

Profile configuration is code-reviewed and deterministic in the first
milestone. Generated prose may later summarize the structured result but
cannot add facts or change ranking.

## GraphQL And UI

Viewer-scoped GraphQL mutations create/update/delete watches, mark alerts read,
publish/revoke snapshots, and select a recommendation profile. Product detail
shows watch controls near complete offer truth. Compare shows profile choice,
reasons, evidence links, and share controls. Public snapshot pages render a
self-contained comparison without authenticated account actions.

## Verification

Tests cover ownership, same-currency rules, edge-trigger/cooldown behavior,
duplicate event prevention, in-app read state, snapshot immutability and
revocation, privacy redaction, deterministic scores, ties, missing evidence,
stale offers, algorithm versioning, and evidence-link integrity.

