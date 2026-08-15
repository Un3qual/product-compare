# Scalable Realistic Development Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build deterministic bounded and full development-seed profiles with exactly 300 products, 70 merchants, realistic offer breadth, and profile-appropriate history and lifecycle depth.

**Architecture:** Keep `priv/repo/seeds.exs` as the sole executable orchestrator and pass one strict profile map through the existing domain-oriented seed modules. Preserve the five named products, two named merchants, and all current behavioral anchors while adding dictionary-generated ordered inventories and immutable seed identities; reconcile the complete expected ownership set on every rerun and profile switch.

**Tech Stack:** Elixir 1.19, Ecto/PostgreSQL, existing ProductCompare domain contexts, ExUnit

## Global Constraints

- Both profiles contain exactly 300 seed-owned products and 70 seed-owned merchants.
- Bounded contains 1,700–1,900 seed-owned offers; full contains 2,900–3,100.
- Omitted `--density` means `bounded`; only `bounded` and `full` are accepted.
- Keep the existing five products, two merchants, role accounts, named scenarios, slugs, domains, keys, and behavior stable.
- Generate identity only from ordered checked-in values; do not use randomness, hash-map iteration order, or wall-clock values.
- Use the start of the current UTC hour as the execution anchor.
- Preserve unrelated local rows byte-for-byte and fail closed on seed-identity conflicts.
- `bounded → full → bounded` must leave the exact bounded logical ownership set.
- Never contact providers, network adapters, schedulers, jobs, mailers, or conversion services.
- Keep `priv/repo/seeds.exs` as the only executable entrypoint; do not add a production seed bypass, generic fixture DSL, or second seed framework.
- Use existing production contexts and changesets as write authorities; do not bypass validation or referential integrity for speed.
- Keep the pending-correction empty-current baseline intact across reruns and profile switches.

---

### Task 1: Add the strict density profile and deterministic fixture dictionary

**Files:**
- Create: `priv/repo/seeds/profile.exs`
- Create: `priv/repo/seeds/dictionary.exs`
- Modify: `priv/repo/seeds.exs`
- Modify: `priv/repo/seeds/catalog.exs`
- Modify: `priv/repo/seeds/marketplace.exs`
- Modify: `priv/repo/seeds/engagement.exs`
- Modify: `priv/repo/seeds/operations.exs`
- Modify: `priv/repo/seeds/guide.exs`
- Modify: `test/product_compare/repo/seeds_test.exs`

**Interfaces:**
- Produces: `ProductCompare.DevSeeds.Profile.parse!/1 :: map()`.
- Produces: `ProductCompare.DevSeeds.Profile.config!/1 :: map()` for focused tests.
- Produces: `ProductCompare.DevSeeds.Profile.utc_hour/1 :: DateTime.t()`.
- Produces: `ProductCompare.DevSeeds.Dictionary.product_fixtures/1 :: [map()]` with 295 generated fixtures.
- Produces: `ProductCompare.DevSeeds.Dictionary.merchant_fixtures/1 :: [map()]` with 68 generated fixtures.
- Changes: each domain `seed!/N` accepts the profile as its final argument.
- Produces: `ProductCompare.DevSeeds.run!/1 :: map()` inside `priv/repo/seeds.exs`; the file still invokes it once as the sole CLI entrypoint.

- [ ] **Step 1: Write profile, dictionary, anchor, and guide RED tests**

Add direct tests before the database-heavy seed assertions:

```elixir
Code.require_file(Path.join(File.cwd!(), "priv/repo/seeds/profile.exs"))
Code.require_file(Path.join(File.cwd!(), "priv/repo/seeds/dictionary.exs"))

alias ProductCompare.DevSeeds.Dictionary, as: DevSeedDictionary
alias ProductCompare.DevSeeds.Profile, as: DevSeedProfile

test "density options are strict and bounded by default" do
  assert %{density: :bounded, product_count: 300, merchant_count: 70} =
           DevSeedProfile.parse!([])

  assert %{density: :bounded, offer_range: 1_700..1_900} =
           DevSeedProfile.parse!(["--density", "bounded"])

  assert %{density: :full, offer_range: 2_900..3_100} =
           DevSeedProfile.parse!(["--density=full"])

  assert_raise ArgumentError, ~r/density must be bounded or full/, fn ->
    DevSeedProfile.parse!(["--density", "huge"])
  end

  assert_raise ArgumentError, ~r/density may be supplied once/, fn ->
    DevSeedProfile.parse!(["--density", "bounded", "--density", "full"])
  end

  assert_raise ArgumentError, ~r/unknown seed arguments/, fn ->
    DevSeedProfile.parse!(["--other", "value"])
  end
end

test "dictionary fixtures are ordered, unique, and profile-independent" do
  bounded = DevSeedProfile.config!(:bounded)
  full = DevSeedProfile.config!(:full)
  products = DevSeedDictionary.product_fixtures(bounded)
  merchants = DevSeedDictionary.merchant_fixtures(bounded)

  assert length(products) == 295
  assert length(merchants) == 68
  assert products == DevSeedDictionary.product_fixtures(full)
  assert merchants == DevSeedDictionary.merchant_fixtures(full)
  assert Enum.uniq_by(products, & &1.slug) == products
  assert Enum.uniq_by(products, & &1.model_number) == products
  assert Enum.uniq_by(merchants, & &1.domain) == merchants
end

test "seed anchors use the current UTC hour" do
  now = ~U[2026-08-14 19:42:13.987654Z]
  assert DevSeedProfile.utc_hour(now) == ~U[2026-08-14 19:00:00Z]
end
```

