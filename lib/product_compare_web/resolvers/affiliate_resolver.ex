defmodule ProductCompareWeb.Resolvers.AffiliateResolver do
  @moduledoc false

  alias ProductCompare.Affiliate
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.GlobalId

  @spec upsert_affiliate_network(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
  def upsert_affiliate_network(_parent, %{input: input}, %{
        context: %{current_user: _current_user}
      }) do
    attrs = Map.take(input, [:name, :homepage_url])

    case Affiliate.upsert_network(attrs) do
      {:ok, network} ->
        {:ok, %{network: network, errors: []}}

      {:error, changeset} ->
        {field, message} = first_changeset_error(changeset)
        {:ok, mutation_error_payload(:network, "INVALID_ARGUMENT", message, field)}
    end
  end

  def upsert_affiliate_network(_parent, _args, _resolution),
    do: {:ok, mutation_error_payload(:network, "UNAUTHORIZED", "unauthorized")}

  @spec upsert_affiliate_program(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
  def upsert_affiliate_program(_parent, %{input: input}, %{
        context: %{current_user: _current_user}
      }) do
    with {:ok, attrs} <- normalize_ids(input, [:affiliate_network_id, :merchant_id]),
         {:ok, program} <- Affiliate.upsert_program(attrs) do
      {:ok, %{program: program, errors: []}}
    else
      {:error, %Ecto.Changeset{} = changeset} ->
        {field, message} = first_changeset_error(changeset)
        {:ok, mutation_error_payload(:program, "INVALID_ARGUMENT", message, field)}

      {:error, {:invalid_id, field}} ->
        {:ok, mutation_error_payload(:program, "INVALID_ID", invalid_id_message(field), field)}

      {:error, reason} when is_binary(reason) ->
        {:ok, mutation_error_payload(:program, "INVALID_ARGUMENT", reason)}
    end
  end

  def upsert_affiliate_program(_parent, _args, _resolution),
    do: {:ok, mutation_error_payload(:program, "UNAUTHORIZED", "unauthorized")}

  @spec upsert_affiliate_link(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
  def upsert_affiliate_link(_parent, %{input: input}, %{context: %{current_user: _current_user}}) do
    with {:ok, attrs} <- normalize_ids(input, [:merchant_product_id, :affiliate_network_id]),
         {:ok, link} <- Affiliate.upsert_link(attrs) do
      {:ok, %{link: link, errors: []}}
    else
      {:error, %Ecto.Changeset{} = changeset} ->
        {field, message} = first_changeset_error(changeset)
        {:ok, mutation_error_payload(:link, "INVALID_ARGUMENT", message, field)}

      {:error, {:invalid_id, field}} ->
        {:ok, mutation_error_payload(:link, "INVALID_ID", invalid_id_message(field), field)}

      {:error, reason} when is_binary(reason) ->
        {:ok, mutation_error_payload(:link, "INVALID_ARGUMENT", reason)}
    end
  end

  def upsert_affiliate_link(_parent, _args, _resolution),
    do: {:ok, mutation_error_payload(:link, "UNAUTHORIZED", "unauthorized")}

  @spec create_coupon(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
  def create_coupon(_parent, %{input: input}, %{context: %{current_user: _current_user}}) do
    with {:ok, attrs} <- normalize_ids(input, [:merchant_id, :affiliate_network_id, :artifact_id]),
         {:ok, coupon} <- Affiliate.create_coupon(attrs) do
      {:ok, %{coupon: coupon, errors: []}}
    else
      {:error, %Ecto.Changeset{} = changeset} ->
        {field, message} = first_changeset_error(changeset)
        {:ok, mutation_error_payload(:coupon, "INVALID_ARGUMENT", message, field)}

      {:error, {:invalid_id, field}} ->
        {:ok, mutation_error_payload(:coupon, "INVALID_ID", invalid_id_message(field), field)}

      {:error, reason} when is_binary(reason) ->
        {:ok, mutation_error_payload(:coupon, "INVALID_ARGUMENT", reason)}
    end
  end

  def create_coupon(_parent, _args, _resolution),
    do: {:ok, mutation_error_payload(:coupon, "UNAUTHORIZED", "unauthorized")}

  @spec active_coupons(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def active_coupons(_parent, %{input: input}, %{context: %{current_user: _current_user}}) do
    with {:ok, %{merchant_id: merchant_id} = attrs} <- normalize_ids(input, [:merchant_id]) do
      now =
        case Map.get(attrs, :at) do
          %DateTime{} = at -> at
          _ -> DateTime.utc_now()
        end

      connection_args = Map.take(attrs, [:first, :after])
      query = Affiliate.list_active_coupons_query(merchant_id, now)

      case Connection.from_query(query, connection_args, Repo) do
        {:ok, connection} ->
          {:ok, %{coupons: connection}}

        {:error, :invalid_cursor} ->
          {:error, "invalid cursor"}
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

  def active_coupons(_parent, _args, _resolution), do: {:error, "unauthorized"}

  defp normalize_ids(attrs, id_fields) when is_map(attrs) do
    Enum.reduce_while(id_fields, {:ok, attrs}, fn field, {:ok, acc} ->
      case Map.fetch(acc, field) do
        {:ok, value} ->
          case cast_global_id(value, field) do
            {:ok, cast_value} ->
              {:cont, {:ok, Map.put(acc, field, cast_value)}}

            :error ->
              {:halt, {:error, {:invalid_id, field}}}
          end

        :error ->
          {:cont, {:ok, acc}}
      end
    end)
  end

  defp cast_global_id(nil, _field), do: {:ok, nil}

  defp cast_global_id(value, field) when is_binary(value) do
    expected_type = field_type(field)

    with {:ok, {^expected_type, local_id}} <- GlobalId.decode(value),
         {parsed_value, ""} <- Integer.parse(local_id),
         true <- parsed_value > 0 do
      {:ok, parsed_value}
    else
      _ -> :error
    end
  end

  defp cast_global_id(_value, _field), do: :error

  defp field_type(:affiliate_network_id), do: :affiliate_network
  defp field_type(:merchant_id), do: :merchant
  defp field_type(:merchant_product_id), do: :merchant_product
  defp field_type(:artifact_id), do: :source_artifact
  defp field_type(_field), do: nil

  defp first_changeset_error(%Ecto.Changeset{errors: [{field, {message, _opts}} | _]}) do
    {field, message}
  end

  defp first_changeset_error(_changeset), do: {nil, "invalid payload"}

  defp mutation_error_payload(entity_field, code, message, field \\ nil) do
    %{
      entity_field => nil,
      errors: [mutation_error(code, message, graphql_field_name(field))]
    }
  end

  defp mutation_error(code, message, field) do
    %{code: code, message: message, field: field}
  end

  defp invalid_id_message(field) do
    field
    |> Atom.to_string()
    |> String.replace("_", " ")
    |> then(&"invalid #{&1}")
  end

  defp graphql_field_name(nil), do: nil
  defp graphql_field_name(:affiliate_network_id), do: "affiliateNetworkId"
  defp graphql_field_name(:merchant_id), do: "merchantId"
  defp graphql_field_name(:merchant_product_id), do: "merchantProductId"
  defp graphql_field_name(:artifact_id), do: "artifactId"

  defp graphql_field_name(field) when is_atom(field),
    do: field |> Atom.to_string() |> snake_to_camel()

  defp graphql_field_name(field) when is_binary(field), do: snake_to_camel(field)

  defp snake_to_camel(value) do
    case String.split(value, "_") do
      [single] ->
        single

      [first | rest] ->
        first <> Enum.map_join(rest, "", &String.capitalize/1)
    end
  end
end
