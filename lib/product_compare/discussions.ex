defmodule ProductCompare.Discussions do
  @moduledoc """
  Discussions context for threads, posts, and product reviews.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost
  alias ProductCompareSchemas.Pricing.MerchantProduct

  @default_page_limit 50
  @max_page_limit 200

  @spec list_threads_for_product(pos_integer(), keyword() | map()) :: [ProductThread.t()]
  def list_threads_for_product(product_id, opts \\ []) do
    {limit, offset} = normalize_pagination(opts)

    Repo.all(
      from t in ProductThread,
        where: t.product_id == ^product_id,
        order_by: [desc: t.inserted_at, desc: t.id],
        limit: ^limit,
        offset: ^offset
    )
  end

  @spec list_posts_for_thread(pos_integer(), keyword() | map()) :: [ThreadPost.t()]
  def list_posts_for_thread(thread_id, opts \\ []) do
    {limit, offset} = normalize_pagination(opts)

    Repo.all(
      from p in ThreadPost,
        where: p.thread_id == ^thread_id,
        order_by: [asc: p.inserted_at, asc: p.id],
        limit: ^limit,
        offset: ^offset
    )
  end

  @spec create_thread(map()) :: {:ok, ProductThread.t()} | {:error, Ecto.Changeset.t()}
  def create_thread(attrs) do
    %ProductThread{}
    |> ProductThread.changeset(attrs)
    |> Repo.insert()
  end

  @spec update_thread(ProductThread.t(), map()) ::
          {:ok, ProductThread.t()} | {:error, Ecto.Changeset.t()}
  def update_thread(%ProductThread{} = thread, attrs) do
    thread
    |> ProductThread.changeset(attrs)
    |> Repo.update()
  end

  @spec delete_thread(ProductThread.t()) ::
          {:ok, ProductThread.t()} | {:error, Ecto.Changeset.t()}
  def delete_thread(%ProductThread{} = thread), do: Repo.delete(thread)

  @spec create_post(map()) :: {:ok, ThreadPost.t()} | {:error, Ecto.Changeset.t()}
  def create_post(attrs) do
    %ThreadPost{}
    |> ThreadPost.changeset(attrs)
    |> Repo.insert()
  end

  @spec update_post(ThreadPost.t(), map()) :: {:ok, ThreadPost.t()} | {:error, Ecto.Changeset.t()}
  def update_post(%ThreadPost{} = post, attrs) do
    post
    |> ThreadPost.changeset(attrs)
    |> Repo.update()
  end

  @spec delete_post(ThreadPost.t()) :: {:ok, ThreadPost.t()} | {:error, Ecto.Changeset.t()}
  def delete_post(%ThreadPost{} = post), do: Repo.delete(post)

  @spec list_reviews_for_product(pos_integer(), keyword() | map()) :: [ProductReview.t()]
  def list_reviews_for_product(product_id, opts \\ []) do
    {limit, offset} = normalize_pagination(opts)

    Repo.all(
      from r in ProductReview,
        where: r.product_id == ^product_id,
        order_by: [desc: r.inserted_at, desc: r.id],
        limit: ^limit,
        offset: ^offset
    )
  end

  @spec create_review(map()) :: {:ok, ProductReview.t()} | {:error, Ecto.Changeset.t()}
  def create_review(attrs) do
    sanitized_attrs = drop_client_verified_purchase(attrs)
    verified_purchase = derive_verified_purchase(sanitized_attrs)

    %ProductReview{}
    |> ProductReview.changeset_with_verified_purchase(sanitized_attrs, verified_purchase)
    |> Repo.insert()
  end

  @spec update_review(ProductReview.t(), map()) ::
          {:ok, ProductReview.t()} | {:error, Ecto.Changeset.t()}
  def update_review(%ProductReview{} = review, attrs) do
    sanitized_attrs = drop_client_verified_purchase(attrs)
    verified_purchase = derive_verified_purchase(sanitized_attrs, review)

    review
    |> ProductReview.changeset_with_verified_purchase(sanitized_attrs, verified_purchase)
    |> Repo.update()
  end

  @spec delete_review(ProductReview.t()) ::
          {:ok, ProductReview.t()} | {:error, Ecto.Changeset.t()}
  def delete_review(%ProductReview{} = review), do: Repo.delete(review)

  defp normalize_pagination(opts) do
    limit =
      opts
      |> get_pagination_value(:limit, @default_page_limit)
      |> clamp_limit(@default_page_limit, @max_page_limit)

    offset =
      opts
      |> get_pagination_value(:offset, 0)
      |> clamp_non_negative(0)

    {limit, offset}
  end

  defp get_pagination_value(opts, key, default) when is_list(opts) do
    opts
    |> Keyword.get(key, default)
    |> parse_pagination_value(default)
  end

  defp get_pagination_value(opts, key, default) when is_map(opts) do
    opts
    |> Map.get(key, Map.get(opts, Atom.to_string(key), default))
    |> parse_pagination_value(default)
  end

  defp get_pagination_value(_opts, _key, default), do: default

  defp parse_pagination_value(value, _default) when is_integer(value), do: value

  defp parse_pagination_value(value, default) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} -> parsed
      _ -> default
    end
  end

  defp parse_pagination_value(_value, default), do: default

  defp drop_client_verified_purchase(attrs) when is_map(attrs) do
    attrs
    |> Map.delete(:verified_purchase)
    |> Map.delete("verified_purchase")
  end

  defp drop_client_verified_purchase(attrs), do: attrs

  defp derive_verified_purchase(attrs, review \\ nil) do
    merchant_product_id =
      get_attr_value(attrs, :merchant_product_id) ||
        if(review, do: review.merchant_product_id, else: nil)

    product_id =
      get_attr_value(attrs, :product_id) ||
        if(review, do: review.product_id, else: nil)

    with {:ok, parsed_merchant_product_id} <- normalize_integer_id(merchant_product_id),
         {:ok, parsed_product_id} <- normalize_integer_id(product_id),
         true <- merchant_product_matches_product?(parsed_merchant_product_id, parsed_product_id) do
      true
    else
      _ -> false
    end
  end

  defp merchant_product_matches_product?(merchant_product_id, product_id) do
    Repo.exists?(
      from mp in MerchantProduct,
        where: mp.id == ^merchant_product_id and mp.product_id == ^product_id
    )
  end

  defp get_attr_value(attrs, key) when is_map(attrs),
    do: Map.get(attrs, key, Map.get(attrs, Atom.to_string(key)))

  defp get_attr_value(_attrs, _key), do: nil

  defp normalize_integer_id(value) when is_integer(value), do: {:ok, value}

  defp normalize_integer_id(value) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} -> {:ok, parsed}
      _ -> :error
    end
  end

  defp normalize_integer_id(_value), do: :error

  defp clamp_limit(value, _default, max) when is_integer(value) and value > 0, do: min(value, max)
  defp clamp_limit(_value, default, _max), do: default

  defp clamp_non_negative(value, _default) when is_integer(value) and value >= 0, do: value
  defp clamp_non_negative(_value, default), do: default
end
