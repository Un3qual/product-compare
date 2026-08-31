defmodule ProductCompare.Catalog.SearchDocuments do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo

  @spec refresh_product(pos_integer()) :: :ok | {:error, term()}
  def refresh_product(product_id) do
    case refresh_many(
           where(search_document_query(), [product], field(product, :id) == ^product_id)
         ) do
      {:ok, 1} -> :ok
      {:ok, 0} -> {:error, :product_not_found}
      {:error, _reason} = error -> error
    end
  end

  @spec refresh_products([pos_integer()]) :: {:ok, non_neg_integer()} | {:error, term()}
  def refresh_products([]), do: {:ok, 0}

  def refresh_products(product_ids) do
    search_document_query()
    |> where([product], field(product, :id) in ^product_ids)
    |> refresh_many()
  end

  @spec refresh_brand(pos_integer()) :: {:ok, non_neg_integer()} | {:error, term()}
  def refresh_brand(brand_id) do
    search_document_query()
    |> where([product], field(product, :brand_id) == ^brand_id)
    |> refresh_many()
  end

  @spec rebuild() :: {:ok, non_neg_integer()} | {:error, term()}
  def rebuild do
    refresh_many(search_document_query(), timeout: rebuild_timeout())
  end

  defp refresh_many(query, opts \\ []) do
    {count, nil} = Repo.update_all(query, [], opts)
    {:ok, count}
  rescue
    error in [DBConnection.ConnectionError, Postgrex.Error] -> {:error, error}
  end

  defp rebuild_timeout do
    timeout =
      :product_compare
      |> Application.fetch_env!(__MODULE__)
      |> Keyword.fetch!(:rebuild_timeout)

    case timeout do
      :infinity ->
        :infinity

      timeout when is_integer(timeout) and timeout >= 0 ->
        timeout

      invalid ->
        raise ArgumentError,
              "rebuild_timeout must be :infinity or a non-negative integer, got: #{inspect(invalid)}"
    end
  end

  defp search_document_query do
    from product in "products",
      update: [
        set: [
          search_document:
            fragment(
              "catalog_search_document(?, ?, ?, ?, (SELECT name FROM brands WHERE id = ?))",
              field(product, :name),
              field(product, :slug),
              field(product, :model_number),
              field(product, :description),
              field(product, :brand_id)
            )
        ]
      ]
  end
end
