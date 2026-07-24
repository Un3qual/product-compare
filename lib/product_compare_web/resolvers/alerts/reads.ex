defmodule ProductCompareWeb.Resolvers.Alerts.Reads do
  @moduledoc false

  alias ProductCompare.Alerts
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.AuthorizedConnection
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.Input

  @spec my_price_watches(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, term()}
  def my_price_watches(_parent, args, %{
        context: %{current_user: user, loader: %Dataloader{} = loader}
      }) do
    load_alert_connection(loader, user, args, :price_watches, %{
      enabled: Input.fetch_value(args, :enabled)
    })
  end

  def my_price_watches(_parent, args, %{context: %{current_user: user}}) do
    user.id
    |> Alerts.list_watch_rules_query(enabled: Input.fetch_value(args, :enabled))
    |> Connection.from_query_result(Input.connection_args(args), Repo)
  end

  def my_price_watches(_parent, _args, _resolution),
    do: {:error, GraphQLErrors.unauthenticated()}

  @spec my_alert_events(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, term()}
  def my_alert_events(_parent, args, %{
        context: %{current_user: user, loader: %Dataloader{} = loader}
      }) do
    load_alert_connection(loader, user, args, :alert_events, %{
      unread_only: Input.fetch_value(args, :unread_only, false)
    })
  end

  def my_alert_events(_parent, args, %{context: %{current_user: user}}) do
    user.id
    |> Alerts.list_alert_events_query(unread_only: Input.fetch_value(args, :unread_only, false))
    |> Connection.from_query_result(Input.connection_args(args), Repo)
  end

  def my_alert_events(_parent, _args, _resolution),
    do: {:error, GraphQLErrors.unauthenticated()}

  defp load_alert_connection(loader, user, args, collection_kind, filters) do
    AuthorizedConnection.load_owner(
      loader,
      user,
      collection_kind,
      filters,
      Input.connection_args(args)
    )
  end
end
