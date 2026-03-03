defmodule ProductCompareSchemas.Discussions.ThreadPost do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompare.Repo

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
    |> validate_parent_thread_consistency()
    |> foreign_key_constraint(:thread_id)
    |> foreign_key_constraint(:parent_post_id)
    |> foreign_key_constraint(:user_id)
  end

  defp validate_parent_thread_consistency(changeset) do
    parent_post_id = get_field(changeset, :parent_post_id)
    thread_id = get_field(changeset, :thread_id)

    cond do
      is_nil(parent_post_id) or is_nil(thread_id) ->
        changeset

      true ->
        case Repo.get(__MODULE__, parent_post_id) do
          nil ->
            add_error(changeset, :parent_post_id, "does not exist")

          %__MODULE__{thread_id: ^thread_id} ->
            changeset

          %__MODULE__{} ->
            add_error(changeset, :parent_post_id, "must belong to the same thread")
        end
    end
  end
end