- [ ] **Step 2: Run the focused tests and witness RED**

Run:

```bash
mix test test/product_compare/repo/seeds_test.exs
```

Expected: compilation fails because `Profile` and `Dictionary` do not exist.

- [ ] **Step 3: Implement the strict profile map**

Create `profile.exs` with the exact shared and per-density configuration:

```elixir
defmodule ProductCompare.DevSeeds.Profile do
  @moduledoc false

  @shared %{product_count: 300, merchant_count: 70}
  @profiles %{
    bounded: %{
      density: :bounded,
      offer_range: 1_700..1_900,
      ordinary_offer_range: 4..8,
      representative_offer_range: 12..25,
      primary_history_weeks: 52,
      secondary_history_months: 0,
      lifecycle_multiplier: 10
    },
    full: %{
      density: :full,
      offer_range: 2_900..3_100,
      ordinary_offer_range: 8..12,
      representative_offer_range: 20..30,
      primary_history_weeks: 52,
      secondary_history_months: 12,
      lifecycle_multiplier: 30
    }
  }

  @spec parse!([String.t()]) :: map()
  def parse!(argv) when is_list(argv) do
    {options, arguments, invalid} =
      OptionParser.parse(argv, strict: [density: :string])

    densities = Keyword.get_values(options, :density)

    cond do
      arguments != [] or invalid != [] ->
        raise ArgumentError, "unknown seed arguments: #{inspect(arguments ++ invalid)}"

      length(densities) > 1 ->
        raise ArgumentError, "density may be supplied once"

      densities == [] ->
        config!(:bounded)

      true ->
        densities |> hd() |> density!() |> config!()
    end
  end

  @spec config!(:bounded | :full) :: map()
  def config!(density), do: Map.merge(@shared, Map.fetch!(@profiles, density))

  @spec utc_hour(DateTime.t()) :: DateTime.t()
  def utc_hour(%DateTime{} = now) do
    now = DateTime.truncate(now, :second)
    %{now | minute: 0, second: 0}
  end

  defp density!("bounded"), do: :bounded
  defp density!("full"), do: :full
  defp density!(_value), do: raise(ArgumentError, "density must be bounded or full")
end
```

- [ ] **Step 4: Implement the checked-in dictionary and stable UUID helper**

Create `dictionary.exs` with fixed ordered lists and generated maps:

```elixir
defmodule ProductCompare.DevSeeds.Dictionary do
  @moduledoc false

  @brands ~w(Aster Beacon Cedar Delta Ember Fjord Grove Halo Ion Juniper Kestrel Lumen Meridian Nova Orbit Prism Quill Ridge Solace Terra)
  @series ~w(Core Edge Field Line Studio)
  @types [
    {:monitor, "Monitor", "MON"},
    {:tv, "Television", "TV"},
    {:projector, "Projector", "PROJ"}
  ]
  @merchant_prefixes ~w(Apex Bright Cedar Direct Ever Fair Grand Harbor Ideal Juniper Keystone Local Metro North Open Prime Quick)
  @merchant_suffixes ~w(Electronics Market Supply Warehouse)

  @spec product_fixtures(map()) :: [map()]
  def product_fixtures(%{product_count: count}) do
    Enum.map(1..(count - 5), fn index ->
      {type, type_name, type_code} = Enum.at(@types, rem(index - 1, length(@types)))
      brand = Enum.at(@brands, rem(index - 1, length(@brands)))
      series = Enum.at(@series, rem(div(index - 1, length(@brands)), length(@series)))
      number = index |> Integer.to_string() |> String.pad_leading(3, "0")
      model_number = "#{type_code}-#{number}"

      %{
        key: "generated-product-#{number}",
        type: type,
        brand: brand,
        name: "#{brand} #{series} #{type_name} #{number}",
        model_number: model_number,
        slug: "dev-#{String.downcase(type_code)}-#{number}",
        description: "Development #{String.downcase(type_name)} fixture #{number} for deterministic catalog and marketplace coverage.",
        specification_index: index
      }
    end)
  end

  @spec merchant_fixtures(map()) :: [map()]
  def merchant_fixtures(%{merchant_count: count}) do
    fixtures =
      for prefix <- @merchant_prefixes, suffix <- @merchant_suffixes do
        name = "#{prefix} #{suffix}"
        slug = name |> String.downcase() |> String.replace(" ", "-")
        %{key: slug, name: name, domain: "#{slug}.test"}
      end

    Enum.take(fixtures, count - 2)
  end
end
```

