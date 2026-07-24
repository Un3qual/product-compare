defmodule ProductCompareSchemas.Discussions.ModerationChangeset do
  @moduledoc false

  alias Ecto.Changeset

  @allowed_statuses [:published, :hidden, :rejected]

  @spec change(struct(), atom(), integer(), String.t() | nil, DateTime.t()) ::
          Changeset.t()
  def change(record, status, moderator_id, note, now) do
    record
    |> Changeset.change(
      moderation_status: status,
      moderation_note: note,
      moderated_by: moderator_id,
      moderated_at: now
    )
    |> Changeset.validate_inclusion(:moderation_status, @allowed_statuses)
  end
end
