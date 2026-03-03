import Ecto.Query

alias ProductCompare.Accounts
alias ProductCompare.Catalog
alias ProductCompare.Pricing
alias ProductCompare.Repo
alias ProductCompare.Specs
alias ProductCompare.Taxonomy
alias ProductCompareSchemas.Catalog.Product
alias ProductCompareSchemas.Pricing.PricePoint
alias ProductCompareSchemas.Specs.EnumOption
alias ProductCompareSchemas.Taxonomy.Taxon
alias ProductCompareSchemas.Taxonomy.Taxonomy, as: TaxonomySchema

upsert_user = fn email ->
  case Accounts.get_user_by_email(email) do
    nil ->
      {:ok, user} = Accounts.create_user(%{email: email})
      user

    user ->
      user
  end
end

admin = upsert_user.("admin@example.com")
moderator = upsert_user.("moderator@example.com")

{:ok, _} = Accounts.upsert_user_reputation(admin.id, 1_000)
{:ok, _} = Accounts.upsert_user_reputation(moderator.id, 500)

{:ok, _} = Taxonomy.seed_default_taxonomies()

type_taxonomy = Repo.get_by!(TaxonomySchema, code: "type")
use_case_taxonomy = Repo.get_by!(TaxonomySchema, code: "use_case")

upsert_taxon = fn taxonomy, code, name, parent ->
  parent_id = if parent, do: parent.id, else: nil

  case Repo.get_by(Taxon, taxonomy_id: taxonomy.id, code: code) do
    nil ->
      {:ok, taxon} =
        Taxonomy.create_taxon(%{
          taxonomy_id: taxonomy.id,
          parent_id: parent_id,
          code: code,
          name: name
        })

      taxon

    taxon ->
      if taxon.parent_id != parent_id do
        {:ok, _} = Taxonomy.move_taxon(taxon.id, parent_id)
      end

      if taxon.name != name do
        taxon |> Ecto.Changeset.change(name: name) |> Repo.update!()
      else
        taxon
      end
  end
end

# Type tree: Electronics -> Displays -> TV / Monitor / Projector
electronics = upsert_taxon.(type_taxonomy, "electronics", "Electronics", nil)
displays = upsert_taxon.(type_taxonomy, "displays", "Displays", electronics)
_tv = upsert_taxon.(type_taxonomy, "tv", "TV", displays)
monitor = upsert_taxon.(type_taxonomy, "monitor", "Monitor", displays)
_projector = upsert_taxon.(type_taxonomy, "projector", "Projector", displays)

# Use-case tree: Desktop Setup -> Gaming / Office / Creative; Home Theater
desktop_setup = upsert_taxon.(use_case_taxonomy, "desktop_setup", "Desktop Setup", nil)
gaming = upsert_taxon.(use_case_taxonomy, "gaming", "Gaming", desktop_setup)
office = upsert_taxon.(use_case_taxonomy, "office", "Office", desktop_setup)
creative = upsert_taxon.(use_case_taxonomy, "creative", "Creative", desktop_setup)
home_theater = upsert_taxon.(use_case_taxonomy, "home_theater", "Home Theater", nil)

{:ok, frequency_dim} =
  Specs.upsert_dimension(%{code: "frequency", description: "Frequency values"})

{:ok, length_dim} = Specs.upsert_dimension(%{code: "length", description: "Length values"})

{:ok, hz_unit} =
  Specs.upsert_unit(%{
    dimension_id: frequency_dim.id,
    code: "hz",
    symbol: "Hz",
    multiplier_to_base: Decimal.new("1"),
    offset_to_base: Decimal.new("0")
  })

{:ok, in_unit} =
  Specs.upsert_unit(%{
    dimension_id: length_dim.id,
    code: "in",
    symbol: "in",
    multiplier_to_base: Decimal.new("25.4"),
    offset_to_base: Decimal.new("0")
  })

{:ok, _mm_unit} =
  Specs.upsert_unit(%{
    dimension_id: length_dim.id,
    code: "mm",
    symbol: "mm",
    multiplier_to_base: Decimal.new("1"),
    offset_to_base: Decimal.new("0")
  })

{:ok, panel_tech_set} = Specs.upsert_enum_set(%{code: "panel_tech"})

for {code, label, order} <- [
      {"ips", "IPS", 0},
      {"va", "VA", 1},
      {"oled", "OLED", 2},
      {"qd_oled", "QD-OLED", 3},
      {"mini_led", "Mini LED", 4}
    ] do
  {:ok, _} =
    Specs.upsert_enum_option(%{
      enum_set_id: panel_tech_set.id,
      code: code,
      label: label,
      sort_order: order
    })
end

{:ok, refresh_rate_attr} =
  Specs.upsert_attribute(%{
    code: "refresh_rate",
    display_name: "Refresh Rate",
    data_type: :numeric,
    dimension_id: frequency_dim.id,
    is_filterable: true
  })

{:ok, hdr_supported_attr} =
  Specs.upsert_attribute(%{
    code: "hdr_supported",
    display_name: "HDR Supported",
    data_type: :bool,
    is_filterable: true
  })

{:ok, panel_tech_attr} =
  Specs.upsert_attribute(%{
    code: "panel_tech",
    display_name: "Panel Technology",
    data_type: :enum,
    enum_set_id: panel_tech_set.id,
    is_filterable: true
  })

{:ok, diagonal_attr} =
  Specs.upsert_attribute(%{
    code: "diagonal",
    display_name: "Diagonal",
    data_type: :numeric,
    dimension_id: length_dim.id,
    is_filterable: true
  })

