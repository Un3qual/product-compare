defmodule ProductCompareSchemas.CommerceAttribution.AnonymousVisitor do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "anonymous_visitors" do
    field :entropy_id, Ecto.UUID

    has_many :click_sessions,
             ProductCompareSchemas.CommerceAttribution.CommerceClickSession,
             foreign_key: :anonymous_visitor_id

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(visitor, attrs) do
    visitor
    |> cast(attrs, [:entropy_id])
    |> validate_required([:entropy_id])
    |> unique_constraint(:entropy_id)
  end
end
