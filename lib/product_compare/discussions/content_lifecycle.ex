defmodule ProductCompare.Discussions.ContentLifecycle do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost

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
    changeset = ThreadPost.changeset(%ThreadPost{}, attrs)

    if changeset.valid? do
      Repo.transaction(fn ->
        lock_post_thread(changeset)

        changeset
        |> validate_post_parent()
        |> Repo.insert()
        |> case do
          {:ok, post} -> post
          {:error, changeset} -> Repo.rollback(changeset)
        end
      end)
    else
      {:error, changeset}
    end
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
  def delete_post(%ThreadPost{} = post) do
    Repo.transaction(fn ->
      with %ThreadPost{} = persisted_post <- Repo.get(ThreadPost, post.id),
           %ProductThread{} <- lock_thread(persisted_post.thread_id),
           %ThreadPost{} = locked_post <- lock_post(post.id) do
        locked_post
        |> Repo.delete()
        |> case do
          {:ok, deleted_post} -> deleted_post
          {:error, changeset} -> Repo.rollback(changeset)
        end
      else
        nil -> Repo.rollback(missing_post_changeset(post))
      end
    end)
  end

  @spec create_review(map()) :: {:ok, ProductReview.t()} | {:error, Ecto.Changeset.t()}
  def create_review(attrs) do
    sanitized_attrs = drop_client_verified_purchase(attrs)

    %ProductReview{}
    |> ProductReview.changeset_with_verified_purchase(sanitized_attrs, false)
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

      persisted_review
      |> ProductReview.changeset_with_verified_purchase(sanitized_attrs, false)
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

  defp parent_update?(attrs) when is_map(attrs) do
    Map.has_key?(attrs, :parent_post_id) or Map.has_key?(attrs, "parent_post_id")
  end

  defp parent_update?(_attrs), do: false

  defp lock_post_thread(changeset) do
    thread_id = Ecto.Changeset.get_field(changeset, :thread_id)

    lock_thread(thread_id)
  end

  defp lock_thread(thread_id) do
    Repo.one(from thread in ProductThread, where: thread.id == ^thread_id, lock: "FOR UPDATE")
  end

  defp lock_post(post_id) do
    Repo.one(from post in ThreadPost, where: post.id == ^post_id, lock: "FOR UPDATE")
  end

  defp missing_post_changeset(post) do
    post
    |> Ecto.Changeset.change()
    |> Ecto.Changeset.add_error(:id, "does not exist")
  end

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
end
