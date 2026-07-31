defmodule ProductCompareWeb.GraphQL.AuthorizedConnection do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompareWeb.GraphQL.Authorization
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.Loader

  @spec load_owner(Dataloader.t(), map(), atom(), map(), map()) ::
          Absinthe.Resolution.Helpers.dataloader_tuple() | {:error, String.t()}
  def load_owner(loader, user, collection_kind, filters, connection_args) do
    with {:ok, _window} <- Connection.batch_window_result(connection_args) do
      batch_key =
        {:owner, collection_kind, user.id, authorization_role(user), filters, connection_args}

      load_connection(loader, batch_key)
    end
  end

  @spec load_operator(Absinthe.Resolution.t(), Dataloader.t(), atom(), map(), map()) ::
          Absinthe.Resolution.Helpers.dataloader_tuple()
          | {:error, String.t() | GraphQLErrors.top_level_error()}
  def load_operator(resolution, loader, collection_kind, filters, connection_args) do
    with {:ok, operator} <- Authorization.require_operator(resolution),
         {:ok, _window} <- Connection.batch_window_result(connection_args) do
      batch_key =
        {:operator, collection_kind, operator.id, :operator, filters, connection_args}

      load_connection(loader, batch_key)
    else
      {:error, reason} when reason in [:unauthenticated, :forbidden] ->
        {:error, GraphQLErrors.authorization_error(reason)}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp load_connection(loader, batch_key) do
    source = Loader.authorized_connection_source()

    loader
    |> Loader.load(source, batch_key, :connection)
    |> on_load(fn loader ->
      {:ok, Loader.get(loader, source, batch_key, :connection)}
    end)
  end

  defp authorization_role(%{is_operator: true}), do: :operator
  defp authorization_role(_user), do: :member
end
