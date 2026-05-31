defmodule ProductCompareWeb.Resolvers.AffiliateResolver do
  @moduledoc false

  alias ProductCompare.Affiliate
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.Input

  @spec upsert_affiliate_network(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
  def upsert_affiliate_network(_parent, %{input: input}, %{
        context: %{current_user: _current_user}
      }) do
    attrs = Input.take_present(input, [:name])

    case Affiliate.upsert_network(attrs) do
      {:ok, network} ->
        {:ok, %{network: network, errors: []}}

      {:error, changeset} ->
        {field, message} = GraphQLErrors.changeset_first_error(changeset)
        {:ok, mutation_error_payload(:network, "INVALID_ARGUMENT", message, field)}
    end
  end

  def upsert_affiliate_network(_parent, _args, _resolution),
    do: {:ok, mutation_error_payload(:network, GraphQLErrors.unauthenticated_mutation_error())}

  @spec upsert_affiliate_program(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
  def upsert_affiliate_program(_parent, %{input: input}, %{
        context: %{current_user: _current_user}
      }) do
    with {:ok, attrs} <-
           normalize_attrs(input, [:affiliate_network_id, :merchant_id], program_attrs()),
         {:ok, program} <- Affiliate.upsert_program(attrs) do
      {:ok, %{program: program, errors: []}}
    else
      {:error, %Ecto.Changeset{} = changeset} ->
        {field, message} = GraphQLErrors.changeset_first_error(changeset)
        {:ok, mutation_error_payload(:program, "INVALID_ARGUMENT", message, field)}

      {:error, {:invalid_id, field}} ->
        {:ok, mutation_error_payload(:program, "INVALID_ID", invalid_id_message(field), field)}

      {:error, reason} when is_binary(reason) ->
        {:ok, mutation_error_payload(:program, "INVALID_ARGUMENT", reason)}
    end
  end

  def upsert_affiliate_program(_parent, _args, _resolution),
    do: {:ok, mutation_error_payload(:program, GraphQLErrors.unauthenticated_mutation_error())}

  @spec upsert_affiliate_link(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
  def upsert_affiliate_link(_parent, %{input: input}, %{context: %{current_user: _current_user}}) do
    with {:ok, attrs} <-
           normalize_attrs(input, [:merchant_product_id, :affiliate_network_id], link_attrs()),
         {:ok, link} <- Affiliate.upsert_link(attrs) do
      {:ok, %{link: link, errors: []}}
    else
      {:error, %Ecto.Changeset{} = changeset} ->
        {field, message} = GraphQLErrors.changeset_first_error(changeset)
        {:ok, mutation_error_payload(:link, "INVALID_ARGUMENT", message, field)}

      {:error, {:invalid_id, field}} ->
        {:ok, mutation_error_payload(:link, "INVALID_ID", invalid_id_message(field), field)}

      {:error, reason} when is_binary(reason) ->
        {:ok, mutation_error_payload(:link, "INVALID_ARGUMENT", reason)}
    end
  end

  def upsert_affiliate_link(_parent, _args, _resolution),
    do: {:ok, mutation_error_payload(:link, GraphQLErrors.unauthenticated_mutation_error())}

  @spec create_coupon(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
  def create_coupon(_parent, %{input: input}, %{context: %{current_user: _current_user}}) do
    with {:ok, attrs} <-
           normalize_attrs(
             input,
             [:merchant_id, :affiliate_network_id, :artifact_id],
             coupon_attrs()
           ),
         {:ok, coupon} <- Affiliate.create_coupon(attrs) do
      {:ok, %{coupon: coupon, errors: []}}
    else
      {:error, %Ecto.Changeset{} = changeset} ->
        {field, message} = GraphQLErrors.changeset_first_error(changeset)
        {:ok, mutation_error_payload(:coupon, "INVALID_ARGUMENT", message, field)}

      {:error, {:invalid_id, field}} ->
        {:ok, mutation_error_payload(:coupon, "INVALID_ID", invalid_id_message(field), field)}

      {:error, reason} when is_binary(reason) ->
        {:ok, mutation_error_payload(:coupon, "INVALID_ARGUMENT", reason)}
    end
  end

  def create_coupon(_parent, _args, _resolution),
    do: {:ok, mutation_error_payload(:coupon, GraphQLErrors.unauthenticated_mutation_error())}

  @spec active_coupons(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t() | GraphQLErrors.top_level_error()}
  def active_coupons(_parent, %{input: input}, %{context: %{current_user: _current_user}}) do
    with {:ok, %{merchant_id: merchant_id} = attrs} <- normalize_ids(input, [:merchant_id]) do
      now =
        case Input.fetch_value(attrs, :at) do
          %DateTime{} = at -> at
          _ -> DateTime.utc_now()
        end

      connection_args = Input.connection_args(attrs)
      query = Affiliate.list_active_coupons_query(merchant_id, now)

      case Connection.from_query_result(query, connection_args, Repo) do
        {:ok, connection} ->
          {:ok, %{coupons: connection}}

        {:error, message} ->
          {:error, message}
      end
    else
      {:error, {:invalid_id, field}} ->
        {:error, invalid_id_message(field)}

      {:error, reason} when is_binary(reason) ->
        {:error, reason}

      _ ->
        {:error, "invalid input"}
    end
  end

  def active_coupons(_parent, _args, _resolution),
    do: {:error, GraphQLErrors.unauthenticated()}

  defp normalize_attrs(attrs, id_fields, attr_fields) do
    with {:ok, attrs} <- normalize_ids(attrs, id_fields) do
      {:ok, Input.take(attrs, attr_fields)}
    end
  end

  defp normalize_ids(attrs, id_fields) when is_map(attrs) do
    Enum.reduce_while(id_fields, {:ok, attrs}, fn field, {:ok, acc} ->
      case Input.decode_optional_integer_id_field(
             acc,
             field,
             field_type(field),
             id_field_name(field)
           ) do
        {:ok, attrs} ->
          {:cont, {:ok, attrs}}

        {:error, _message} ->
          {:halt, {:error, {:invalid_id, field}}}
      end
    end)
  end

  defp field_type(:affiliate_network_id), do: :affiliate_network
  defp field_type(:merchant_id), do: :merchant
  defp field_type(:merchant_product_id), do: :merchant_product
  defp field_type(:artifact_id), do: :source_artifact
  defp field_type(_field), do: nil

  defp program_attrs, do: [:affiliate_network_id, :merchant_id, :program_code, :status]

  defp link_attrs,
    do: [
      :merchant_product_id,
      :affiliate_network_id,
      :original_url,
      :affiliate_url,
      :last_verified_at
    ]

  defp coupon_attrs,
    do: [
      :merchant_id,
      :affiliate_network_id,
      :artifact_id,
      :code,
      :description,
      :discount_type,
      :discount_value,
      :currency,
      :valid_from,
      :valid_to,
      :terms
    ]

  defp id_field_name(field) do
    field
    |> Atom.to_string()
    |> String.replace_suffix("_id", "")
    |> String.replace("_", " ")
  end

  defp mutation_error_payload(entity_field, code, message, field \\ nil) do
    %{
      entity_field => nil,
      errors: [GraphQLErrors.camelized_mutation_error(code, message, field)]
    }
  end

  defp mutation_error_payload(entity_field, error) when is_map(error) do
    %{
      entity_field => nil,
      errors: [error]
    }
  end

  defp invalid_id_message(field) do
    "invalid #{id_field_name(field)} id"
  end
end
