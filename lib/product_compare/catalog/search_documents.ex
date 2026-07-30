defmodule ProductCompare.Catalog.SearchDocuments do
  @moduledoc false

  alias ProductCompare.Repo

  @set_search_document """
  search_document = catalog_search_document(
    product.name,
    product.slug,
    product.model_number,
    product.description,
    (
      SELECT brand.name
      FROM brands AS brand
      WHERE brand.id = product.brand_id
    )
  )
  """

  @spec refresh_product(pos_integer()) :: :ok | {:error, term()}
  def refresh_product(product_id) do
    case Repo.query(refresh_sql("WHERE product.id = $1"), [product_id]) do
      {:ok, %Postgrex.Result{num_rows: 1}} -> :ok
      {:ok, %Postgrex.Result{num_rows: 0}} -> {:error, :product_not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  @spec refresh_products([pos_integer()]) :: {:ok, non_neg_integer()} | {:error, term()}
  def refresh_products([]), do: {:ok, 0}

  def refresh_products(product_ids) do
    refresh_many(refresh_sql("WHERE product.id = ANY($1::bigint[])"), [product_ids])
  end

  @spec refresh_brand(pos_integer()) :: {:ok, non_neg_integer()} | {:error, term()}
  def refresh_brand(brand_id) do
    refresh_many(refresh_sql("WHERE product.brand_id = $1"), [brand_id])
  end

  @spec rebuild() :: {:ok, non_neg_integer()} | {:error, term()}
  def rebuild do
    refresh_many(refresh_sql(), [], timeout: rebuild_timeout())
  end

  defp refresh_many(sql, params, opts \\ []) do
    case Repo.query(sql, params, opts) do
      {:ok, %Postgrex.Result{num_rows: count}} -> {:ok, count}
      {:error, reason} -> {:error, reason}
    end
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

  defp refresh_sql(where_clause \\ "") do
    "UPDATE products AS product SET #{@set_search_document} #{where_clause}"
  end
end
