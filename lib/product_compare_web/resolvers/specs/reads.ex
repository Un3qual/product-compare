defmodule ProductCompareWeb.Resolvers.Specs.Reads do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompareWeb.GraphQL.Authorization
  alias ProductCompareWeb.GraphQL.AuthorizedConnection
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareWeb.GraphQL.Loader

  @spec source_artifact(any(), %{id: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, term() | nil}
          | {:error, String.t()}
          | Absinthe.Resolution.Helpers.dataloader_tuple()
  def source_artifact(_parent, %{id: id}, %{context: %{loader: loader}}) do
    with {:ok, artifact_id} <- GlobalId.decode_integer(id, :source_artifact) do
      source = Loader.public_opaque_source()

      loader
      |> Loader.load(source, :source_artifact, artifact_id)
      |> on_load(fn loader ->
        {:ok, Loader.get(loader, source, :source_artifact, artifact_id)}
      end)
    else
      :error -> {:error, "invalid source artifact id"}
    end
  end

  def source_artifact(_parent, %{id: id}, _resolution) do
    case GlobalId.decode_integer(id, :source_artifact) do
      {:ok, artifact_id} -> {:ok, Specs.get_source_artifact(artifact_id)}
      :error -> {:error, "invalid source artifact id"}
    end
  end

  @spec my_specification_corrections(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, term()}
  def my_specification_corrections(_parent, args, %{
        context: %{current_user: user, loader: %Dataloader{} = loader}
      }) do
    connection_args = Input.connection_args(args)
    filters = %{status: Input.fetch_value(args, :status)}

    AuthorizedConnection.load_owner(
      loader,
      user,
      :specification_corrections,
      filters,
      connection_args
    )
  end

  def my_specification_corrections(_parent, args, %{context: %{current_user: user}}) do
    user.id
    |> Specs.list_user_corrections_query(status: Input.fetch_value(args, :status))
    |> Connection.from_query_result(Input.connection_args(args), Repo)
  end

  def my_specification_corrections(_parent, _args, _resolution),
    do: {:error, GraphQLErrors.unauthenticated()}

  @spec specification_correction_moderation_queue(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, term()}
  def specification_correction_moderation_queue(
        _parent,
        args,
        %{
          context: %{loader: %Dataloader{} = loader}
        } = resolution
      ) do
    connection_args = Input.connection_args(args)
    filters = %{status: Input.fetch_value(args, :status, :pending)}

    AuthorizedConnection.load_operator(
      resolution,
      loader,
      :specification_correction_moderation_queue,
      filters,
      connection_args
    )
  end

  def specification_correction_moderation_queue(_parent, args, resolution) do
    with {:ok, _operator} <- Authorization.require_operator(resolution) do
      Specs.list_correction_moderation_query(status: Input.fetch_value(args, :status, :pending))
      |> Connection.from_query_result(Input.connection_args(args), Repo)
    else
      {:error, reason} -> {:error, GraphQLErrors.authorization_error(reason)}
    end
  end
end
