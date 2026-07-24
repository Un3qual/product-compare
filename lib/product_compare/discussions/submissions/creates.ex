defmodule ProductCompare.Discussions.Submissions.Creates do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Discussions.Moderation
  alias ProductCompare.Discussions.Submissions.WriteLimits
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Discussions.CommunityWriteReceipt
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost

  @spec submit_review(pos_integer(), pos_integer(), map(), String.t()) ::
          {:ok, ProductReview.t()} | {:error, Ecto.Changeset.t() | atom()}
  def submit_review(user_id, product_id, attrs, idempotency_key) do
    changeset =
      ProductReview.changeset_with_verified_purchase(
        %ProductReview{},
        %{
          user_id: user_id,
          product_id: product_id,
          merchant_product_id: get_attr_value(attrs, :merchant_product_id),
          rating: get_attr_value(attrs, :rating),
          title: get_attr_value(attrs, :title),
          body_md: get_attr_value(attrs, :body)
        },
        false
      )

    with {:ok, digest} <-
           submission_digest(changeset, :review, [
             :product_id,
             :merchant_product_id,
             :rating,
             :title,
             :body_md
           ]) do
      idempotent_insert(user_id, :review, idempotency_key, digest, changeset)
    end
  end

  @spec ask_question(pos_integer(), pos_integer(), map(), String.t()) ::
          {:ok, ProductThread.t()} | {:error, Ecto.Changeset.t() | atom()}
  def ask_question(user_id, product_id, attrs, idempotency_key) do
    changeset =
      ProductThread.changeset(%ProductThread{}, %{
        product_id: product_id,
        created_by: user_id,
        title: get_attr_value(attrs, :title),
        body_md: get_attr_value(attrs, :body),
        kind: :question
      })

    with {:ok, digest} <-
           submission_digest(changeset, :question, [:product_id, :title, :body_md]) do
      idempotent_insert(user_id, :question, idempotency_key, digest, changeset)
    end
  end

  @spec answer_question(pos_integer(), Ecto.UUID.t(), String.t(), String.t()) ::
          {:ok, ThreadPost.t()} | {:error, :not_found | Ecto.Changeset.t() | atom()}
  def answer_question(user_id, question_entropy_id, body, idempotency_key) do
    with %ProductThread{} = question <-
           Moderation.record_by_type_and_entropy(:question, question_entropy_id),
         changeset <-
           ThreadPost.changeset(%ThreadPost{}, %{
             thread_id: question.id,
             user_id: user_id,
             body_md: body
           }),
         {:ok, digest} <-
           submission_digest(changeset, :answer, [:thread_id, :body_md], question.entropy_id) do
      idempotent_insert(user_id, :answer, idempotency_key, digest, changeset, fn ->
        case Moderation.locked_record_by_entropy(ProductThread, question.entropy_id) do
          %ProductThread{kind: :question, moderation_status: :published} -> :ok
          _not_public -> Repo.rollback(:not_found)
        end
      end)
    else
      nil -> {:error, :not_found}
      error -> error
    end
  end

  defp submission_digest(changeset, mutation_kind, fields, target \\ nil) do
    if changeset.valid? do
      values = Enum.map(fields, &{&1, Ecto.Changeset.get_field(changeset, &1)})
      payload = {mutation_kind, target, values}
      {:ok, :crypto.hash(:sha256, :erlang.term_to_binary(payload, [:deterministic]))}
    else
      {:error, changeset}
    end
  end

  defp idempotent_insert(
         user_id,
         mutation_kind,
         idempotency_key,
         digest,
         changeset,
         before_insert \\ fn -> :ok end
       ) do
    with :ok <- validate_idempotency_key(user_id, mutation_kind, idempotency_key, digest) do
      Repo.transaction(fn ->
        lock_idempotency_key!(user_id, mutation_kind, idempotency_key)

        case locked_write_receipt(user_id, mutation_kind, idempotency_key) do
          %CommunityWriteReceipt{payload_digest: ^digest} = receipt ->
            case Moderation.record_by_type_and_entropy(
                   receipt.content_type,
                   receipt.content_entropy_id
                 ) do
              nil -> Repo.rollback(:not_found)
              content -> content
            end

          %CommunityWriteReceipt{} ->
            Repo.rollback(:idempotency_conflict)

          nil ->
            :ok = before_insert.()
            WriteLimits.increment!(user_id, mutation_kind)
            inserted_content = insert_or_rollback(changeset)
            content = Repo.get!(inserted_content.__struct__, inserted_content.id)

            %CommunityWriteReceipt{}
            |> CommunityWriteReceipt.changeset(%{
              user_id: user_id,
              mutation_kind: mutation_kind,
              idempotency_key: idempotency_key,
              payload_digest: digest,
              content_type: mutation_kind,
              content_entropy_id: content.entropy_id
            })
            |> insert_or_rollback()

            content
        end
      end)
    end
  end

  defp validate_idempotency_key(user_id, mutation_kind, idempotency_key, digest) do
    changeset =
      CommunityWriteReceipt.changeset(%CommunityWriteReceipt{}, %{
        user_id: user_id,
        mutation_kind: mutation_kind,
        idempotency_key: idempotency_key,
        payload_digest: digest,
        content_type: mutation_kind,
        content_entropy_id: Ecto.UUID.generate()
      })

    if changeset.valid?, do: :ok, else: {:error, changeset}
  end

  defp lock_idempotency_key!(user_id, mutation_kind, idempotency_key) do
    Repo.query!("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [
      "#{user_id}:#{mutation_kind}:#{idempotency_key}"
    ])
  end

  defp locked_write_receipt(user_id, mutation_kind, idempotency_key) do
    Repo.one(
      from receipt in CommunityWriteReceipt,
        where: receipt.user_id == ^user_id,
        where: receipt.mutation_kind == ^mutation_kind,
        where: receipt.idempotency_key == ^idempotency_key,
        lock: "FOR UPDATE"
    )
  end

  defp insert_or_rollback(changeset) do
    case Repo.insert(changeset) do
      {:ok, record} -> record
      {:error, %Ecto.Changeset{} = changeset} -> Repo.rollback(changeset)
    end
  end

  defp get_attr_value(attrs, key),
    do: Map.get(attrs, key, Map.get(attrs, Atom.to_string(key)))
end
