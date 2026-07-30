defmodule ProductCompare.Ingestion.CJProgramWarnings do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Reference.{Country, Currency, Language}

  @provider "cj"
  @warning_codes [
    "missing_advertiser_name",
    "missing_product_count",
    "non_us_market",
    "non_usd_currency",
    "non_english_language"
  ]
  @warning_fields %{
    "missing_advertiser_name" => :missing_advertiser_name,
    "missing_product_count" => :missing_product_count,
    "non_us_market" => :non_us_market,
    "non_usd_currency" => :non_usd_currency,
    "non_english_language" => :non_english_language
  }

  @spec by_program_ids([term()]) :: %{optional(pos_integer()) => [String.t()]}
  def by_program_ids(program_ids) do
    program_ids = positive_program_ids(program_ids)
    warnings_by_program = Map.new(program_ids, &{&1, []})

    case program_ids do
      [] ->
        warnings_by_program

      _program_ids ->
        program_ids
        |> warning_rows()
        |> Enum.reduce(warnings_by_program, fn row, warnings_by_program ->
          Map.put(warnings_by_program, row.cj_program_id, warning_codes(row))
        end)
    end
  end

  defp warning_rows(program_ids) do
    MerchantFeedCandidate
    |> join(:inner, [feed], source in assoc(feed, :source))
    |> join(:left, [feed], country in Country, on: country.id == feed.advertiser_country)
    |> join(:left, [feed], currency in Currency, on: currency.id == feed.currency)
    |> join(:left, [feed], language in Language, on: language.id == feed.language)
    |> where(
      [feed, source],
      source.provider == @provider and feed.cj_program_id in ^program_ids
    )
    |> group_by([feed], feed.cj_program_id)
    |> select([feed, _source, country, currency, language], %{
      cj_program_id: feed.cj_program_id,
      missing_advertiser_name:
        fragment("bool_or(NULLIF(BTRIM(?), '') IS NULL)", feed.advertiser_name),
      missing_product_count:
        fragment("bool_or(? IS NULL OR ? <= 0)", feed.product_count, feed.product_count),
      non_us_market: fragment("bool_or(COALESCE(?, '') != 'US')", country.code),
      non_usd_currency: fragment("bool_or(COALESCE(?, '') != 'USD')", currency.code),
      non_english_language: fragment("bool_or(COALESCE(?, '') != 'EN')", language.code)
    })
    |> Repo.all()
  end

  defp warning_codes(row) do
    Enum.filter(@warning_codes, fn code ->
      row
      |> Map.fetch!(Map.fetch!(@warning_fields, code))
      |> Kernel.==(true)
    end)
  end

  defp positive_program_ids(program_ids) when is_list(program_ids) do
    program_ids
    |> Enum.filter(&(is_integer(&1) and &1 > 0))
    |> Enum.uniq()
  end

  defp positive_program_ids(_program_ids), do: []
end
