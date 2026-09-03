defmodule ProductCompare.DevSeeds.Profile do
  @moduledoc false

  @bounded_engagement %{
    saved_sets: 24,
    watches: 48,
    alerts: 64,
    reviews: 120,
    questions: 80,
    corrections: 24
  }
  @full_engagement %{
    saved_sets: 60,
    watches: 160,
    alerts: 240,
    reviews: 300,
    questions: 180,
    corrections: 90
  }
  @bounded_operations %{feeds: 70, imports: 40, clicks: 120, conversions: 80}
  @full_operations %{feeds: 210, imports: 120, clicks: 600, conversions: 400}
  @shared %{
    product_count: 300,
    merchant_count: 70,
    full_engagement_targets: @full_engagement,
    full_operations_targets: @full_operations
  }
  @profiles %{
    bounded: %{
      density: :bounded,
      offer_range: 1_700..1_900,
      engagement_targets: @bounded_engagement,
      operations_targets: @bounded_operations
    },
    full: %{
      density: :full,
      offer_range: 2_900..3_100,
      engagement_targets: @full_engagement,
      operations_targets: @full_operations
    }
  }

  @spec parse!([String.t()]) :: map()
  def parse!(argv) do
    density_option_count =
      Enum.count(argv, &(&1 == "--density" or String.starts_with?(&1, "--density=")))

    if density_option_count > 1 do
      raise ArgumentError, "density may be supplied once"
    end

    {options, arguments, invalid} =
      OptionParser.parse(argv, strict: [density: :string])

    densities = Keyword.get_values(options, :density)

    cond do
      arguments != [] or invalid != [] ->
        raise ArgumentError, "unknown seed arguments: #{inspect(arguments ++ invalid)}"

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
    %{now | minute: 0, second: 0, microsecond: {0, 6}}
  end

  defp density!("bounded"), do: :bounded
  defp density!("full"), do: :full
  defp density!(_value), do: raise(ArgumentError, "density must be bounded or full")
end
