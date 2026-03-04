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
    |> validate_required([:thread_id, :user_id, :body_md])
    |> validate_thread_id_immutable(post)
    |> validate_parent_thread_consistency()
    |> validate_parent_cycle(post)
    |> foreign_key_constraint(:thread_id)
    |> foreign_key_constraint(:parent_post_id)
    |> foreign_key_constraint(:user_id)
  end

  defp validate_thread_id_immutable(changeset, %__MODULE__{id: nil}), do: changeset

  defp validate_thread_id_immutable(changeset, %__MODULE__{} = post) do
    if get_field(changeset, :thread_id) != post.thread_id do
      add_error(changeset, :thread_id, "cannot be changed once a post is created")
    else
      changeset
    end
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

  defp validate_parent_cycle(changeset, %__MODULE__{id: nil}), do: changeset

  defp validate_parent_cycle(changeset, %__MODULE__{} = post) do
    parent_post_id = get_field(changeset, :parent_post_id)

    if parent_chain_contains_id?(parent_post_id, post.id) do
      add_error(changeset, :parent_post_id, "cannot create a cycle")
    else
      changeset
    end
  end

  defp parent_chain_contains_id?(nil, _target_id), do: false

  defp parent_chain_contains_id?(parent_id, target_id, visited \\ MapSet.new()) do
    cond do
      parent_id == target_id ->
        true

      MapSet.member?(visited, parent_id) ->
        false

      true ->
        case Repo.get(__MODULE__, parent_id) do
          nil -> false
          %__MODULE__{parent_post_id: next_parent_id} ->
            parent_chain_contains_id?(next_parent_id, target_id, MapSet.put(visited, parent_id))
        end
    end
  end
end
