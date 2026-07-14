defmodule ProductCompareSchemas.Discussions.ProductThread do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "product_threads" do
    field :entropy_id, Ecto.UUID
    field :title, :string
    field :body_md, :string
    field :kind, Ecto.Enum, values: [:question], default: :question

    field :moderation_status, Ecto.Enum,
      values: [:pending, :published, :hidden, :rejected],
      default: :pending

    field :moderation_note, :string
    field :moderated_at, :utc_datetime_usec

    belongs_to :product, ProductCompareSchemas.Catalog.Product
    belongs_to :creator, ProductCompareSchemas.Accounts.User, foreign_key: :created_by
    belongs_to :moderator, ProductCompareSchemas.Accounts.User, foreign_key: :moderated_by
    belongs_to :accepted_post, ProductCompareSchemas.Discussions.ThreadPost

    has_many :posts, ProductCompareSchemas.Discussions.ThreadPost, foreign_key: :thread_id

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(thread, attrs) do
    cast_fields =
      if is_nil(thread.id),
        do: [:product_id, :title, :body_md, :kind, :created_by],
        else: [:title, :body_md]

    thread
    |> cast(attrs, cast_fields)
    |> validate_required([:product_id, :title, :created_by])
    |> validate_length(:title, min: 1, max: 200)
    |> validate_length(:body_md, max: 5_000)
    |> foreign_key_constraint(:product_id)
    |> foreign_key_constraint(:created_by)
  end

  def moderation_changeset(thread, status, moderator_id, note, now) do
    thread
    |> change(
      moderation_status: status,
      moderation_note: note,
      moderated_by: moderator_id,
      moderated_at: now
    )
    |> validate_inclusion(:moderation_status, [:published, :hidden, :rejected])
  end
end
