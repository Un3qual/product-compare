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
        description:
          "Development #{String.downcase(type_name)} fixture #{number} for deterministic catalog and marketplace coverage.",
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
