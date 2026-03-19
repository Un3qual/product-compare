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

  @spec encode(type(), String.t()) :: String.t()
  def encode(type, local_id) when is_binary(local_id) do
    type_name = Map.fetch!(@type_names, type)
    Base.encode64("#{type_name}:#{local_id}")
  end

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
end