{:ok, acme_brand} = Catalog.upsert_brand(%{name: "Acme Display"})

upsert_product = fn attrs ->
  slug = Map.fetch!(attrs, :slug)

  case Repo.get_by(Product, slug: slug) do
    nil ->
      {:ok, product} = Catalog.create_product(attrs)
      product

    product ->
      {:ok, product} = Catalog.update_product(product, attrs)
      product
  end
end

monitor_16_9 =
  upsert_product.(%{
    brand_id: acme_brand.id,
    primary_type_taxon_id: monitor.id,
    name: "Acme Vision 27G",
    model_number: "AV27G",
    slug: "acme-vision-27g",
    description: "27 inch 16:9 high-refresh monitor with HDR and QD-OLED panel"
  })

monitor_ultrawide =
  upsert_product.(%{
    brand_id: acme_brand.id,
    primary_type_taxon_id: monitor.id,
    name: "Acme Vision 27UW",
    model_number: "AV27UW",
    slug: "acme-vision-27uw",
    description: "Ultrawide monitor with 27-inch 16:9 height equivalent"
  })

{:ok, _} =
  Taxonomy.assign_use_case(monitor_16_9.id, gaming.id, admin.id, :editorial, Decimal.new("0.95"))

{:ok, _} =
  Taxonomy.assign_use_case(monitor_16_9.id, office.id, admin.id, :editorial, Decimal.new("0.85"))

{:ok, _} =
  Taxonomy.assign_use_case(
    monitor_ultrawide.id,
    creative.id,
    admin.id,
    :editorial,
    Decimal.new("0.9")
  )

{:ok, _} =
  Taxonomy.assign_use_case(
    monitor_ultrawide.id,
    home_theater.id,
    admin.id,
    :editorial,
    Decimal.new("0.6")
  )

panel_option_by_code = fn code ->
  Repo.get_by!(EnumOption, enum_set_id: panel_tech_set.id, code: code)
end

ensure_current_claim = fn product, attribute, typed_value, provenance ->
  claim_query =
    from c in ProductCompareSchemas.Specs.ProductAttributeClaim,
      where: c.product_id == ^product.id and c.attribute_id == ^attribute.id,
      where:
        ^Enum.reduce(typed_value, dynamic(true), fn {field, value}, dyn ->
          dynamic([c], ^dyn and field(c, ^field) == ^value)
        end),
      limit: 1

  claim = Repo.one(claim_query)

  claim =
    if claim do
      claim
    else
      {:ok, new_claim} = Specs.propose_claim(product.id, attribute.id, typed_value, provenance)
      {:ok, accepted_claim} = Specs.accept_claim(new_claim.id, moderator.id)
      accepted_claim
    end

  {:ok, _current} = Specs.select_current_claim(product.id, attribute.id, claim.id, moderator.id)
  :ok
end

provenance = %{source_type: :user, created_by: admin.id, confidence: Decimal.new("0.9")}

:ok =
  ensure_current_claim.(
    monitor_16_9,
    refresh_rate_attr,
    %{value_num: Decimal.new("165"), unit_id: hz_unit.id},
    provenance
  )

:ok = ensure_current_claim.(monitor_16_9, hdr_supported_attr, %{value_bool: true}, provenance)

:ok =
  ensure_current_claim.(
    monitor_16_9,
    panel_tech_attr,
    %{enum_option_id: panel_option_by_code.("qd_oled").id},
    provenance
  )

:ok =
  ensure_current_claim.(
    monitor_16_9,
    diagonal_attr,
    %{value_num: Decimal.new("27"), unit_id: in_unit.id},
    provenance
  )

:ok =
  ensure_current_claim.(
    monitor_ultrawide,
    refresh_rate_attr,
    %{value_num: Decimal.new("144"), unit_id: hz_unit.id},
    provenance
  )

:ok =
  ensure_current_claim.(monitor_ultrawide, hdr_supported_attr, %{value_bool: true}, provenance)

:ok =
  ensure_current_claim.(
    monitor_ultrawide,
    panel_tech_attr,
    %{enum_option_id: panel_option_by_code.("mini_led").id},
    provenance
  )

:ok =
  ensure_current_claim.(
    monitor_ultrawide,
    diagonal_attr,
    %{value_num: Decimal.new("27"), unit_id: in_unit.id},
    provenance
  )

{:ok, merchant} = Pricing.upsert_merchant(%{name: "ExampleMart", domain: "examplemart.test"})

{:ok, merchant_product} =
  Pricing.upsert_merchant_product(%{
    merchant_id: merchant.id,
    product_id: monitor_16_9.id,
    external_sku: "EXM-AV27G",
    url: "https://examplemart.test/products/acme-vision-27g",
    currency: "USD"
  })

for {timestamp, price} <- [
      {~U[2026-01-10 12:00:00Z], Decimal.new("699.99")},
      {~U[2026-02-01 12:00:00Z], Decimal.new("679.99")},
      {~U[2026-03-01 12:00:00Z], Decimal.new("649.99")}
    ] do
  case Repo.get_by(PricePoint, merchant_product_id: merchant_product.id, observed_at: timestamp) do
    nil ->
      {:ok, _} =
        Pricing.add_price_point(%{
          merchant_product_id: merchant_product.id,
          observed_at: timestamp,
          price: price,
          shipping: Decimal.new("0"),
          in_stock: true
        })

    _existing ->
      :ok
  end
end

IO.puts("Seed completed: taxonomies, sample products, typed claims, and price history.")
