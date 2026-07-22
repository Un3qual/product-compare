defmodule ProductCompareWeb.Resolvers.SpecsResolver do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompare.Specs.ClaimValue
  alias ProductCompareWeb.GraphQL.Authorization
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareWeb.GraphQL.Loader
  alias ProductCompareSchemas.Specs.SpecificationCorrection

  @spec source_artifact(any(), %{id: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, term() | nil}
          | {:error, String.t()}
          | Absinthe.Resolution.Helpers.dataloader_tuple()
  def source_artifact(_parent, %{id: id}, %{context: %{loader: loader}}) do
    with {:ok, artifact_id} <- GlobalId.decode_integer(id, :source_artifact) do
      source = Loader.public_opaque_source()

      loader
      |> Dataloader.load(source, :source_artifact, artifact_id)
      |> on_load(fn loader ->
        {:ok, Dataloader.get(loader, source, :source_artifact, artifact_id)}
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

    with {:ok, _window} <- Connection.batch_window_result(connection_args) do
      load_owner_connection(
        loader,
        {:owner, :specification_corrections, user.id, authorization_role(user), filters,
         connection_args}
      )
    end
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
  def specification_correction_moderation_queue(_parent, args, resolution) do
    with {:ok, _operator} <- Authorization.require_operator(resolution) do
      Specs.list_correction_moderation_query(status: Input.fetch_value(args, :status, :pending))
      |> Connection.from_query_result(Input.connection_args(args), Repo)
    else
      {:error, reason} -> {:error, GraphQLErrors.authorization_error(reason)}
    end
  end

  @spec propose_specification_correction(any(), %{input: map()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def propose_specification_correction(_parent, %{input: input}, %{
        context: %{current_user: user}
      }) do
    with {:ok, product_id} <- decode_id(input, :product_id, :product),
         {:ok, attribute_id} <- decode_id(input, :attribute_id, :attribute),
         {:ok, typed_value} <- normalize_typed_value(Input.fetch_value(input, :value)),
         attrs <- Input.take(input, [:reason, :source_url, :explanation]),
         {:ok, correction} <-
           Specs.propose_correction(product_id, attribute_id, user.id, typed_value, attrs) do
      {:ok, %{correction: correction, errors: []}}
    else
      {:error, {:invalid_id, field}} ->
        {:ok, correction_error_payload("INVALID_ID", "invalid #{field}", field)}

      {:error, :product_not_found} ->
        {:ok, correction_error_payload("NOT_FOUND", "product not found", "productId")}

      {:error, :attribute_not_found} ->
        {:ok, correction_error_payload("NOT_FOUND", "attribute not found", "attributeId")}

      {:error, :invalid_typed_value} ->
        {:ok,
         correction_error_payload("INVALID_ARGUMENT", "provide exactly one typed value", "value")}

      {:error, reason}
      when reason in [
             :invalid_enum_option,
             :unit_not_found,
             :unit_dimension_mismatch,
             :invalid_decimal,
             :invalid_decimal_type
           ] ->
        {:ok, correction_error_payload("INVALID_ARGUMENT", "invalid typed value", "value")}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:ok, %{correction: nil, errors: GraphQLErrors.changeset_mutation_errors(changeset)}}

      {:error, _reason} ->
        {:ok, correction_error_payload("INVALID_ARGUMENT", "invalid correction", "value")}
    end
  end

  def propose_specification_correction(_parent, _args, _resolution) do
    {:ok, correction_error_payload(GraphQLErrors.unauthenticated_mutation_error())}
  end

  @spec moderate_specification_correction(any(), %{input: map()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def moderate_specification_correction(_parent, %{input: input}, resolution) do
    with {:ok, operator} <- Authorization.require_operator(resolution),
         {:ok, correction_id} <- decode_id(input, :id, :specification_correction),
         decision <- Input.fetch_value(input, :decision),
         attrs <- Input.take(input, [:moderation_note]),
         {:ok, correction} <-
           Specs.moderate_correction(correction_id, operator.id, decision, attrs) do
      {:ok, %{correction: correction, errors: []}}
    else
      {:error, reason} when reason in [:unauthenticated, :forbidden] ->
        {:ok, correction_error_payload(GraphQLErrors.authorization_mutation_error(reason))}

      {:error, {:invalid_id, _field}} ->
        {:ok, correction_error_payload("INVALID_ID", "invalid correction id", "id")}

      {:error, :correction_not_found} ->
        {:ok, correction_error_payload("NOT_FOUND", "correction not found", "id")}

      {:error, :stale_current_claim} ->
        {:ok,
         correction_error_payload(
           "CONFLICT",
           "current specification changed; reject and request a fresh proposal",
           "id"
         )}

      {:error, :invalid_status_transition} ->
        {:ok, correction_error_payload("CONFLICT", "correction already moderated", "decision")}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:ok, %{correction: nil, errors: GraphQLErrors.changeset_mutation_errors(changeset)}}

      {:error, _reason} ->
        {:ok, correction_error_payload("INVALID_ARGUMENT", "invalid moderation decision")}
    end
  end

  @spec correction_value_text(SpecificationCorrection.t(), map(), Absinthe.Resolution.t()) ::
          {:ok, String.t()}
  def correction_value_text(correction, _args, _resolution) do
    claim = loaded_claim(correction)
    {:ok, ClaimValue.format(claim)}
  end

  @spec moderation_note(SpecificationCorrection.t(), map(), Absinthe.Resolution.t()) ::
          {:ok, String.t() | nil}
  def moderation_note(correction, _args, resolution) do
    case Authorization.require_operator(resolution) do
      {:ok, _operator} -> {:ok, correction.moderation_note}
      {:error, _reason} -> {:ok, nil}
    end
  end

  defp decode_id(input, field, type) do
    case GlobalId.decode_integer(Input.fetch_value(input, field), type) do
      {:ok, id} -> {:ok, id}
      :error -> {:error, {:invalid_id, camelize(field)}}
    end
  end

  defp load_owner_connection(loader, batch_key) do
    source = Loader.authorized_connection_source()

    loader
    |> Dataloader.load(source, batch_key, :connection)
    |> on_load(fn loader ->
      {:ok, Dataloader.get(loader, source, batch_key, :connection)}
    end)
  end

  defp authorization_role(%{is_operator: true}), do: :operator
  defp authorization_role(_user), do: :member

  defp normalize_typed_value(value) when is_map(value) do
    value_fields = [
      :value_bool,
      :value_int,
      :value_num,
      :value_text,
      :value_date,
      :value_timestamp,
      :enum_option_id
    ]

    present_fields = Enum.filter(value_fields, &(not is_nil(Input.fetch_value(value, &1))))

    case present_fields do
      [_present_field] ->
        with {:ok, unit_id} <- decode_optional_id(value, :unit_id, :unit),
             {:ok, enum_option_id} <- decode_optional_id(value, :enum_option_id, :enum_option) do
          typed_value =
            value
            |> Input.take([:value_bool, :value_int, :value_num, :value_text, :value_date])
            |> Map.put(:value_ts, Input.fetch_value(value, :value_timestamp))
            |> Map.put(:unit_id, unit_id)
            |> Map.put(:enum_option_id, enum_option_id)
            |> Enum.reject(fn {_key, item} -> is_nil(item) end)
            |> Map.new()

          {:ok, typed_value}
        end

      _invalid_fields ->
        {:error, :invalid_typed_value}
    end
  end

  defp normalize_typed_value(_value), do: {:error, :invalid_typed_value}

  defp decode_optional_id(input, field, type) do
    case Input.fetch_value(input, field) do
      nil ->
        {:ok, nil}

      value ->
        case GlobalId.decode_integer(value, type) do
          {:ok, id} -> {:ok, id}
          :error -> {:error, :invalid_typed_value}
        end
    end
  end

  defp correction_error_payload(code, message, field \\ nil) do
    correction_error_payload(GraphQLErrors.mutation_error(code, message, field))
  end

  defp correction_error_payload(error) do
    %{correction: nil, errors: [error]}
  end

  defp loaded_claim(%SpecificationCorrection{claim: %Ecto.Association.NotLoaded{}} = correction) do
    Repo.preload(correction, claim: [:unit, :enum_option]).claim
  end

  defp loaded_claim(%SpecificationCorrection{claim: claim}), do: claim

  defp camelize(field), do: field |> Atom.to_string() |> Absinthe.Utils.camelize(lower: true)
end