Add a deterministic UUID helper to `Support`:

```elixir
@spec stable_uuid(String.t(), String.t()) :: Ecto.UUID.t()
def stable_uuid(namespace, key) do
  hex =
    "#{namespace}:#{key}"
    |> sha256()
    |> Base.encode16(case: :lower)

  uuid =
    [String.slice(hex, 0, 8), String.slice(hex, 8, 4), String.slice(hex, 12, 4),
     String.slice(hex, 16, 4), String.slice(hex, 20, 12)]
    |> Enum.join("-")

  {:ok, uuid} = Ecto.UUID.cast(uuid)
  uuid
end
```

- [ ] **Step 5: Parse once, thread the profile, and print it**

Define `ProductCompare.DevSeeds.run!/1` in `priv/repo/seeds.exs`, preserve the
existing transaction, and change each seed function to accept its final
`profile` argument:

```elixir
defmodule ProductCompare.DevSeeds do
  @moduledoc false

  def run!(argv) do
    profile = ProductCompare.DevSeeds.Profile.parse!(argv)
    anchor = ProductCompare.DevSeeds.Profile.utc_hour(DateTime.utc_now())

    seed =
      ProductCompare.DevSeeds.Support.serializable_transaction(fn ->
        ProductCompare.DevSeeds.CorrectionSafety.lock_correction_submissions!()
        accounts = ProductCompare.DevSeeds.Accounts.seed!(seed_password(), anchor)
        catalog = ProductCompare.DevSeeds.Catalog.seed!(accounts, anchor, profile)
        marketplace = ProductCompare.DevSeeds.Marketplace.seed!(catalog, anchor, profile)
        engagement =
          ProductCompare.DevSeeds.Engagement.seed!(accounts, catalog, marketplace, anchor, profile)
        operations =
          ProductCompare.DevSeeds.Operations.seed!(accounts, catalog, marketplace, anchor, profile)

        %{accounts: accounts, catalog: catalog, marketplace: marketplace,
          engagement: engagement, operations: operations, anchor: anchor, profile: profile}
      end)
      |> ProductCompare.DevSeeds.Support.expect!("transaction")

    seed
    |> Map.put(:password, seed_password())
    |> ProductCompare.DevSeeds.Guide.print()

    seed
  end

  defp seed_password do
    case System.get_env("SEED_USER_PASSWORD") do
      value when is_binary(value) and value != "" -> value
      _value -> "supersecretpass123"
    end
  end
end
```

At the bottom, call `ProductCompare.DevSeeds.run!/1`. During the Mix `test` task,
pass `[]` so the 67 existing `Code.eval_file/1` seed tests retain bounded-default
behavior; normal `mix run` executions pass `System.argv()`:

```elixir
seed_argv = if Mix.Task.task_name() == "test", do: [], else: System.argv()
ProductCompare.DevSeeds.run!(seed_argv)
```

Update the guide with `Density: #{seed.profile.density}` and the shared inventory
targets.

- [ ] **Step 6: Run GREEN and the unchanged behavioral baseline**

Run:

```bash
mix format
mix test test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs
```

Expected: profile/dictionary tests pass and all existing named scenarios remain green with the bounded default.

- [ ] **Step 7: Commit the profile contract**

```bash
git add priv/repo/seeds.exs priv/repo/seeds/profile.exs priv/repo/seeds/dictionary.exs priv/repo/seeds/support.exs priv/repo/seeds/catalog.exs priv/repo/seeds/marketplace.exs priv/repo/seeds/engagement.exs priv/repo/seeds/operations.exs priv/repo/seeds/guide.exs test/product_compare/repo/seeds_test.exs
git commit -m "feat: add development seed density profiles"
```

---

### Task 2: Generate and reconcile the 300-product catalog

**Files:**
- Modify: `priv/repo/seeds/catalog.exs`
- Modify: `priv/repo/seeds/dictionary.exs`
- Modify: `test/product_compare/repo/seeds_test.exs`
- Modify: `test/product_compare_web/graphql/development_seeds_test.exs`

**Interfaces:**
- Consumes: `Dictionary.product_fixtures/1`, `Support.stable_uuid/2`, and the profile map.
- Preserves: `catalog.products` as the existing five-key named scenario map.
- Produces: `catalog.all_products :: [Product.t()]` ordered with named anchors first.
- Produces: deterministic brand, product, identifier, media, use-case, and typed-specification rows for all generated products.

- [ ] **Step 1: Write exact inventory and specification RED tests**

Add assertions after a bounded seed run:

