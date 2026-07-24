defmodule ProductCompare.Discussions.Submissions do
  @moduledoc false

  alias ProductCompare.Discussions.Submissions.Creates
  alias ProductCompare.Discussions.Submissions.OwnerActions
  alias ProductCompare.Discussions.Submissions.Reports
  alias ProductCompareSchemas.Discussions.CommunityReport
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost

  @spec submit_review(pos_integer(), pos_integer(), map(), String.t()) ::
          {:ok, ProductReview.t()} | {:error, Ecto.Changeset.t() | atom()}
  def submit_review(user_id, product_id, attrs, idempotency_key),
    do: Creates.submit_review(user_id, product_id, attrs, idempotency_key)

  @spec ask_question(pos_integer(), pos_integer(), map(), String.t()) ::
          {:ok, ProductThread.t()} | {:error, Ecto.Changeset.t() | atom()}
  def ask_question(user_id, product_id, attrs, idempotency_key),
    do: Creates.ask_question(user_id, product_id, attrs, idempotency_key)

  @spec answer_question(pos_integer(), Ecto.UUID.t(), String.t(), String.t()) ::
          {:ok, ThreadPost.t()} | {:error, :not_found | Ecto.Changeset.t() | atom()}
  def answer_question(user_id, question_entropy_id, body, idempotency_key),
    do: Creates.answer_question(user_id, question_entropy_id, body, idempotency_key)

  @spec update_owned(pos_integer(), :review | :question | :answer, Ecto.UUID.t(), map()) ::
          {:ok, ProductReview.t() | ProductThread.t() | ThreadPost.t()}
          | {:error,
             :forbidden | :not_found | :invalid_lifecycle | :rate_limited | Ecto.Changeset.t()}
  def update_owned(user_id, type, entropy_id, attrs) do
    OwnerActions.update(user_id, type, entropy_id, attrs)
  end

  @spec remove_owned(pos_integer(), :review | :question | :answer, Ecto.UUID.t()) ::
          {:ok, ProductReview.t() | ProductThread.t() | ThreadPost.t()}
          | {:error, :forbidden | :not_found | :invalid_lifecycle | Ecto.Changeset.t()}
  def remove_owned(user_id, type, entropy_id) do
    OwnerActions.remove(user_id, type, entropy_id)
  end

  @spec report(pos_integer(), :review | :question | :answer, Ecto.UUID.t(), String.t()) ::
          {:ok, CommunityReport.t()}
          | {:error, :not_found | :already_reported | :rate_limited | Ecto.Changeset.t()}
  def report(reporter_id, type, entropy_id, reason),
    do: Reports.create(reporter_id, type, entropy_id, reason)
end
