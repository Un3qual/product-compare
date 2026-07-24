defmodule ProductCompareWeb.Resolvers.DiscussionsResolver do
  @moduledoc false

  alias ProductCompareWeb.Resolvers.Discussions.Mutations
  alias ProductCompareWeb.Resolvers.Discussions.Reads

  def review_summary(parent, args, resolution), do: Reads.review_summary(parent, args, resolution)
  def reviews(parent, args, resolution), do: Reads.reviews(parent, args, resolution)
  def questions(parent, args, resolution), do: Reads.questions(parent, args, resolution)

  def viewer_community_submissions(parent, args, resolution),
    do: Reads.viewer_community_submissions(parent, args, resolution)

  def answers(parent, args, resolution), do: Reads.answers(parent, args, resolution)
  def question(parent, args, resolution), do: Reads.question(parent, args, resolution)

  def submit_review(parent, args, resolution),
    do: Mutations.submit_review(parent, args, resolution)

  def ask_question(parent, args, resolution), do: Mutations.ask_question(parent, args, resolution)

  def answer_question(parent, args, resolution),
    do: Mutations.answer_question(parent, args, resolution)

  def update_review(parent, args, resolution),
    do: Mutations.update_review(parent, args, resolution)

  def update_question(parent, args, resolution),
    do: Mutations.update_question(parent, args, resolution)

  def update_answer(parent, args, resolution),
    do: Mutations.update_answer(parent, args, resolution)

  def remove(parent, args, resolution), do: Mutations.remove(parent, args, resolution)

  def accept_answer(parent, args, resolution),
    do: Mutations.accept_answer(parent, args, resolution)

  def report(parent, args, resolution), do: Mutations.report(parent, args, resolution)
  def moderate(parent, args, resolution), do: Mutations.moderate(parent, args, resolution)

  def body(content, _args, _resolution), do: {:ok, content.body_md}
  def author_label(_content, _args, _resolution), do: {:ok, "Community member"}

  def viewer_can_edit(content, _args, resolution),
    do: {:ok, viewer_can_manage?(content, resolution)}

  def viewer_can_remove(content, _args, resolution),
    do: {:ok, viewer_can_manage?(content, resolution)}

  defp viewer_can_manage?(content, %{context: %{current_user: %{id: user_id}}}) do
    content.moderation_status != :removed and content_owner_id(content) == user_id
  end

  defp viewer_can_manage?(_content, _resolution), do: false

  defp content_owner_id(%{user_id: user_id}) when is_integer(user_id), do: user_id
  defp content_owner_id(%{created_by: user_id}) when is_integer(user_id), do: user_id
  defp content_owner_id(_content), do: nil
end