```elixir
seed = ProductCompare.DevSeeds.run!(["--density", "bounded"])

assert length(seed.catalog.all_products) == 300
assert Repo.aggregate(Product, :count, :id) >= 300
assert seed.catalog.all_products |> Enum.map(& &1.slug) |> Enum.uniq() |> length() == 300
assert Enum.take(seed.catalog.all_products, 5) |> Enum.map(& &1.slug) == [
         "acme-vision-27g",
         "acme-vision-27uw",
         "acme-vision-27i-import",
         "acme-cinema-55o",
         "acme-beam-4k"
       ]

generated = Enum.drop(seed.catalog.all_products, 5)
assert Enum.frequencies_by(generated, & &1.primary_type_taxon_id) |> map_size() == 3
assert Enum.any?(generated, fn product ->
         not Map.has_key?(current_attributes_by_code(product), "refresh_rate")
       end)
assert Enum.any?(generated, fn product ->
         Map.has_key?(current_attributes_by_code(product), "finish")
       end)
```

Add a two-run identity assertion for all product entropy IDs and slugs.

- [ ] **Step 2: Run the catalog tests and witness RED**

Run:

```bash
mix test test/product_compare/repo/seeds_test.exs
```

Expected: `catalog.all_products` is missing and only five products exist.

- [ ] **Step 3: Seed ordered generated products without changing named anchors**

Split the current private product function into named and generated paths:

```elixir
named_products = seed_named_products!(taxons)

generated_products =
  profile
  |> Dictionary.product_fixtures()
  |> Enum.map(&seed_generated_product!(&1, taxons))

named_order = [:monitor_16_9, :monitor_ultrawide, :monitor_import_feed, :tv, :projector]
named_inventory = Enum.map(named_order, &Map.fetch!(named_products, &1))
all_products = named_inventory ++ generated_products
```

`seed_generated_product!/2` must select the existing taxon by fixture `:type`,
upsert the dictionary brand and product through `Catalog`, then reserve and
verify `Support.stable_uuid("development-product", fixture.key)` on the product.
On an existing slug with a different entropy ID, raise before updating it.

- [ ] **Step 4: Generate deterministic identifiers, media, use cases, and specs**

For every generated product:

```elixir
specification = fixture.specification_index

typed_values = %{
  refresh_rate: %{value_num: Decimal.new(Integer.to_string(60 + rem(specification, 9) * 15)), unit_id: units.hz.id},
  hdr_supported: %{value_bool: rem(specification, 2) == 0},
  panel_tech: %{enum_option_id: Enum.at([options.ips.id, options.oled.id, options.mini_led.id], rem(specification, 3))},
  diagonal: %{value_num: Decimal.new(Integer.to_string(24 + rem(specification, 8) * 5)), unit_id: units.inches.id}
}
```

Deliberately omit the otherwise-required refresh-rate fact on every eleventh
fixture. Add one non-filterable `finish` text attribute through the existing
attribute/taxon-attribute contracts and seed a readable finish claim on every
seventeenth fixture; this owns the approved unsupported-text display scenario
rather than inventing another filter. Use stable UUIDs for identifiers and
media. Reuse the existing source and artifact rather than creating one evidence
artifact per generated product.

- [ ] **Step 5: Reconcile only the generated product namespace**

Compute the expected generated product entropy IDs. Query products whose slugs
start with `dev-` and whose entropy IDs match the deterministic dictionary
namespace. Remove obsolete seed-owned dependencies in referential order, then
remove obsolete products. If a `dev-` slug has an unexpected entropy ID, raise
instead of adopting or deleting it.

- [ ] **Step 6: Run GREEN and GraphQL catalog pagination coverage**

Run:

```bash
mix test test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs
mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/catalog_filter_metadata_test.exs test/product_compare_web/graphql/seo_surfaces_test.exs
```

Expected: exact 300-product assertions and at least two catalog/category pages pass while all five named anchors remain unchanged.

- [ ] **Step 7: Commit the catalog inventory**

```bash
git add priv/repo/seeds/catalog.exs priv/repo/seeds/dictionary.exs test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs
git commit -m "feat: generate realistic development catalog"
```

---

### Task 3: Generate 70 merchants, profile-sized offers, and bounded histories

**Files:**
- Modify: `priv/repo/seeds/marketplace.exs`
- Modify: `priv/repo/seeds/dictionary.exs`
- Modify: `test/product_compare/repo/seeds_test.exs`
- Modify: `test/product_compare_web/graphql/development_seeds_test.exs`

**Interfaces:**
- Consumes: `catalog.products`, `catalog.all_products`, the dictionary merchant fixtures, anchor, and profile.
- Preserves: `marketplace.merchants` and `marketplace.offers` as existing named scenario maps.
- Produces: `marketplace.all_merchants :: [Merchant.t()]` with exactly 70 rows.
- Produces: `marketplace.all_offers :: [MerchantProduct.t()]` within the selected profile range.
- Produces: `marketplace.all_price_points :: [PricePoint.t()]` for the complete selected-profile ownership set.
- Produces: current observations for every observed offer, weekly primary history, full-only monthly secondary history, and named dense scenarios.

