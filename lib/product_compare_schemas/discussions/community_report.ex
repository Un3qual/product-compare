defmodule ProductCompareSchemas.Discussions.CommunityReport do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "community_reports" do
    field :entropy_id, Ecto.UUID
    field :reason, :string
    field :status, Ecto.Enum, values: [:pending, :resolved, :dismissed], default: :pending
    field :resolved_at, :utc_datetime_usec

    belongs_to :reporter, ProductCompareSchemas.Accounts.User
    belongs_to :review, ProductCompareSchemas.Discussions.ProductReview
    belongs_to :thread, ProductCompareSchemas.Discussions.ProductThread
    belongs_to :post, ProductCompareSchemas.Discussions.ThreadPost
    belongs_to :resolver, ProductCompareSchemas.Accounts.User, foreign_key: :resolved_by

    timestamps(updated_at: false)
  end

  def changeset(report, attrs) do
    report
    |> cast(attrs, [:reporter_id, :review_id, :thread_id, :post_id, :reason])
    |> validate_required([:reporter_id, :reason])
    |> validate_length(:reason, min: 3, max: 500)
    |> validate_target()
    |> unique_constraint([:reporter_id, :review_id])
    |> unique_constraint([:reporter_id, :thread_id])
    |> unique_constraint([:reporter_id, :post_id])
  end

  defp validate_target(changeset) do
    target_count = Enum.count([:review_id, :thread_id, :post_id], &get_field(changeset, &1))

    if target_count == 1,
      do: changeset,
      else: add_error(changeset, :target, "must select one item")
  end
end
