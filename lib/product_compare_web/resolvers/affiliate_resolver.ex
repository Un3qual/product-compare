defmodule ProductCompareWeb.Resolvers.AffiliateResolver do
  @moduledoc false

  alias ProductCompare.Affiliate
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.GlobalId

  @spec upsert_affiliate_network(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def upsert_affiliate_network(_parent, %{input: input}, %{
        context: %{current_user: _current_user}
      }) do
    attrs = Map.take(input, [:name, :homepage_url])

    case Affiliate.upsert_network(attrs) do
      {:ok, network} ->
        {:ok, %{network: network}}

      {:error, changeset} ->
        {:error, first_changeset_error(changeset)}
    end
  end

  def upsert_affiliate_network(_parent, _args, _resolution), do: {:error, "unauthorized"}

  @spec upsert_affiliate_program(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def upsert_affiliate_program(_parent, %{input: input}, %{
        context: %{current_user: _current_user}
      }) do
    with {:ok, attrs} <- normalize_ids(input, [:affiliate_network_id, :merchant_id]),
         {:ok, program} <- Affiliate.upsert_program(attrs) do
      {:ok, %{program: program}}
    else
      {:error, %Ecto.Changeset{} = changeset} ->
        {:error, first_changeset_error(changeset)}

      {:error, reason} when is_binary(reason) ->
        {:error, reason}
    end
  end

  def upsert_affiliate_program(_parent, _args, _resolution), do: {:error, "unauthorized"}

  @spec upsert_affiliate_link(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def upsert_affiliate_link(_parent, %{input: input}, %{context: %{current_user: _current_user}}) do
    with {:ok, attrs} <- normalize_ids(input, [:merchant_product_id, :affiliate_network_id]),
         {:ok, link} <- Affiliate.upsert_link(attrs) do
      {:ok, %{link: link}}
    else
      {:error, %Ecto.Changeset{} = changeset} ->
        {:error, first_changeset_error(changeset)}

      {:error, reason} when is_binary(reason) ->
        {:error, reason}
    end
  end

  def upsert_affiliate_link(_parent, _args, _resolution), do: {:error, "unauthorized"}

  @spec create_coupon(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def create_coupon(_parent, %{input: input}, %{context: %{current_user: _current_user}}) do
    with {:ok, attrs} <- normalize_ids(input, [:merchant_id, :affiliate_network_id, :artifact_id]),
         {:ok, coupon} <- Affiliate.create_coupon(attrs) do
      {:ok, %{coupon: coupon}}
    else
      {:error, %Ecto.Changeset{} = changeset} ->
        {:error, first_changeset_error(changeset)}

      {:error, reason} when is_binary(reason) ->
        {:error, reason}
    end
  end

  def create_coupon(_parent, _args, _resolution), do: {:error, "unauthorized"}

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
      coupons = Affiliate.list_active_coupons(merchant_id, now)

      {:ok, %{coupons: Connection.from_list(coupons, connection_args)}}
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
              {:halt, {:error, "invalid #{field}"}}
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

  defp first_changeset_error(changeset) do
    {_field, {message, _opts}} = List.first(changeset.errors)
    message
  end
end
