defmodule ProductCompare.Ingestion.CJMerchantIdentityQuality do
  @moduledoc """
  Safe read-only merchant identity quality aggregate for CJ-linked merchants.

  The summary uses CJ source-scoped merchant identities and returns aggregate
  completeness counts plus bounded duplicate examples. It does not expose source
  identifiers, credentials, raw provider payloads, or tracking parameters.
  """

  import Ecto.Query

  alias ProductCompare.Ingestion.CJSource
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantSourceIdentity

  @provider "cj"
  @default_duplicate_example_limit 5
  @min_duplicate_example_limit 1
  @max_duplicate_example_limit 25

  @type safe_identity :: %{
          id: pos_integer(),
          merchant_name: String.t() | nil,
          merchant_domain: String.t() | nil
        }

  @type duplicate_domain :: %{
          domain: String.t(),
          identity_count: pos_integer(),
          identities: [safe_identity()]
        }

  @type duplicate_merchant_name :: %{
          merchant_name: String.t(),
          identity_count: pos_integer(),
          identities: [safe_identity()]
        }

  @type summary :: %{
          provider: String.t(),
          duplicate_example_limit: pos_integer(),
          identity_count: non_neg_integer(),
          missing_merchant_name_count: non_neg_integer(),
          missing_merchant_domain_count: non_neg_integer(),
          duplicate_domain_count: non_neg_integer(),
          duplicate_name_count: non_neg_integer(),
          duplicate_domains: [duplicate_domain()],
          duplicate_merchant_names: [duplicate_merchant_name()]
        }

  @spec summary(keyword() | map() | term()) :: summary()
  def summary(opts \\ []) do
    duplicate_example_limit = duplicate_example_limit(opts)
    identities = cj_identities()

    duplicate_domains = duplicate_groups(identities, :merchant_domain, :domain)
    duplicate_merchant_names = duplicate_groups(identities, :merchant_name, :merchant_name)

    %{
      provider: @provider,
      duplicate_example_limit: duplicate_example_limit,
      identity_count: length(identities),
      missing_merchant_name_count: Enum.count(identities, &blank?(&1.merchant_name)),
      missing_merchant_domain_count: Enum.count(identities, &blank?(&1.merchant_domain)),
      duplicate_domain_count: length(duplicate_domains),
      duplicate_name_count: length(duplicate_merchant_names),
      duplicate_domains: limited_duplicate_examples(duplicate_domains, duplicate_example_limit),
      duplicate_merchant_names:
        limited_duplicate_examples(duplicate_merchant_names, duplicate_example_limit)
    }
  end

  defp cj_identities do
    MerchantSourceIdentity
    |> join(:inner, [identity], source in subquery(CJSource.query()),
      on: source.id == identity.source_id
    )
    |> order_by([identity], asc: identity.id)
    |> select([identity], %{
      id: identity.id,
      merchant_name: identity.merchant_name,
      merchant_domain: identity.merchant_domain
    })
    |> Repo.all()
  end

  defp duplicate_groups(identities, field, output_key) do
    identities
    |> Enum.group_by(&(normalize_key(Map.fetch!(&1, field)) || :missing))
    |> Map.delete(:missing)
    |> Enum.filter(fn {_key, group_identities} -> length(group_identities) > 1 end)
    |> Enum.sort_by(fn {key, group_identities} -> {-length(group_identities), key} end)
    |> Enum.map(fn {key, group_identities} ->
      %{
        output_key => key,
        identity_count: length(group_identities),
        identities: Enum.sort_by(group_identities, & &1.id)
      }
    end)
  end

  defp limited_duplicate_examples(duplicate_groups, limit) do
    duplicate_groups
    |> Enum.take(limit)
    |> Enum.map(fn duplicate_group ->
      %{duplicate_group | identities: Enum.take(duplicate_group.identities, limit)}
    end)
  end

  defp duplicate_example_limit(opts) do
    opts
    |> option(:duplicate_example_limit, @default_duplicate_example_limit)
    |> normalize_duplicate_example_limit()
    |> max(@min_duplicate_example_limit)
    |> min(@max_duplicate_example_limit)
  end

  defp option(opts, key, default) when is_list(opts) do
    if Keyword.keyword?(opts) do
      Keyword.get(opts, key, default)
    else
      default
    end
  end

  defp option(opts, key, default) when is_map(opts),
    do: Map.get(opts, key, Map.get(opts, Atom.to_string(key), default))

  defp option(_opts, _key, default), do: default

  defp normalize_duplicate_example_limit(value) when is_integer(value), do: value

  defp normalize_duplicate_example_limit(value) when is_binary(value) do
    case Integer.parse(value) do
      {limit, ""} -> limit
      _invalid -> @default_duplicate_example_limit
    end
  end

  defp normalize_duplicate_example_limit(_value), do: @default_duplicate_example_limit

  defp normalize_key(value) when is_binary(value) do
    value
    |> String.trim()
    |> case do
      "" -> nil
      value -> String.downcase(value)
    end
  end

  defp normalize_key(_value), do: nil

  defp blank?(value), do: is_nil(normalize_key(value))
end
