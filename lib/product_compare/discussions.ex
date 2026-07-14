defmodule ProductCompare.Discussions do
  @moduledoc """
  Discussions context for threads, posts, and product reviews.
  """

  import Ecto.Query

  alias ProductCompare.Input
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
    |> validate_post_parent()
    |> Repo.insert()
  end

  @spec update_post(ThreadPost.t(), map()) :: {:ok, ThreadPost.t()} | {:error, Ecto.Changeset.t()}
  def update_post(%ThreadPost{} = post, attrs) do
    if parent_update?(attrs) do
      update_post_parent(post, attrs)
    else
      post
      |> ThreadPost.changeset(attrs)
      |> Repo.update()
    end
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

    Repo.transaction(fn ->
      persisted_review =
        Repo.one!(
          from persisted_review in ProductReview,
            where: persisted_review.id == ^review.id,
            lock: "FOR UPDATE"
        )

      verified_purchase = derive_verified_purchase(%{}, persisted_review)

      persisted_review
      |> ProductReview.changeset_with_verified_purchase(sanitized_attrs, verified_purchase)
      |> Repo.update()
      |> case do
        {:ok, updated_review} -> updated_review
        {:error, changeset} -> Repo.rollback(changeset)
      end
    end)
  end

  @spec delete_review(ProductReview.t()) ::
          {:ok, ProductReview.t()} | {:error, Ecto.Changeset.t()}
  def delete_review(%ProductReview{} = review), do: Repo.delete(review)

  defp normalize_pagination(opts) do
    limit =
      opts
      |> Input.pagination_value(:limit, @default_page_limit)
      |> Input.clamp_limit(@default_page_limit, @max_page_limit)

    offset =
      opts
      |> Input.pagination_value(:offset, 0)
      |> Input.clamp_non_negative(0)

    {limit, offset}
  end

  defp parent_update?(attrs) when is_map(attrs) do
    Map.has_key?(attrs, :parent_post_id) or Map.has_key?(attrs, "parent_post_id")
  end

  defp parent_update?(_attrs), do: false

  defp update_post_parent(%ThreadPost{} = post, attrs) do
    Repo.transaction(fn ->
      current_post = Repo.get!(ThreadPost, post.id)

      Repo.one!(
        from thread in ProductThread,
          where: thread.id == ^current_post.thread_id,
          lock: "FOR UPDATE"
      )

      ThreadPost
      |> Repo.get!(post.id)
      |> ThreadPost.changeset(attrs)
      |> validate_post_parent()
      |> Repo.update()
      |> case do
        {:ok, updated_post} -> updated_post
        {:error, changeset} -> Repo.rollback(changeset)
      end
    end)
  end

  defp validate_post_parent(%Ecto.Changeset{valid?: false} = changeset), do: changeset

  defp validate_post_parent(changeset) do
    parent_post_id = Ecto.Changeset.get_field(changeset, :parent_post_id)
    thread_id = Ecto.Changeset.get_field(changeset, :thread_id)
    post_id = changeset.data.id

    case fetch_parent_post(parent_post_id) do
      :no_parent ->
        changeset

      :not_found ->
        Ecto.Changeset.add_error(changeset, :parent_post_id, "does not exist")

      %ThreadPost{thread_id: parent_thread_id} when parent_thread_id != thread_id ->
        Ecto.Changeset.add_error(
          changeset,
          :parent_post_id,
          "must belong to the same thread"
        )

      %ThreadPost{} ->
        if parent_chain_contains_id?(parent_post_id, post_id) do
          Ecto.Changeset.add_error(changeset, :parent_post_id, "cannot create a cycle")
        else
          changeset
        end
    end
  end

  defp fetch_parent_post(nil), do: :no_parent

  defp fetch_parent_post(parent_post_id) do
    case Repo.get(ThreadPost, parent_post_id) do
      nil -> :not_found
      %ThreadPost{} = parent_post -> parent_post
    end
  end

  defp parent_chain_contains_id?(_parent_id, nil), do: false
  defp parent_chain_contains_id?(nil, _target_id), do: false

  defp parent_chain_contains_id?(parent_id, target_id) do
    parent_chain_contains_id?(parent_id, target_id, [])
  end

  defp parent_chain_contains_id?(nil, _target_id, _visited), do: false

  defp parent_chain_contains_id?(parent_id, target_id, visited) do
    cond do
      parent_id == target_id ->
        true

      parent_id in visited ->
        false

      true ->
        case Repo.get(ThreadPost, parent_id) do
          nil ->
            false

          %ThreadPost{parent_post_id: next_parent_id} ->
            parent_chain_contains_id?(next_parent_id, target_id, [parent_id | visited])
        end
    end
  end

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

    with {:ok, parsed_merchant_product_id} <- Input.normalize_integer_id(merchant_product_id),
         {:ok, parsed_product_id} <- Input.normalize_integer_id(product_id),
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
end
