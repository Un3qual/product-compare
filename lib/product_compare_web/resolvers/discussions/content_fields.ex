defmodule ProductCompareWeb.Resolvers.Discussions.ContentFields do
  @moduledoc false

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
