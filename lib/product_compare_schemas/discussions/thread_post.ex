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
    post
    |> cast(attrs, [:thread_id, :parent_post_id, :user_id, :body_md])
    |> validate_required([:thread_id, :body_md])
  end
end
