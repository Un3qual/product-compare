defmodule ProductCompareWeb.Resolvers.IngestionResolver do
  @moduledoc false

  alias ProductCompare.{Accounts, Ingestion}
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Authorization
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.GraphQL.Input

  @spec cj_programs(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t() | GraphQLErrors.top_level_error()}
  def cj_programs(_parent, args, resolution) do
    with {:ok, _operator} <- Authorization.require_operator(resolution),
         {:ok, connection} <-
           args
           |> program_query_options()
           |> Ingestion.list_cj_programs_query()
           |> Connection.from_query_result(Input.connection_args(args), Repo) do
      {:ok, merge_warning_codes(connection)}
    else
      {:error, reason} when reason in [:unauthenticated, :forbidden] ->
        {:error, GraphQLErrors.authorization_error(reason)}

      {:error, reason} ->
        {:error, reason}
    end
  end

  @spec cj_program(any(), %{id: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, map() | nil} | {:error, String.t() | GraphQLErrors.top_level_error()}
  def cj_program(_parent, %{id: id}, resolution) do
    with {:ok, _operator} <- Authorization.require_operator(resolution),
         {:ok, entropy_id} <- decode_program_id(id) do
      {:ok, Ingestion.get_cj_program_by_entropy_id(entropy_id)}
    else
      {:error, reason} when reason in [:unauthenticated, :forbidden] ->
        {:error, GraphQLErrors.authorization_error(reason)}

      {:error, :invalid_id} ->
        {:error, "invalid program id"}
    end
  end

  @spec cj_program_advertiser_name(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, String.t() | nil}
  def cj_program_advertiser_name(%{advertiser_name: advertiser_name}, _args, _resolution)
      when is_binary(advertiser_name) do
    {:ok, advertiser_name}
  end

  def cj_program_advertiser_name(program, _args, _resolution) do
    {:ok, summary_field(program, :advertiser_name)}
  end

  @spec cj_program_feed_count(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, non_neg_integer() | nil}
  def cj_program_feed_count(%{feed_count: feed_count}, _args, _resolution)
      when is_integer(feed_count) do
    {:ok, feed_count}
  end

  def cj_program_feed_count(program, _args, _resolution) do
    {:ok, summary_field(program, :feed_count)}
  end

  @spec cj_program_warning_codes(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, [String.t()]}
  def cj_program_warning_codes(%{warning_codes: warning_codes}, _args, _resolution)
      when is_list(warning_codes) do
    {:ok, warning_codes}
  end

  def cj_program_warning_codes(%{id: program_id}, _args, _resolution) do
    warning_codes =
      [program_id]
      |> Ingestion.cj_program_warnings()
      |> Map.get(program_id, [])

    {:ok, warning_codes}
  end

  @spec cj_program_stage_counts(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, GraphQLErrors.top_level_error()}
  def cj_program_stage_counts(_parent, _args, resolution) do
    with {:ok, _operator} <- Authorization.require_operator(resolution) do
      {:ok, Ingestion.cj_program_stage_counts()}
    else
      {:error, reason} -> {:error, GraphQLErrors.authorization_error(reason)}
    end
  end

  @spec cj_program_feeds(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t() | GraphQLErrors.top_level_error()}
  def cj_program_feeds(%{id: program_id}, args, resolution) do
    with {:ok, _operator} <- Authorization.require_operator(resolution) do
      [program_id: program_id]
      |> Ingestion.list_cj_program_feeds_query()
      |> Connection.from_query_result(Input.connection_args(args), Repo)
    else
      {:error, reason} -> {:error, GraphQLErrors.authorization_error(reason)}
    end
  end

  @spec unmatched_cj_feeds(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t() | GraphQLErrors.top_level_error()}
  def unmatched_cj_feeds(_parent, args, resolution) do
    with {:ok, _operator} <- Authorization.require_operator(resolution) do
      Ingestion.list_unmatched_cj_program_feeds_query()
      |> Connection.from_query_result(Input.connection_args(args), Repo)
    else
      {:error, reason} -> {:error, GraphQLErrors.authorization_error(reason)}
    end
  end

  @spec update_cj_program(any(), %{input: map()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def update_cj_program(_parent, %{input: input}, resolution) do
    with {:ok, user} <- Authorization.require_operator(resolution),
         {:ok, entropy_id} <- decode_program_id(Input.fetch_value(input, :id)),
         {:ok, program} <-
           update_cj_program_in_transaction(user.id, entropy_id, lifecycle_attrs(input)) do
      {:ok, %{program: program, errors: []}}
    else
      {:error, reason} when reason in [:unauthenticated, :forbidden] ->
        {:ok, program_error_payload(GraphQLErrors.authorization_mutation_error(reason))}

      {:error, :invalid_id} ->
        {:ok, program_error_payload("INVALID_ID", "invalid program id", "id")}

      {:error, :not_found} ->
        {:ok, program_error_payload("NOT_FOUND", "program not found")}

      {:error, :stale} ->
        {:ok, program_error_payload("CONFLICT", "program changed since it was loaded")}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:ok, %{program: nil, errors: GraphQLErrors.changeset_mutation_errors(changeset)}}
    end
  end

  def update_cj_program(_parent, _args, resolution) do
    case Authorization.require_operator(resolution) do
      {:error, reason} ->
        {:ok, program_error_payload(GraphQLErrors.authorization_mutation_error(reason))}

      {:ok, _operator} ->
        {:ok, program_error_payload("INVALID_INPUT", "invalid program input")}
    end
  end

  defp update_cj_program_in_transaction(operator_id, entropy_id, attrs) do
    Repo.transaction(fn ->
      case Accounts.lock_operator(operator_id) do
        {:ok, _operator} ->
          case Ingestion.update_cj_program_lifecycle(entropy_id, attrs) do
            {:ok, program} -> program
            {:error, reason} -> Repo.rollback(reason)
          end

        {:error, reason} ->
          Repo.rollback(reason)
      end
    end)
  end

  defp program_query_options(args) do
    [
      stage: normalize_stage(Input.fetch_value(args, :stage)),
      sort: Input.fetch_value(args, :sort, :name_asc)
    ]
  end

  defp merge_warning_codes(connection) do
    program_ids = Enum.map(connection.edges, & &1.node.id)
    warnings_by_program = Ingestion.cj_program_warnings(program_ids)

    Map.update!(connection, :edges, fn edges ->
      Enum.map(edges, fn edge ->
        Map.update!(edge, :node, fn program ->
          Map.put(program, :warning_codes, Map.get(warnings_by_program, program.id, []))
        end)
      end)
    end)
  end

  defp decode_program_id(value) when is_binary(value) do
    case GlobalId.decode_uuid(value, :cj_program) do
      {:ok, entropy_id} -> {:ok, entropy_id}
      :error -> {:error, :invalid_id}
    end
  end

  defp decode_program_id(_value), do: {:error, :invalid_id}

  defp lifecycle_attrs(input) do
    input
    |> Input.take([:stage, :note, :expected_changed_at])
    |> Map.update(:stage, nil, &normalize_stage/1)
  end

  defp normalize_stage(nil), do: nil
  defp normalize_stage(stage) when is_atom(stage), do: Atom.to_string(stage)
  defp normalize_stage(stage), do: stage

  defp summary_field(%{id: program_id}, field) do
    case Ingestion.get_cj_program_summary(program_id) do
      nil -> nil
      summary -> Map.get(summary, field)
    end
  end

  defp program_error_payload(code, message, field \\ nil) do
    program_error_payload(GraphQLErrors.mutation_error(code, message, field))
  end

  defp program_error_payload(error) do
    %{
      program: nil,
      errors: [error]
    }
  end
end