- [ ] **Step 1: Write marketplace scale, distribution, and history RED tests**

Add profile-specific tests:

```elixir
bounded = ProductCompare.DevSeeds.run!(["--density", "bounded"])
assert length(bounded.marketplace.all_merchants) == 70
assert length(bounded.marketplace.all_offers) in 1_700..1_900
assert Enum.all?(bounded.marketplace.all_merchants, fn merchant ->
         Enum.count(bounded.marketplace.all_offers, &(&1.merchant_id == merchant.id)) > 0
       end)

representative_offer_count =
  Enum.count(bounded.marketplace.all_offers, &(&1.product_id == bounded.catalog.products.monitor_16_9.id))
assert representative_offer_count >= 12

full = ProductCompare.DevSeeds.run!(["--density", "full"])
assert length(full.marketplace.all_merchants) == 70
assert length(full.marketplace.all_offers) in 2_900..3_100
assert Enum.count(full.marketplace.all_offers) > Enum.count(bounded.marketplace.all_offers)
assert length(full.marketplace.all_price_points) >
         length(bounded.marketplace.all_price_points)
```

Also assert all generated merchant domains end in `.test`, all offer
merchant/product pairs are unique, currencies include the named non-USD
scenario, and a representative product has more than one GraphQL offer page.

- [ ] **Step 2: Run the marketplace tests and witness RED**

Run:

```bash
mix test test/product_compare/repo/seeds_test.exs
```

Expected: only two merchants and six offers exist.

- [ ] **Step 3: Generate and reserve the 68 additional merchants**

Upsert dictionary merchants through `Pricing.upsert_merchant/1`, reserve
`Support.stable_uuid("development-merchant", fixture.key)`, fail closed on
domain/entropy conflicts, and return named plus generated ordered collections.

- [ ] **Step 4: Generate the exact profile offer plan before writing**

Build offer fixtures from stable product and merchant indexes. Bounded ordinary
products use `4 + rem(product_index, 5)` offers; the five named representative
products use `12 + rem(product_index, 14)`. Full ordinary products use
`8 + rem(product_index, 5)` offers; named representatives use
`20 + rem(product_index, 11)`. Add or remove only the last ordinary offer per
ordered product until the aggregate falls inside the exact profile range.

Each fixture contains:

```elixir
%{
  key: "offer:#{product.entropy_id}:#{merchant.entropy_id}",
  external_sku: "DEV-#{product_index}-#{merchant_index}",
  url: "https://#{merchant.domain}/products/#{product.slug}",
  currency: currency_for(product_index, merchant_index),
  last_seen_at: DateTime.add(anchor, -rem(merchant_index, 6) * 3_600, :second),
  is_active: rem(product_index + merchant_index, 19) != 0
}
```

The six existing named offers count toward their representative products' target
and are not duplicated by the generated plan. The first bounded-sized subset
uses profile-independent stable identities so switching to full reuses it.
Full-only extras use a separate stable namespace.

- [ ] **Step 5: Seed current, weekly, monthly, and scenario histories**

Use one shared source artifact per profile/anchor/cadence. Every observed offer
gets a current point. For full, the first three offers per product get 52 weekly
points and remaining observed offers get 12 monthly points. Bounded gives the
named/scenario cohort 52 weekly points and keeps ordinary secondary offers at
current truth only. Derive Decimal price and stock deterministically:

```elixir
base = Decimal.new(Integer.to_string(120 + rem(product_index * 37, 1_800)))
merchant_delta = Decimal.new(Integer.to_string(rem(merchant_index * 11, 90)))
time_delta = Decimal.new(Integer.to_string(rem(period_index * 7, 55)))
price = base |> Decimal.add(merchant_delta) |> Decimal.sub(time_delta)
```

Reserve `Support.stable_uuid("development-price-point", fixture.key)` and retain
the explicit unobserved offer with no points.

- [ ] **Step 6: Reconcile full-only histories and offers before shared rows**

On `full → bounded`, delete full-only price points and their seed-only artifacts,
then full-only dependent alert/purchase facts, then full-only offers. Identify
ownership by the exact deterministic entropy sets plus the Development
Marketplace Evidence source; never delete by URL or `DEV-` prefix alone.

- [ ] **Step 7: Run GREEN and focused pricing suites**

Run:

```bash
mix test test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs
mix test test/product_compare/pricing/product_price_trends_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/merchant_detail_test.exs
```

Expected: bounded/full ranges, merchant coverage, history differentiation, named offer truth, and pagination pass.

- [ ] **Step 8: Commit the marketplace profiles**

```bash
git add priv/repo/seeds/marketplace.exs priv/repo/seeds/dictionary.exs test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs
git commit -m "feat: scale development marketplace profiles"
```

---

### Task 4: Scale comparisons, alerts, community content, and corrections

