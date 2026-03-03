defmodule ProductCompareSchemas.Discussions.ProductThread do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "product_threads" do
    field :entropy_id, Ecto.UUID
    field :title, :string

    belongs_to :product, ProductCompareSchemas.Catalog.Product
    belongs_to :creator, ProductCompareSchemas.Accounts.User, foreign_key: :created_by

    has_many :posts, ProductCompareSchemas.Discussions.ThreadPost, foreign_key: :thread_id

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(thread, attrs) do
    thread
    |> cast(attrs, [:product_id, :title, :created_by])
    |> validate_required([:product_id, :title])
  end
end
