defmodule ProductCompareWeb.Resolvers.NodeResolver do
  @moduledoc false

  alias ProductCompare.Accounts
  alias ProductCompare.Catalog
  alias ProductCompare.Pricing
  alias ProductCompareWeb.GraphQL.GlobalId

  @public_types [:product, :brand, :merchant, :merchant_product]
  @owner_scoped_types [:saved_comparison_set, :api_token]

  @spec node(any(), %{id: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, term() | nil} | {:error, String.t()}
  def node(_parent, %{id: id}, resolution) do
    with {:ok, {type, local_id}} <- decode_node_id(id),
         {:ok, record} <- fetch_node(type, local_id, resolution) do
      {:ok, record}
    else
      :not_found -> {:ok, nil}
      {:error, :invalid_id} -> {:error, "invalid node id"}
      {:error, :unsupported_type} -> {:error, "invalid node id"}
    end
  end

  defp decode_node_id(id) do
    case GlobalId.decode(id) do
      {:ok, {type, local_id}} when type in @public_types ->
        with {:ok, parsed_id} <- parse_public_local_id(local_id) do
          {:ok, {type, parsed_id}}
        end

      {:ok, {type, local_id}} when type in @owner_scoped_types ->
        {:ok, {type, local_id}}

      {:ok, {_type, _local_id}} ->
        {:error, :unsupported_type}

      :error ->
        {:error, :invalid_id}
    end
  end

  defp parse_public_local_id(local_id) when is_binary(local_id) do
    case Integer.parse(local_id) do
      {parsed_id, ""} when parsed_id > 0 -> {:ok, parsed_id}
      _ -> {:error, :invalid_id}
    end
  end

  defp fetch_node(type, local_id, _resolution) when type in @public_types do
    fetch_public_node(type, local_id)
  end

  defp fetch_node(type, local_id, resolution) when type in @owner_scoped_types do
    fetch_owner_scoped_node(type, local_id, resolution)
  end

  defp fetch_public_node(:product, id), do: fetch_record(Catalog.get_product(id))
  defp fetch_public_node(:brand, id), do: fetch_record(Catalog.get_brand(id))
  defp fetch_public_node(:merchant, id), do: fetch_record(Pricing.get_merchant(id))
  defp fetch_public_node(:merchant_product, id), do: fetch_record(Pricing.get_merchant_product(id))

  defp fetch_owner_scoped_node(
         :saved_comparison_set,
         entropy_id,
         %{context: %{current_user: user}}
       ) do
    {:ok, Catalog.get_saved_comparison_set_for_user(user, entropy_id)}
  end

  defp fetch_owner_scoped_node(:saved_comparison_set, _entropy_id, _resolution), do: {:ok, nil}

  defp fetch_owner_scoped_node(:api_token, token_entropy_id, %{context: %{current_user: user}}) do
    {:ok, Accounts.get_api_token_for_user(user, token_entropy_id)}
  end

  defp fetch_owner_scoped_node(:api_token, _token_entropy_id, _resolution), do: {:ok, nil}

  defp fetch_record(nil), do: :not_found
  defp fetch_record(record), do: {:ok, record}
end
