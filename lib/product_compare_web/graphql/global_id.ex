defmodule ProductCompareWeb.GraphQL.GlobalId do
  @moduledoc false

  @type type ::
          :user
          | :api_token
          | :saved_comparison_set
          | :affiliate_network
          | :affiliate_program
          | :affiliate_link
          | :coupon
          | :merchant_feed_candidate
          | :merchant
          | :merchant_product
          | :price_point
          | :source_artifact
          | :product
          | :brand
          | :attribute
          | :enum_option
          | :taxon

  @type_names %{
    user: "User",
    api_token: "ApiToken",
    saved_comparison_set: "SavedComparisonSet",
    affiliate_network: "AffiliateNetwork",
    affiliate_program: "AffiliateProgram",
    affiliate_link: "AffiliateLink",
    coupon: "Coupon",
    merchant_feed_candidate: "MerchantFeedCandidate",
    merchant: "Merchant",
    merchant_product: "MerchantProduct",
    price_point: "PricePoint",
    source_artifact: "SourceArtifact",
    product: "Product",
    brand: "Brand",
    attribute: "Attribute",
    enum_option: "EnumOption",
    taxon: "Taxon"
  }
  @type_atoms Map.new(@type_names, fn {type_atom, type_name} -> {type_name, type_atom} end)
  @max_bigint_id 9_223_372_036_854_775_807

  @spec encode(type(), String.t() | integer()) :: String.t()
  def encode(type, local_id) when is_integer(local_id) do
    encode(type, Integer.to_string(local_id))
  end

  def encode(type, local_id) when is_binary(local_id) do
    type_name = Map.fetch!(@type_names, type)
    Base.encode64("#{type_name}:#{local_id}")
  end

  @spec encode_required(type(), String.t() | integer()) ::
          {:ok, String.t()} | {:error, String.t()}
  def encode_required(type, local_id) when is_integer(local_id) or is_binary(local_id) do
    {:ok, encode(type, local_id)}
  end

  def encode_required(_type, _local_id), do: {:error, "invalid id"}

  @spec encode_optional(type(), String.t() | integer() | nil) ::
          {:ok, String.t() | nil} | {:error, String.t()}
  def encode_optional(_type, nil), do: {:ok, nil}
  def encode_optional(type, local_id), do: encode_required(type, local_id)

  @spec encode_optional_value(type(), String.t() | integer() | nil) :: String.t() | nil
  def encode_optional_value(_type, nil), do: nil
  def encode_optional_value(type, local_id), do: encode(type, local_id)

  @spec decode(String.t()) :: {:ok, {type(), String.t()}} | :error
  def decode(global_id) when is_binary(global_id) do
    with {:ok, decoded_id} <- Base.decode64(global_id),
         [type_name, local_id] <- String.split(decoded_id, ":", parts: 2),
         true <- local_id != "",
         {:ok, type_atom} <- Map.fetch(@type_atoms, type_name) do
      {:ok, {type_atom, local_id}}
    else
      _ -> :error
    end
  end

  def decode(_global_id), do: :error

  @spec decode_integer(String.t(), type()) :: {:ok, pos_integer()} | :error
  def decode_integer(global_id, expected_type) when is_binary(global_id) do
    with {:ok, {^expected_type, local_id}} <- decode(global_id),
         {parsed_id, ""} <- Integer.parse(local_id),
         true <- parsed_id > 0 and parsed_id <= @max_bigint_id do
      {:ok, parsed_id}
    else
      _ -> :error
    end
  end

  def decode_integer(_global_id, _expected_type), do: :error

  @spec decode_uuid(String.t(), type()) :: {:ok, Ecto.UUID.t()} | :error
  def decode_uuid(global_id, expected_type) when is_binary(global_id) do
    with {:ok, {^expected_type, local_id}} <- decode(global_id),
         {:ok, parsed_id} <- Ecto.UUID.cast(local_id) do
      {:ok, parsed_id}
    else
      _ -> :error
    end
  end

  def decode_uuid(_global_id, _expected_type), do: :error

  @spec decode_typed_local_id(String.t(), [type()], [type()]) ::
          {:ok, {type(), pos_integer() | Ecto.UUID.t()}}
          | {:error, :invalid_id | :unsupported_type}
  def decode_typed_local_id(global_id, integer_types, uuid_types)
      when is_list(integer_types) and is_list(uuid_types) do
    case decode(global_id) do
      {:ok, {type, _local_id}} ->
        cond do
          type in integer_types -> decode_typed_integer_id(global_id, type)
          type in uuid_types -> decode_typed_uuid_id(global_id, type)
          true -> {:error, :unsupported_type}
        end

      :error ->
        {:error, :invalid_id}
    end
  end

  defp decode_typed_integer_id(global_id, type) do
    case decode_integer(global_id, type) do
      {:ok, parsed_id} -> {:ok, {type, parsed_id}}
      :error -> {:error, :invalid_id}
    end
  end

  defp decode_typed_uuid_id(global_id, type) do
    case decode_uuid(global_id, type) do
      {:ok, parsed_id} -> {:ok, {type, parsed_id}}
      :error -> {:error, :invalid_id}
    end
  end
end
