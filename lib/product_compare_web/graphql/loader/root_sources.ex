defmodule ProductCompareWeb.GraphQL.Loader.RootSources do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.{Accounts, Affiliate, Alerts, Catalog, ComparisonSnapshots, Discussions}
  alias ProductCompare.{Ingestion, Repo, Specs}
  alias ProductCompareSchemas.Accounts.{ApiToken, User}

  alias ProductCompareSchemas.Affiliate.{
    AffiliateLink,
    AffiliateNetwork,
    AffiliateProgram,
    Coupon
  }

  alias ProductCompareSchemas.Alerts.{AlertEvent, PriceWatchRule}
  alias ProductCompareSchemas.Catalog.{ComparisonSnapshot, SavedComparisonSet}
  alias ProductCompareSchemas.Discussions.{ProductReview, ProductThread, ThreadPost}
  alias ProductCompareSchemas.Ingestion.{CJProgram, MerchantFeedCandidate}
  alias ProductCompareSchemas.Specs.SpecificationCorrection

  @spec authorized_nodes() :: Dataloader.Ecto.t()
  def authorized_nodes do
    Dataloader.Ecto.new(Repo,
      query: &authorized_node_query/2,
      run_batch: &authorized_node_batch/5
    )
  end

  defp authorized_node_query(CJProgram, _params), do: Ingestion.list_cj_programs_query()
  defp authorized_node_query(schema, _params), do: schema

  defp authorized_node_batch(schema, _query, {:visible_to, viewer_id}, entropy_ids, _repo_opts)
       when schema in [ProductReview, ProductThread, ThreadPost] and
              (is_nil(viewer_id) or (is_integer(viewer_id) and viewer_id > 0)) do
    type = community_type(schema)

    type
    |> Discussions.get_visible_nodes(entropy_ids, viewer_id)
    |> then(&batch_values(entropy_ids, &1))
  end

  defp authorized_node_batch(
         schema,
         _query,
         {:operator, operator_id},
         ids,
         _repo_opts
       )
       when schema in [AffiliateNetwork, AffiliateProgram, AffiliateLink, Coupon] and
              is_integer(operator_id) and operator_id > 0 do
    type = affiliate_type(schema)

    type
    |> Affiliate.get_affiliate_nodes(ids)
    |> then(&batch_values(ids, &1))
  end

  defp authorized_node_batch(
         CJProgram,
         query,
         {:operator, operator_id},
         entropy_ids,
         repo_opts
       )
       when is_integer(operator_id) and operator_id > 0 do
    programs =
      query
      |> where([program], program.entropy_id in ^entropy_ids)
      |> Repo.all(repo_opts)

    warning_codes = Ingestion.cj_program_warnings(Enum.map(programs, & &1.id))
    programs = Enum.map(programs, &Map.put(&1, :warning_codes, Map.get(warning_codes, &1.id, [])))

    entropy_ids
    |> project_records(programs, :entropy_id)
    |> then(&batch_values(entropy_ids, &1))
  end

  defp authorized_node_batch(
         MerchantFeedCandidate,
         _query,
         {:operator, operator_id},
         ids,
         repo_opts
       )
       when is_integer(operator_id) and operator_id > 0 do
    records =
      MerchantFeedCandidate
      |> join(:inner, [candidate], source in assoc(candidate, :source))
      |> where([candidate, _source], candidate.id in ^ids)
      |> select_merge([_candidate, source], %{provider: source.provider})
      |> Repo.all(repo_opts)

    ids
    |> project_records(records, :id)
    |> then(&batch_values(ids, &1))
  end

  defp authorized_node_batch(User, query, {:self, user_id}, entropy_ids, repo_opts)
       when is_integer(user_id) and user_id > 0 do
    records =
      query
      |> where([user], user.id == ^user_id and user.entropy_id in ^entropy_ids)
      |> Repo.all(repo_opts)

    entropy_ids
    |> project_records(records, :entropy_id)
    |> then(&batch_values(entropy_ids, &1))
  end

  defp authorized_node_batch(
         SavedComparisonSet,
         _query,
         {:owner, user_id},
         entropy_ids,
         _repo_opts
       )
       when is_integer(user_id) and user_id > 0 do
    %User{id: user_id}
    |> Catalog.get_saved_comparison_sets_for_user(entropy_ids)
    |> then(&batch_values(entropy_ids, &1))
  end

  defp authorized_node_batch(ApiToken, _query, {:owner, user_id}, entropy_ids, _repo_opts)
       when is_integer(user_id) and user_id > 0 do
    %User{id: user_id}
    |> Accounts.get_api_tokens_for_user(entropy_ids)
    |> then(&batch_values(entropy_ids, &1))
  end

  defp authorized_node_batch(
         ComparisonSnapshot,
         _query,
         {:owner, user_id},
         entropy_ids,
         repo_opts
       )
       when is_integer(user_id) and user_id > 0 do
    records =
      user_id
      |> ComparisonSnapshots.active_for_owner_query()
      |> where([snapshot], snapshot.entropy_id in ^entropy_ids)
      |> Repo.all(repo_opts)

    entropy_ids
    |> project_records(records, :entropy_id)
    |> then(&batch_values(entropy_ids, &1))
  end

  defp authorized_node_batch(
         PriceWatchRule,
         _query,
         {:owner, user_id},
         entropy_ids,
         repo_opts
       )
       when is_integer(user_id) and user_id > 0 do
    records =
      user_id
      |> Alerts.list_watch_rules_query()
      |> where([watch], watch.entropy_id in ^entropy_ids)
      |> Repo.all(repo_opts)

    entropy_ids
    |> project_records(records, :entropy_id)
    |> then(&batch_values(entropy_ids, &1))
  end

  defp authorized_node_batch(
         AlertEvent,
         _query,
         {:owner, user_id},
         entropy_ids,
         repo_opts
       )
       when is_integer(user_id) and user_id > 0 do
    records =
      user_id
      |> Alerts.list_alert_events_query()
      |> where([event], event.entropy_id in ^entropy_ids)
      |> Repo.all(repo_opts)

    entropy_ids
    |> project_records(records, :entropy_id)
    |> then(&batch_values(entropy_ids, &1))
  end

  defp authorized_node_batch(
         SpecificationCorrection,
         _query,
         {:owner, user_id},
         ids,
         repo_opts
       )
       when is_integer(user_id) and user_id > 0 do
    records =
      user_id
      |> Specs.list_user_corrections_query()
      |> where([correction], correction.id in ^ids)
      |> Repo.all(repo_opts)

    ids
    |> project_records(records, :id)
    |> then(&batch_values(ids, &1))
  end

  defp authorized_node_batch(
         SpecificationCorrection,
         _query,
         {:operator, operator_id},
         ids,
         repo_opts
       )
       when is_integer(operator_id) and operator_id > 0 do
    records =
      Specs.list_correction_moderation_query(status: nil)
      |> where([correction], correction.id in ^ids)
      |> Repo.all(repo_opts)

    ids
    |> project_records(records, :id)
    |> then(&batch_values(ids, &1))
  end

  defp community_type(ProductReview), do: :product_review
  defp community_type(ProductThread), do: :product_question
  defp community_type(ThreadPost), do: :product_answer

  defp affiliate_type(AffiliateNetwork), do: :affiliate_network
  defp affiliate_type(AffiliateProgram), do: :affiliate_program
  defp affiliate_type(AffiliateLink), do: :affiliate_link
  defp affiliate_type(Coupon), do: :coupon

  defp project_records(items, records, key) do
    records_by_key = Map.new(records, &{Map.fetch!(&1, key), &1})
    Map.new(items, &{&1, Map.get(records_by_key, &1)})
  end

  defp batch_values(ids, values_by_id) do
    Enum.map(ids, &[Map.get(values_by_id, &1)])
  end
end
