defmodule ProductCompareWeb.Resolvers.ComparisonSnapshotsResolver do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.ComparisonSnapshots
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.AuthorizedConnection
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareWeb.GraphQL.Loader

  @disclaimer "This comparison is a captured snapshot. Prices, availability, and product facts may have changed since the captured time."

  def comparison_snapshot(_parent, %{token: token}, %{context: %{loader: loader}}) do
    source = Loader.public_opaque_source()

    loader
    |> Dataloader.load(source, :comparison_snapshot, token)
    |> on_load(fn loader ->
      {:ok, Dataloader.get(loader, source, :comparison_snapshot, token)}
    end)
  end

  def comparison_snapshot(_parent, %{token: token}, _resolution) do
    {:ok, ComparisonSnapshots.get_public(token)}
  end

  def owned_snapshots(%{id: user_id}, args, %{
        context: %{
          current_user: %{id: user_id} = current_user,
          loader: %Dataloader{} = loader
        }
      }) do
    connection_args = Input.connection_args(args)

    AuthorizedConnection.load_owner(
      loader,
      current_user,
      :comparison_snapshots,
      %{},
      connection_args
    )
  end

  def owned_snapshots(%{id: user_id}, args, %{context: %{current_user: %{id: user_id}}}) do
    user_id
    |> ComparisonSnapshots.active_for_owner_query()
    |> Connection.from_query_result(Input.connection_args(args), Repo)
  end

  def owned_snapshots(_parent, _args, _resolution),
    do: {:error, GraphQLErrors.unauthenticated()}

  def publish(_parent, %{input: input}, %{context: %{current_user: current_user}}) do
    with {:ok, product_ids} <-
           Input.decode_integer_id_list(
             Input.fetch_list_value(input, :product_ids),
             :product,
             "productIds"
           ),
         {:ok, snapshot} <-
           ComparisonSnapshots.publish(current_user.id, %{
             title: Input.fetch_value(input, :title),
             search_indexable: Input.fetch_value(input, :search_indexable, false),
             product_ids: product_ids,
             recommendation_profile:
               Input.fetch_value(input, :recommendation_profile, :lowest_current_cost)
           }) do
      {:ok, publish_payload(snapshot, "/compare/shared/#{snapshot.public_token}", [])}
    else
      {:error, message} when is_binary(message) ->
        {:ok, error_payload("INVALID_ID", message, "productIds")}

      {:error, :invalid_products} ->
        {:ok,
         error_payload(
           "INVALID_PRODUCTS",
           "comparison snapshots require two or three distinct products",
           "productIds"
         )}

      {:error, :product_not_found} ->
        {:ok, error_payload("NOT_FOUND", "product not found", "productIds")}

      {:error, :invalid_profile} ->
        {:ok,
         error_payload(
           "INVALID_PROFILE",
           "invalid recommendation profile",
           "recommendationProfile"
         )}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:ok, publish_payload(nil, nil, GraphQLErrors.changeset_mutation_errors(changeset))}
    end
  end

  def publish(_parent, _args, _resolution) do
    {:ok, error_payload(GraphQLErrors.unauthenticated_mutation_error())}
  end

  def revoke(_parent, %{snapshot_id: id}, %{context: %{current_user: current_user}}) do
    with {:ok, entropy_id} <- GlobalId.decode_uuid(id, :comparison_snapshot),
         {:ok, snapshot} <- ComparisonSnapshots.revoke(current_user.id, entropy_id) do
      {:ok,
       %{
         revoked_snapshot_id: GlobalId.encode(:comparison_snapshot, snapshot.entropy_id),
         errors: []
       }}
    else
      _ -> {:ok, revoke_error_payload("NOT_FOUND", "comparison snapshot not found")}
    end
  end

  def revoke(_parent, _args, _resolution) do
    {:ok, revoke_error_payload(GraphQLErrors.unauthenticated_mutation_error())}
  end

  def captured_at(snapshot, _args, _resolution),
    do: snapshot |> snapshot_payload() |> Map.fetch!(:captured_at) |> iso_datetime()

  def snapshot_products(snapshot, _args, _resolution),
    do: {:ok, snapshot |> snapshot_payload() |> Map.fetch!(:products)}

  def recommendation(snapshot, _args, _resolution),
    do: {:ok, snapshot |> snapshot_payload() |> Map.fetch!(:recommendation)}

  def disclaimer(_snapshot, _args, _resolution), do: {:ok, @disclaimer}

  def share_path(snapshot, _args, _resolution),
    do: {:ok, "/compare/shared/#{snapshot.public_token}"}

  def offer_observed_at(offer, _args, _resolution), do: iso_datetime(offer.observed_at)
  def evidence_fetched_at(evidence, _args, _resolution), do: iso_datetime(evidence.fetched_at)

  defp iso_datetime(value) when is_binary(value) do
    case DateTime.from_iso8601(value) do
      {:ok, datetime, _offset} -> {:ok, datetime}
      _ -> {:error, "invalid captured datetime"}
    end
  end

  defp snapshot_payload(%{payload: %{captured_at: _captured_at} = payload}), do: payload
  defp snapshot_payload(snapshot), do: ComparisonSnapshots.hydrate(snapshot).payload

  defp error_payload(code, message, field) do
    publish_payload(nil, nil, [GraphQLErrors.mutation_error(code, message, field)])
  end

  defp error_payload(error), do: publish_payload(nil, nil, [error])

  defp publish_payload(snapshot, share_path, errors),
    do: %{snapshot: snapshot, share_path: share_path, errors: errors}

  defp revoke_error_payload(code, message) do
    %{revoked_snapshot_id: nil, errors: [GraphQLErrors.mutation_error(code, message)]}
  end

  defp revoke_error_payload(error), do: %{revoked_snapshot_id: nil, errors: [error]}
end