**Files:**
- Modify: `priv/repo/seeds/engagement.exs`
- Modify: `priv/repo/seeds/community_writes.exs`
- Modify: `test/product_compare/repo/seeds_test.exs`
- Modify: `test/product_compare_web/graphql/development_seeds_test.exs`

**Interfaces:**
- Consumes: ordered product/offer collections, stable accounts, anchor, and profile multiplier.
- Preserves: all existing named saved sets, snapshot, watch rules, alert events, community rows, and three correction states.
- Produces in bounded: 24 saved comparisons, 48 watches, at least 64 alerts, 120 reviews, 80 questions, and 24 corrections including anchors.
- Produces in full: 60 saved comparisons, 160 watches, at least 240 alerts, 300 reviews, 180 questions, and 90 corrections including anchors.
- Produces: ordered `all_saved_sets`, `all_watches`, `all_alerts`, `all_reviews`, `all_questions`, and `all_corrections` collections in the engagement result.

- [ ] **Step 1: Write engagement count, pagination, and ownership RED tests**

Add exact active-row counts by seed idempotency/entropy namespace and assert:

```elixir
bounded = ProductCompare.DevSeeds.run!(["--density", "bounded"])
assert %{
         saved_sets: 24,
         watches: 48,
         reviews: 120,
         questions: 80,
         corrections: 24
       } == %{
         saved_sets: length(bounded.engagement.all_saved_sets),
         watches: length(bounded.engagement.all_watches),
         reviews: length(bounded.engagement.all_reviews),
         questions: length(bounded.engagement.all_questions),
         corrections: length(bounded.engagement.all_corrections)
       }

full = ProductCompare.DevSeeds.run!(["--density", "full"])
assert %{
         saved_sets: 60,
         watches: 160,
         reviews: 300,
         questions: 180,
         corrections: 90
       } == %{
         saved_sets: length(full.engagement.all_saved_sets),
         watches: length(full.engagement.all_watches),
         reviews: length(full.engagement.all_reviews),
         questions: length(full.engagement.all_questions),
         corrections: length(full.engagement.all_corrections)
       }
```

Assert multiple pages through the production GraphQL connections, owner-private
actions remain private, read/unread and enabled/disabled states both exist, all
four watch rule types exist, and pending corrections retain no current claim.

- [ ] **Step 2: Run engagement tests and witness RED**

Run:

```bash
mix test test/product_compare/repo/seeds_test.exs
```

Expected: current small named scenarios do not meet the profile counts.

- [ ] **Step 3: Generate saved comparisons, snapshots, watches, and alerts**

Keep named map keys unchanged. Generate additional rows from ordered product
windows, two- or three-product comparison sets, rotating watch rule types, and
stable entropy IDs. Recreate only rows proven to belong to the shopper and exact
seed ID. Use `Catalog.delete_saved_comparison_set/2` and `Alerts.delete_watch/2`
before recreating managed rows whose ordered contents changed.

- [ ] **Step 4: Generate community rows through idempotent write contracts**

Use `CommunityWrites` with keys such as
`dev-seed-generated-review-001-v1`, alternating the shopper and participant,
rotating ratings and moderation states, and distributing content across all
products. Create deterministic questions and answers with accepted, unaccepted,
pending, published, and hidden states. The write receipt plus expected owner and
product proves seed ownership; an occupied user/product scope without the exact
receipt remains untouched.

- [ ] **Step 5: Generate correction lifecycles without violating the pending scope**

Distribute generated corrections so each submitter/product/attribute pending
scope remains unique. Rotate pending, accepted, and rejected states and typed
values that match attribute types. Reuse `ensure_seed_correction!/7`, but derive
entropy IDs through `Support.stable_uuid/2` for generated keys. For pending rows
with no superseded claim, assert `ProductAttributeCurrent` remains absent.

- [ ] **Step 6: Reconcile full-only engagement rows**

Compute expected entropy/idempotency sets. Delete or remove full-only rows through
their domain lifecycle in dependency order: alert events, watches, comparison
items/sets, reports/answers/questions/reviews with matching receipts, correction
claims/currents/corrections. Fail closed if owner, product, attribute, or receipt
does not match the expected seed scope.

- [ ] **Step 7: Run GREEN and focused lifecycle suites**

Run:

```bash
mix test test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs
mix test test/product_compare_web/graphql/community_content_test.exs test/product_compare_web/graphql/price_watches_and_alerts_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs
```

Expected: both profile count maps, pagination, ownership, moderation, and pending-correction safety pass.

- [ ] **Step 8: Commit engagement depth**

```bash
git add priv/repo/seeds/engagement.exs priv/repo/seeds/community_writes.exs test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs
git commit -m "feat: scale development engagement scenarios"
```

---

### Task 5: Scale CJ, import, attribution, conversion, and revenue scenarios

**Files:**
- Modify: `priv/repo/seeds/operations.exs`
- Modify: `priv/repo/seeds/guide.exs`
- Modify: `test/product_compare/repo/seeds_test.exs`
- Modify: `test/product_compare_web/graphql/development_seeds_test.exs`

