defmodule ProductCompareSchemas.Discussions.ThreadPost do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "thread_posts" do
    field :entropy_id, Ecto.UUID
    field :body_md, :string

    belongs_to :thread, ProductCompareSchemas.Discussions.ProductThread
    belongs_to :parent_post, __MODULE__
    belongs_to :user, ProductCompareSchemas.Accounts.User

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
    |> foreign_key_constraint(:thread_id)
    |> foreign_key_constraint(:parent_post_id)
    |> foreign_key_constraint(:user_id)
  end
end
