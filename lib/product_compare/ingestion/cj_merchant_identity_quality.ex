defmodule ProductCompare.Ingestion.CJMerchantIdentityQuality do
  @moduledoc """
  Safe read-only merchant identity quality aggregate for CJ-linked merchants.

  The summary uses CJ source-scoped merchant identities and returns aggregate
  completeness counts plus duplicate examples bounded by `duplicate_example_limit`
  for both returned groups and identities per group. It does not expose source
  identifiers, credentials, raw provider payloads, or tracking parameters.
  """

  import Ecto.Query

  alias ProductCompare.Ingestion.CJSource
  alias ProductCompare.Ingestion.OptionNormalization
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
    identity_query = cj_identity_query()
    counts = identity_counts(identity_query)

    %{
      provider: @provider,
      duplicate_example_limit: duplicate_example_limit,
      identity_count: counts.identity_count,
      missing_merchant_name_count: counts.missing_merchant_name_count,
      missing_merchant_domain_count: counts.missing_merchant_domain_count,
      duplicate_domain_count: duplicate_group_count(identity_query, :merchant_domain),
      duplicate_name_count: duplicate_group_count(identity_query, :merchant_name),
      duplicate_domains:
        duplicate_examples(identity_query, :merchant_domain, :domain, duplicate_example_limit),
      duplicate_merchant_names:
        duplicate_examples(
          identity_query,
          :merchant_name,
          :merchant_name,
          duplicate_example_limit
        )
    }
  end

  defp cj_identity_query do
    MerchantSourceIdentity
    |> join(:inner, [identity], source in subquery(CJSource.query()),
      on: source.id == identity.source_id
    )
  end

  defp identity_counts(query) do
    Repo.one(
      from identity in query,
        select: %{
          identity_count: count(identity.id),
          missing_merchant_name_count:
            fragment(
              "count(*) FILTER (WHERE NULLIF(BTRIM(?), '') IS NULL)",
              identity.merchant_name
            ),
          missing_merchant_domain_count:
            fragment(
              "count(*) FILTER (WHERE NULLIF(BTRIM(?), '') IS NULL)",
              identity.merchant_domain
            )
        }
    )
  end

  defp duplicate_group_count(query, field) do
    duplicate_group_query(query, field)
    |> subquery()
    |> select([group], count(group.value))
    |> Repo.one()
  end

  defp duplicate_examples(query, field, output_key, limit) do
    duplicate_groups =
      duplicate_group_query(query, field)
      |> subquery()
      |> order_by([group], desc: group.identity_count, asc: group.value)
      |> limit(^limit)
      |> select([group], %{value: group.value, identity_count: group.identity_count})
      |> Repo.all()

    identities_by_value =
      query
      |> duplicate_group_identities(field, Enum.map(duplicate_groups, & &1.value), limit)

    Enum.map(duplicate_groups, fn group ->
      %{
        output_key => group.value,
        identity_count: group.identity_count,
        identities: Map.get(identities_by_value, group.value, [])
      }
    end)
  end

  defp duplicate_group_query(query, field) do
    query
    |> where(
      [identity],
      not is_nil(fragment("NULLIF(LOWER(BTRIM(?)), '')", field(identity, ^field)))
    )
    |> group_by([identity], fragment("NULLIF(LOWER(BTRIM(?)), '')", field(identity, ^field)))
    |> having([identity], count(identity.id) > 1)
    |> select([identity], %{
      value: fragment("NULLIF(LOWER(BTRIM(?)), '')", field(identity, ^field)),
      identity_count: count(identity.id)
    })
  end

  defp duplicate_group_identities(_query, _field, [], _limit), do: %{}

  defp duplicate_group_identities(query, field, values, limit) do
    ranked_identities =
      query
      |> where(
        [identity],
        fragment("NULLIF(LOWER(BTRIM(?)), '')", field(identity, ^field)) in ^values
      )
      |> windows(
        [identity],
        duplicate_group: [
          partition_by: fragment("NULLIF(LOWER(BTRIM(?)), '')", field(identity, ^field)),
          order_by: identity.id
        ]
      )
      |> select([identity], %{
        value: fragment("NULLIF(LOWER(BTRIM(?)), '')", field(identity, ^field)),
        id: identity.id,
        merchant_name: identity.merchant_name,
        merchant_domain: identity.merchant_domain,
        row_number: over(row_number(), :duplicate_group)
      })

    ranked_identities
    |> subquery()
    |> where([identity], identity.row_number <= ^limit)
    |> order_by([identity], asc: identity.value, asc: identity.id)
    |> select([identity], %{
      value: identity.value,
      id: identity.id,
      merchant_name: identity.merchant_name,
      merchant_domain: identity.merchant_domain
    })
    |> Repo.all()
    |> Enum.group_by(
      & &1.value,
      &%{
        id: &1.id,
        merchant_name: &1.merchant_name,
        merchant_domain: &1.merchant_domain
      }
    )
  end

  defp duplicate_example_limit(opts) do
    OptionNormalization.bounded_integer(
      OptionNormalization.option(
        opts,
        :duplicate_example_limit,
        @default_duplicate_example_limit
      ),
      default: @default_duplicate_example_limit,
      min: @min_duplicate_example_limit,
      max: @max_duplicate_example_limit
    )
  end
end