**Interfaces:**
- Consumes: shared inventory, profile multiplier, anchor, and existing CJ/commerce contexts.
- Preserves: the seven named CJ stages, named import runs, and existing commerce examples.
- Produces in bounded: 70 CJ feeds, 40 import runs, 120 clicks, and 80 conversions.
- Produces in full: 210 CJ feeds, 120 import runs, 600 clicks, and 400 conversions.
- Produces: ordered `all_cj_feeds`, `all_import_runs`, `all_clicks`, `all_conversions`, and `all_purchase_facts` collections in the operations result.
- Produces: matched/unmatched, anonymous/member, status/date/currency, commission, and purchase-price diversity with multi-page operator connections.

- [ ] **Step 1: Write operator and attribution scale RED tests**

Assert the profile counts with the returned ownership collections:

```elixir
bounded = ProductCompare.DevSeeds.run!(["--density", "bounded"])
assert length(bounded.operations.all_cj_feeds) == 70
assert length(bounded.operations.all_import_runs) == 40
assert length(bounded.operations.all_clicks) == 120
assert length(bounded.operations.all_conversions) == 80

full = ProductCompare.DevSeeds.run!(["--density", "full"])
assert length(full.operations.all_cj_feeds) == 210
assert length(full.operations.all_import_runs) == 120
assert length(full.operations.all_clicks) == 600
assert length(full.operations.all_conversions) == 400
```

Also assert at least two pages for CJ programs, unmatched feeds, imports, and
revenue rows, all seven CJ stages, matched and unmatched conversions, anonymous
and member clicks, multiple currencies, and revenue date/status filters.

- [ ] **Step 2: Run operator tests and witness RED**

Run:

```bash
mix test test/product_compare/repo/seeds_test.exs
```

Expected: the current seven-stage/small-commerce fixtures do not meet profile counts.

- [ ] **Step 3: Generate CJ programs, feeds, and import histories**

Retain the named seven rows first. Generate provider feed and advertiser IDs from
stable indexes, rotate the seven lifecycle stages, merchant matches, currencies,
languages, product counts, freshness, and feed availability. Reuse
`Ingestion.upsert_merchant_feed_candidate/2` and current lifecycle updates.
Generate import runs with stable provider run IDs, started/completed/failed
states, processed/rejected totals, and hourly anchor offsets.

- [ ] **Step 4: Generate clicks, conversions, commissions, and purchase facts**

Use deterministic commerce destinations from seeded offers. Rotate shopper and
anonymous identity, matched/unmatched references, pending/approved/rejected
conversion states, USD plus the named separate currency, purchase/report dates,
commission rates, and legitimately absent facts. Reserve stable entropy IDs and
reuse existing conversion restoration rules.

- [ ] **Step 5: Reconcile full-only operator and commerce rows**

Compute the expected provider IDs and entropy sets. Remove only exact seed-owned
full-only import, feed, click, conversion, and purchase-fact rows in dependency
order. A provider ID or entropy collision with different source, merchant,
visitor, or click ownership is fatal.

- [ ] **Step 6: Refresh the local guide**

Print density, actual product/merchant/offer/history/lifecycle counts, stable
credentials, and direct URLs for catalog pagination, representative price
history, comparison, alerts, community, affiliate setup, CJ programs/feeds, and
revenue filters. Do not print one-time API tokens beyond the existing explicitly
development token behavior or any production secret.

- [ ] **Step 7: Run GREEN and focused operator suites**

Run:

```bash
mix test test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs
mix test test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare_web/graphql/cj_program_queries_test.exs test/product_compare_web/graphql/commerce_attribution_ledger_test.exs
```

Expected: profile counts, pages, stage/filter diversity, attribution links, and named operator scenarios pass.

- [ ] **Step 8: Commit operator depth**

```bash
git add priv/repo/seeds/operations.exs priv/repo/seeds/guide.exs test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs
git commit -m "feat: scale development operator scenarios"
```

---

### Task 6: Prove reruns, profile switching, offline behavior, and complete gates

**Files:**
- Modify: `test/product_compare/repo/seeds_test.exs`
- Modify: `test/product_compare_web/graphql/development_seeds_test.exs`
- Modify: `docs/work/realistic-development-data.md`

**Interfaces:**
- Consumes: `ProductCompare.DevSeeds.run!/1` and both complete profile contracts.
- Produces: exact first/second-run identity inventories, bounded/full/bounded switch evidence, unrelated-row snapshots, external-effect proofs, GraphQL pagination evidence, and closeout receipts.

- [ ] **Step 1: Write the profile transition and unrelated-row RED test**

Insert unrelated lookalike product, merchant, offer, price point, account,
community, correction, and commerce rows. Snapshot every field. Then execute:

