# Backend Core Attrs Presence Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move reusable attr key-presence and non-nil presence checks into the core `ProductCompare.Attrs` helper.

**Architecture:** `ProductCompare.Attrs` already handles core atom/string attr lookup and nil-skipping insertion. This batch adds presence helpers beside that lookup logic, then routes Commerce Attribution conversion-upsert attr checks through the shared helper without changing persistence behavior.

**Tech Stack:** Elixir, Phoenix context modules, ExUnit.

---

## File Structure

- `lib/product_compare/attrs.ex`: core attr map helper functions.
- `lib/product_compare/commerce_attribution.ex`: Commerce Attribution context and conversion upsert attr handling.
- `test/product_compare/attrs_test.exs`: focused core attr helper coverage.
- `test/product_compare/commerce_attribution/commerce_attribution_test.exs`: Commerce Attribution behavior coverage.
- `docs/work/backend-core-attrs-presence-helper.md`: source-of-truth work record for this batch.

## Task 1: Core Attrs Presence Helper

**Files:**
- Modify: `lib/product_compare/attrs.ex`
- Modify: `lib/product_compare/commerce_attribution.ex`
- Modify: `test/product_compare/attrs_test.exs`
- Verify: `test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- Create: `docs/work/backend-core-attrs-presence-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add focused coverage for:
- `Attrs.has_key?/2` returning true for atom or string keys, including nil values.
- `Attrs.has_key?/2` returning false for missing and non-map inputs.
- `Attrs.present?/2` returning true only when atom/string lookup returns a non-nil value.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare/attrs_test.exs
```

Expected: FAIL because `ProductCompare.Attrs.has_key?/2` and `present?/2` do not exist yet.

- [x] **Step 3: Implement the helper**

Add:

```elixir
@spec has_key?(map() | term(), atom()) :: boolean()
def has_key?(attrs, key) when is_map(attrs) and is_atom(key) do
  Map.has_key?(attrs, key) or Map.has_key?(attrs, Atom.to_string(key))
end

def has_key?(_attrs, _key), do: false

@spec present?(map() | term(), atom()) :: boolean()
def present?(attrs, key), do: not is_nil(fetch(attrs, key))
```

- [x] **Step 4: Replace Commerce Attribution-local helpers**

Alias `ProductCompare.Attrs` in `ProductCompare.CommerceAttribution`, route click-session lookup, default attribution confidence, and upsert-field detection through `Attrs.fetch/2`, `put_present/3`, `present?/2`, and `has_key?/2`, then remove private duplicate helpers.

- [x] **Step 5: Run focused Commerce Attribution verification**

Run:

```bash
mix test test/product_compare/attrs_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs
```

Expected: PASS.

- [x] **Step 6: Run final verification**

Run:

```bash
cd assets && bun run check
mix test
mix format --check-formatted
mix compile --warnings-as-errors
mix typecheck
git diff --check
```

Expected: PASS.
