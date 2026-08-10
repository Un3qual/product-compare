defmodule ProductCompareSchemas.Discussions.ThreadPost do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Discussions.ModerationChangeset

  @type t :: %__MODULE__{}

  schema "thread_posts" do
    field :entropy_id, Ecto.UUID
    field :body_md, :string

    field :moderation_status, Ecto.Enum,
      values: [:pending, :published, :hidden, :rejected, :removed],
      default: :pending

    field :moderation_note, :string
    field :moderated_at, :utc_datetime_usec

    belongs_to :thread, ProductCompareSchemas.Discussions.ProductThread
    belongs_to :parent_post, __MODULE__
    belongs_to :user, ProductCompareSchemas.Accounts.User
    belongs_to :moderator, ProductCompareSchemas.Accounts.User, foreign_key: :moderated_by

    has_many :replies, __MODULE__, foreign_key: :parent_post_id

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(post, attrs) do
    cast_fields =
      if is_nil(post.id) do
        [:thread_id, :parent_post_id, :user_id, :body_md]
      else
        [:parent_post_id, :body_md]
      end

    post
    |> cast(attrs, cast_fields)
    |> validate_required([:thread_id, :user_id, :body_md])
    |> validate_length(:body_md, max: 5_000, count: :codepoints)
    |> validate_parent_not_self()
    |> check_constraint(:body_md, name: :thread_posts_body_length_check)
    |> check_constraint(:parent_post_id, name: :thread_posts_parent_not_self_check)
    |> foreign_key_constraint(:thread_id)
    |> foreign_key_constraint(:parent_post_id)
    |> foreign_key_constraint(:user_id)
  end

  defp validate_parent_not_self(changeset) do
    post_id = changeset.data.id

    if not is_nil(post_id) and get_field(changeset, :parent_post_id) == post_id do
      add_error(changeset, :parent_post_id, "cannot create a cycle")
    else
      changeset
    end
  end

  def moderation_changeset(post, status, moderator_id, note, now) do
    ModerationChangeset.change(post, status, moderator_id, note, now)
  end
end
