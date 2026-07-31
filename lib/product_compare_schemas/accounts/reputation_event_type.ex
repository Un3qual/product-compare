defmodule ProductCompareSchemas.Accounts.ReputationEventType do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "reputation_event_types" do
    field :code, :string
    field :name, :string
    field :default_delta, :integer

    has_many :reputation_events, ProductCompareSchemas.Accounts.ReputationEvent

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(event_type, attrs) do
    event_type
    |> cast(attrs, [:code, :name, :default_delta])
    |> validate_required([:code, :name, :default_delta])
    |> unique_constraint(:code)
  end
end
