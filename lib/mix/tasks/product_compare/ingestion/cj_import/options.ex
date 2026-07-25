defmodule Mix.Tasks.ProductCompare.Ingestion.CjImport.Options do
  @moduledoc false

  alias ProductCompare.Ingestion.CJPrograms
  alias ProductCompare.Ingestion.Sources.CJ.IdNormalizer

  @credential_requirements [
    {"CJ_API_TOKEN", :api_token},
    {"CJ_ACCOUNT_ID", :company_id}
  ]

  def parse_argv(argv) do
    {opts, args, invalid} =
      OptionParser.parse(argv,
        strict: [
          currency: :string,
          complete_scope: :boolean,
          keywords: :string,
          limit: :integer,
          offset: :integer,
          pages: :integer,
          serviceable_area: :string,
          check_credentials: :boolean,
          require_ready: :boolean,
          provider_feed_id: :keep,
          from_programs: :boolean,
          stage: :keep,
          feed_limit: :integer
        ]
      )

    validate_argv!(args, invalid)

    opts
    |> parse_optional_keywords()
    |> Keyword.put_new(:limit, 25)
    |> Keyword.put_new(:cursor, Keyword.get(opts, :offset))
    |> Keyword.put_new(:currency, "USD")
    |> Keyword.put_new(:complete_scope, false)
    |> Keyword.put_new(:pages, 1)
    |> Keyword.put_new(:check_credentials, false)
    |> Keyword.put_new(:require_ready, false)
    |> Keyword.put_new(:serviceable_areas, Keyword.get(opts, :serviceable_area, "US"))
  end

  def normalize_program_import_opts!(opts) do
    program_stages = Keyword.get(opts, :program_stages, Keyword.get_values(opts, :stage))

    opts
    |> Keyword.delete(:provider_feed_id)
    |> Keyword.delete(:stage)
    |> Keyword.put(:provider_feed_ids, normalize_provider_feed_ids(opts))
    |> Keyword.put(:program_stages, normalize_program_stages!(program_stages))
  end

  def fetch_opts(opts) do
    [
      ad_ids: normalize_ids(Keyword.get(opts, :ad_ids, Keyword.get(opts, :provider_feed_id))),
      currency: Keyword.get(opts, :currency, "USD"),
      keywords: Keyword.get(opts, :keywords, ["shoe"]),
      limit: Keyword.get(opts, :limit, 25),
      merchant_feed_candidate_id: Keyword.get(opts, :merchant_feed_candidate_id),
      partner_ids:
        normalize_ids(Keyword.get(opts, :partner_ids, Keyword.get(opts, :advertiser_ids))),
      provider_feed_id: Keyword.get(opts, :provider_feed_id),
      feed_name: Keyword.get(opts, :feed_name),
      serviceable_areas: Keyword.get(opts, :serviceable_areas, ["US"])
    ]
  end

  def page_count(opts) do
    case Keyword.get(opts, :pages, 1) do
      value when is_integer(value) and value > 0 -> value
      _invalid -> 1
    end
  end

  defp normalize_provider_feed_id_list!(values) do
    values
    |> List.wrap()
    |> Enum.flat_map(&List.wrap/1)
    |> Enum.map(&IdNormalizer.normalize_id/1)
    |> reject_blank_provider_feed_ids!()
    |> Enum.uniq()
  end

  def normalize_string(value), do: IdNormalizer.normalize_id(value)

  defp normalize_program_stages!(values) do
    pursued_stages = CJPrograms.pursued_stages()

    stages =
      values
      |> List.wrap()
      |> Enum.flat_map(&List.wrap/1)
      |> Enum.map(&normalize_string/1)
      |> Enum.reject(&is_nil/1)
      |> Enum.uniq()

    case Enum.find(stages, &(&1 not in pursued_stages)) do
      nil ->
        if(stages == [], do: pursued_stages, else: stages)

      invalid_stage ->
        Mix.raise(
          "invalid --stage: #{inspect(invalid_stage)}; expected one of #{Enum.join(pursued_stages, ", ")}"
        )
    end
  end

  def credential_report(opts) do
    missing_required =
      @credential_requirements
      |> Enum.reject(fn {env_var, opt_key} -> credential_present?(opts, env_var, opt_key) end)
      |> Enum.map(fn {env_var, _opt_key} -> env_var end)

    %{
      provider: "cj",
      surface: "shoppingProducts",
      ready: missing_required == [],
      missing_required: missing_required
    }
  end

  defp parse_keywords(value) do
    value
    |> String.split(",", trim: true)
    |> Enum.map(&String.trim/1)
    |> Enum.reject(&(&1 == ""))
    |> case do
      [] -> ["shoe"]
      keywords -> keywords
    end
  end

  defp validate_argv!([argument | _rest], _invalid) do
    Mix.raise("unexpected argument: #{argument}")
  end

  defp validate_argv!([], [{option, _value} | _rest]) do
    Mix.raise("unsupported option: #{option}")
  end

  defp validate_argv!([], []), do: :ok

  defp parse_optional_keywords(opts) do
    if Keyword.has_key?(opts, :keywords) do
      Keyword.update!(opts, :keywords, &parse_keywords/1)
    else
      opts
    end
  end

  defp normalize_provider_feed_ids(opts) do
    opts
    |> Keyword.get_values(:provider_feed_id)
    |> Enum.flat_map(&List.wrap/1)
    |> Enum.concat(List.wrap(Keyword.get(opts, :provider_feed_ids, [])))
    |> normalize_provider_feed_id_list!()
  end

  defp reject_blank_provider_feed_ids!(ids) do
    if Enum.any?(ids, &is_nil/1) do
      Mix.raise("invalid --provider-feed-id: expected a non-empty CJ feed id")
    end

    ids
  end

  defp normalize_ids(value) do
    value
    |> IdNormalizer.normalize_ids()
    |> case do
      nil -> nil
      values -> values
    end
    |> maybe_uniq_ids()
  end

  defp maybe_uniq_ids(nil), do: nil
  defp maybe_uniq_ids(values), do: Enum.uniq(values)

  defp credential_present?(opts, env_var, opt_key) do
    opts
    |> Keyword.get(opt_key)
    |> IdNormalizer.blank_to_nil()
    |> case do
      nil -> env_var |> System.get_env() |> IdNormalizer.blank_to_nil()
      value -> value
    end
    |> is_nil()
    |> Kernel.not()
  end
end