```elixir
unrelated_snapshot = Enum.map(unrelated_records, &persisted_fields/1)
bounded_first = ProductCompare.DevSeeds.run!(["--density", "bounded"])
bounded_ids = seed_identity_inventory(bounded_first)
bounded_second = ProductCompare.DevSeeds.run!(["--density", "bounded"])
assert seed_identity_inventory(bounded_second) == bounded_ids

full_first = ProductCompare.DevSeeds.run!(["--density", "full"])
full_ids = seed_identity_inventory(full_first)
full_second = ProductCompare.DevSeeds.run!(["--density", "full"])
assert seed_identity_inventory(full_second) == full_ids

bounded_again = ProductCompare.DevSeeds.run!(["--density", "bounded"])
assert seed_identity_inventory(bounded_again) == bounded_ids
assert Enum.map(unrelated_records, &reload_persisted_fields/1) == unrelated_snapshot
```

Implement `seed_identity_inventory/1` from the returned ownership collections;
sort every identity list so database return order cannot affect the proof:

```elixir
defp seed_identity_inventory(seed) do
  %{
    products: identities(seed.catalog.all_products),
    merchants: identities(seed.marketplace.all_merchants),
    offers: identities(seed.marketplace.all_offers),
    price_points: identities(seed.marketplace.all_price_points),
    saved_sets: identities(seed.engagement.all_saved_sets),
    watches: identities(seed.engagement.all_watches),
    alerts: identities(seed.engagement.all_alerts),
    reviews: identities(seed.engagement.all_reviews),
    questions: identities(seed.engagement.all_questions),
    corrections: identities(seed.engagement.all_corrections),
    cj_feeds: identities(seed.operations.all_cj_feeds),
    import_runs: identities(seed.operations.all_import_runs),
    clicks: identities(seed.operations.all_clicks),
    conversions: identities(seed.operations.all_conversions)
  }
end

defp identities(records) do
  records
  |> Enum.map(fn record -> {record.__struct__, record.id, record.entropy_id} end)
  |> Enum.sort()
end
```

For unrelated rows, snapshot only persisted fields with
`record.__struct__.__schema__(:fields)`, reload by primary key, and compare those
field maps. This avoids association preload state affecting the byte-for-byte
proof:

```elixir
defp persisted_fields(record) do
  schema = record.__struct__
  Map.take(record, schema.__schema__(:fields))
end

defp reload_persisted_fields(record) do
  record.__struct__
  |> Repo.get!(record.id)
  |> persisted_fields()
end
```

Assert exact 300/70 counts, bounded/full offer ranges, profile lifecycle counts,
and no full-only identities after the final bounded run.

- [ ] **Step 2: Strengthen zero-external-effect failures**

Configure Req/provider clients, CJ runners, Oban/job insertion, scheduler modules,
mail delivery, and conversion callbacks with a function that raises
`"external effect invoked during development seed"`. Run both profiles and
assert neither invokes the function. Restore application environment in
`on_exit/1`.

- [ ] **Step 3: Run focused transition tests and witness RED/GREEN**

Run:

```bash
mix test test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs
```

Expected: two-run and bounded/full/bounded inventories are exact, unrelated rows are unchanged, and external-effect traps remain silent.

- [ ] **Step 4: Reset and execute both development profiles**

Run bounded twice, then full twice, then bounded once:

```bash
MIX_ENV=dev mix ecto.reset
MIX_ENV=dev mix run priv/repo/seeds.exs -- --density bounded
MIX_ENV=dev mix run priv/repo/seeds.exs -- --density bounded
MIX_ENV=dev mix run priv/repo/seeds.exs -- --density full
MIX_ENV=dev mix run priv/repo/seeds.exs -- --density full
MIX_ENV=dev mix run priv/repo/seeds.exs -- --density bounded
```

Record counts and elapsed time after each run in the lane document. Confirm the
last run returns to the exact bounded logical inventory.

- [ ] **Step 5: Inspect representative local pages**

Inspect catalog and category pagination, a representative 12–25-offer product,
price crossover/history, compare differences, saved comparisons, watches and
alerts, community pages, affiliate setup, CJ feeds/programs, and revenue filters.
Record the exact routes and observed page counts in the lane document.

- [ ] **Step 6: Run complete verification**

Run:

```bash
mix format --check-formatted
mix typecheck
mix quality
mix test
cd assets && pnpm run check
mix work_queue.validate
git diff --check
```

Expected: all backend/frontend gates pass with the selected row still truthful.

- [ ] **Step 7: Record closeout evidence and commit**

Rename the lane's `Target Outcome` section to `Batch Outcome` and record exact
bounded/full counts, two-run identities, transition proof, unrelated-row proof,
external-effect proof, page inspection, elapsed times, and verification totals.
Do not edit coordinator-owned `docs/work/index.md`; the coordinator performs the
residual-audit replenishment named by its Ready Floor Exception.

```bash
git add priv/repo/seeds test/product_compare/repo/seeds_test.exs test/product_compare_web/graphql/development_seeds_test.exs docs/work/realistic-development-data.md
git commit -m "feat: complete scalable development data"
```
