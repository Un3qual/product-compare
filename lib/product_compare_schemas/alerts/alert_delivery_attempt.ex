defmodule ProductCompareSchemas.Alerts.AlertDeliveryAttempt do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "alert_delivery_attempts" do
    field :transport, Ecto.Enum, values: [:in_app, :email, :webhook]
    field :state, Ecto.Enum, values: [:pending, :delivered, :failed]
    field :attempted_at, :utc_datetime_usec
    field :delivered_at, :utc_datetime_usec

    belongs_to :alert_event, ProductCompareSchemas.Alerts.AlertEvent
    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(attempt, attrs) do
    attempt
    |> cast(attrs, [
      :alert_event_id,
      :transport,
      :state,
      :attempted_at,
      :delivered_at
    ])
    |> validate_required([:alert_event_id, :transport, :state, :attempted_at])
    |> unique_constraint([:alert_event_id, :transport],
      name: :alert_delivery_attempts_event_transport_uq
    )
  end
end
