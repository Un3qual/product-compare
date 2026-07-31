defmodule ProductCompareSchemas.Accounts.ReputationEvent do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "reputation_events" do
    field :entropy_id, Ecto.UUID
    field :delta, :integer

    belongs_to :user, ProductCompareSchemas.Accounts.User
    belongs_to :reputation_event_type, ProductCompareSchemas.Accounts.ReputationEventType

    timestamps(updated_at: false)
  end
end
