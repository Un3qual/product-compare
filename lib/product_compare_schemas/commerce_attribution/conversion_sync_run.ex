defmodule ProductCompareSchemas.CommerceAttribution.ConversionSyncRun do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork

  @statuses [:running, :succeeded, :failed]
  @triggers [:scheduled, :operator, :cli]
  @count_fields [:pages_fetched, :records_fetched, :records_persisted, :records_failed]

  @type t :: %__MODULE__{}

  schema "commerce_conversion_sync_runs" do
    field :entropy_id, Ecto.UUID
    belongs_to :affiliate_network, AffiliateNetwork
    field :status, Ecto.Enum, values: @statuses
    field :trigger, Ecto.Enum, values: @triggers
    belongs_to :requested_by_user, User
    field :window_start, :utc_datetime_usec
    field :window_end, :utc_datetime_usec
    field :cursor, :string
    field :pages_fetched, :integer, default: 0
    field :records_fetched, :integer, default: 0
    field :records_persisted, :integer, default: 0
    field :records_failed, :integer, default: 0
    field :started_at, :utc_datetime_usec
    field :finished_at, :utc_datetime_usec
    field :error_summary, :string

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(run, attrs) do
    run
    |> cast(attrs, [
      :entropy_id,
      :affiliate_network_id,
      :status,
      :trigger,
      :requested_by_user_id,
      :window_start,
      :window_end,
      :cursor,
      :pages_fetched,
      :records_fetched,
      :records_persisted,
      :records_failed,
      :started_at,
      :finished_at,
      :error_summary
    ])
    |> validate_required([
      :affiliate_network_id,
      :status,
      :trigger,
      :window_start,
      :window_end,
      :started_at
    ])
    |> validate_inclusion(:status, @statuses)
    |> validate_inclusion(:trigger, @triggers)
    |> validate_window()
    |> validate_counts()
    |> validate_terminal_finished_at()
    |> validate_error_summary()
    |> unique_constraint(:entropy_id, name: :commerce_conversion_sync_runs_entropy_uq)
    |> foreign_key_constraint(:affiliate_network_id)
    |> foreign_key_constraint(:requested_by_user_id)
    |> check_constraint(:status, name: :commerce_conversion_sync_runs_status_valid)
    |> check_constraint(:trigger, name: :commerce_conversion_sync_runs_trigger_valid)
    |> check_constraint(:window_end, name: :commerce_conversion_sync_runs_window_increasing)
    |> check_constraint(:pages_fetched,
      name: :commerce_conversion_sync_runs_counts_non_negative
    )
    |> check_constraint(:finished_at,
      name: :commerce_conversion_sync_runs_terminal_finished_at_required
    )
    |> check_constraint(:error_summary,
      name: :commerce_conversion_sync_runs_error_summary_length
    )
  end

  @spec completion_changeset(t(), map()) :: Ecto.Changeset.t()
  def completion_changeset(run, attrs) do
    run
    |> changeset(attrs)
    |> validate_inclusion(:status, [:succeeded, :failed])
  end

  defp validate_window(changeset) do
    window_start = get_field(changeset, :window_start)
    window_end = get_field(changeset, :window_end)

    if match?(%DateTime{}, window_start) and match?(%DateTime{}, window_end) and
         DateTime.compare(window_end, window_start) != :gt do
      add_error(changeset, :window_end, "must be after window start")
    else
      changeset
    end
  end

  defp validate_counts(changeset) do
    Enum.reduce(@count_fields, changeset, fn field, changeset ->
      validate_number(changeset, field, greater_than_or_equal_to: 0)
    end)
  end

  defp validate_terminal_finished_at(changeset) do
    if get_field(changeset, :status) in [:succeeded, :failed] and
         is_nil(get_field(changeset, :finished_at)) do
      add_error(changeset, :finished_at, "is invalid")
    else
      changeset
    end
  end

  defp validate_error_summary(changeset) do
    validate_change(changeset, :error_summary, fn :error_summary, value ->
      if is_binary(value) and String.length(value) <= 500 do
        []
      else
        [error_summary: "must be 500 characters or fewer"]
      end
    end)
  end
end
