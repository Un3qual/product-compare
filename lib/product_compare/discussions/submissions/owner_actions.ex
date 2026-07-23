defmodule ProductCompare.Discussions.Submissions.OwnerActions do
  @moduledoc false

  alias ProductCompare.Discussions.Moderation
  alias ProductCompare.Discussions.Submissions.WriteLimits
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost

  @spec update(pos_integer(), :review | :question | :answer, Ecto.UUID.t(), map()) ::
          {:ok, ProductReview.t() | ProductThread.t() | ThreadPost.t()}
          | {:error,
             :forbidden | :not_found | :invalid_lifecycle | :rate_limited | Ecto.Changeset.t()}
  def update(user_id, type, entropy_id, attrs) do
    Repo.transaction(fn -> update_transaction(user_id, type, entropy_id, attrs) end)
  end

  @spec remove(pos_integer(), :review | :question | :answer, Ecto.UUID.t()) ::
          {:ok, ProductReview.t() | ProductThread.t() | ThreadPost.t()}
          | {:error, :forbidden | :not_found | :invalid_lifecycle | Ecto.Changeset.t()}
  def remove(user_id, type, entropy_id) do
    Repo.transaction(fn -> remove_transaction(user_id, type, entropy_id) end)
  end

  defp update_transaction(user_id, :answer, entropy_id, attrs) do
    Moderation.with_locked_answer(entropy_id, fn answer, question ->
      ensure_owner_and_editable!(answer, user_id)

      changeset = owned_update_changeset(:answer, answer, attrs)
      ensure_valid!(changeset)
      WriteLimits.increment!(user_id, :answer)
      updated_answer = update_or_rollback(changeset)
      clear_accepted_answer!(question, answer)
      updated_answer
    end)
  end

  defp update_transaction(user_id, :review, entropy_id, attrs) do
    review = locked_content_or_rollback!(:review, entropy_id)
    ensure_owner_and_editable!(review, user_id)

    changeset = owned_update_changeset(:review, review, attrs)
    ensure_valid!(changeset)
    WriteLimits.increment!(user_id, :review)
    update_or_rollback(changeset)
  end

  defp update_transaction(user_id, :question, entropy_id, attrs) do
    question = locked_content_or_rollback!(:question, entropy_id)
    ensure_owner_and_editable!(question, user_id)

    changeset = owned_update_changeset(:question, question, attrs)
    ensure_valid!(changeset)
    WriteLimits.increment!(user_id, :question)

    changeset
    |> Ecto.Changeset.change(accepted_post_id: nil)
    |> update_or_rollback()
  end

  defp remove_transaction(user_id, :answer, entropy_id) do
    Moderation.with_locked_answer(entropy_id, fn answer, question ->
      ensure_owner_and_editable!(answer, user_id)

      removed_answer =
        answer
        |> Ecto.Changeset.change(moderation_status: :removed)
        |> update_or_rollback()

      clear_accepted_answer!(question, answer)
      removed_answer
    end)
  end

  defp remove_transaction(user_id, type, entropy_id) when type in [:review, :question] do
    record = locked_content_or_rollback!(type, entropy_id)
    ensure_owner_and_editable!(record, user_id)

    record
    |> Ecto.Changeset.change(moderation_status: :removed)
    |> update_or_rollback()
  end

  defp locked_content_or_rollback!(type, entropy_id) do
    schema = content_schema(type)

    case Moderation.locked_record_by_entropy(schema, entropy_id) do
      nil -> Repo.rollback(:not_found)
      record -> record
    end
  end

  defp content_schema(:review), do: ProductReview
  defp content_schema(:question), do: ProductThread

  defp ensure_owner_and_editable!(record, user_id) do
    cond do
      content_owner_id(record) != user_id -> Repo.rollback(:forbidden)
      record.moderation_status == :removed -> Repo.rollback(:invalid_lifecycle)
      true -> :ok
    end
  end

  defp content_owner_id(%ProductReview{user_id: user_id}), do: user_id
  defp content_owner_id(%ProductThread{created_by: user_id}), do: user_id
  defp content_owner_id(%ThreadPost{user_id: user_id}), do: user_id

  defp owned_update_changeset(:review, review, attrs) do
    review
    |> ProductReview.changeset_with_verified_purchase(
      owner_attrs(attrs,
        rating: :rating,
        title: :title,
        body: :body_md
      ),
      false
    )
    |> reset_moderation_changes()
  end

  defp owned_update_changeset(:question, question, attrs) do
    question
    |> ProductThread.changeset(owner_attrs(attrs, title: :title, body: :body_md))
    |> reset_moderation_changes()
  end

  defp owned_update_changeset(:answer, answer, attrs) do
    answer
    |> ThreadPost.changeset(owner_attrs(attrs, body: :body_md))
    |> reset_moderation_changes()
  end

  defp owner_attrs(attrs, mappings) do
    Enum.reduce(mappings, %{}, fn {source, target}, normalized ->
      cond do
        Map.has_key?(attrs, source) ->
          Map.put(normalized, target, Map.get(attrs, source))

        Map.has_key?(attrs, Atom.to_string(source)) ->
          Map.put(normalized, target, Map.get(attrs, Atom.to_string(source)))

        true ->
          normalized
      end
    end)
  end

  defp reset_moderation_changes(changeset) do
    Ecto.Changeset.change(changeset,
      moderation_status: :pending,
      moderation_note: nil,
      moderated_by: nil,
      moderated_at: nil
    )
  end

  defp ensure_valid!(%Ecto.Changeset{valid?: true}), do: :ok
  defp ensure_valid!(%Ecto.Changeset{} = changeset), do: Repo.rollback(changeset)

  defp clear_accepted_answer!(%ProductThread{accepted_post_id: answer_id} = question, %{
         id: answer_id
       })
       when not is_nil(answer_id) do
    question
    |> Ecto.Changeset.change(accepted_post_id: nil)
    |> update_or_rollback()
  end

  defp clear_accepted_answer!(_question, _answer), do: :ok

  defp update_or_rollback(changeset) do
    case Repo.update(changeset) do
      {:ok, record} -> record
      {:error, changeset} -> Repo.rollback(changeset)
    end
  end
end
