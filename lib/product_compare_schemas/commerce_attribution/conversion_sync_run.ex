defmodule ProductCompareSchemas.CommerceAttribution.ConversionSyncRun do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork

  @statuses [:running, :succeeded, :failed]
  @triggers [:scheduled, :operator, :cli]
  @fields [
    :entropy_id,
    :affiliate_network_id,
    :status,
    :trigger,
    :requested_by_user_id,
    :oban_job_id,
    :oban_attempt,
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
  ]
  @completion_fields [
    :status,
    :cursor,
    :pages_fetched,
    :records_fetched,
    :records_persisted,
    :records_failed,
    :finished_at,
    :error_summary
  ]
  @required_fields [
    :affiliate_network_id,
    :status,
    :trigger,
    :window_start,
    :window_end,
    :started_at
  ]

  @type t :: %__MODULE__{}

  schema "commerce_conversion_sync_runs" do
    field :entropy_id, Ecto.UUID
    belongs_to :affiliate_network, AffiliateNetwork
    field :status, Ecto.Enum, values: @statuses
    field :trigger, Ecto.Enum, values: @triggers
    belongs_to :requested_by_user, User
    field :oban_job_id, :integer
    field :oban_attempt, :integer
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
    |> cast(attrs, @fields)
    |> validate_invariants()
  end

  @spec completion_changeset(t(), map()) :: Ecto.Changeset.t()
  def completion_changeset(run, attrs) do
    run
    |> cast(attrs, @completion_fields)
    |> validate_invariants()
    |> validate_inclusion(:status, [:succeeded, :failed])
  end

  defp validate_invariants(changeset) do
    changeset
    |> validate_required(@required_fields)
    |> validate_inclusion(:status, @statuses)
    |> validate_inclusion(:trigger, @triggers)
    |> validate_oban_identity()
    |> validate_window()
    |> validate_counts()
    |> validate_terminal_finished_at()
    |> validate_error_summary()
    |> unique_constraint(:entropy_id, name: :commerce_conversion_sync_runs_entropy_uq)
    |> foreign_key_constraint(:affiliate_network_id)
    |> foreign_key_constraint(:requested_by_user_id)
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
    |> check_constraint(:oban_job_id,
      name: :commerce_conversion_sync_runs_oban_identity_paired
    )
    |> check_constraint(:oban_attempt,
      name: :commerce_conversion_sync_runs_oban_attempt_positive
    )
  end

  defp validate_oban_identity(changeset) do
    changeset = validate_number(changeset, :oban_attempt, greater_than: 0)

    case {get_field(changeset, :oban_job_id), get_field(changeset, :oban_attempt)} do
      {nil, nil} ->
        changeset

      {job_id, attempt} when not is_nil(job_id) and not is_nil(attempt) ->
        changeset

      _partial_identity ->
        changeset
        |> add_error(:oban_job_id, "must be present with Oban attempt")
        |> add_error(:oban_attempt, "must be present with Oban job")
    end
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
    changeset
    |> validate_number(:pages_fetched, greater_than_or_equal_to: 0)
    |> validate_number(:records_fetched, greater_than_or_equal_to: 0)
    |> validate_number(:records_persisted, greater_than_or_equal_to: 0)
    |> validate_number(:records_failed, greater_than_or_equal_to: 0)
  end

  defp validate_terminal_finished_at(changeset) do
    case {get_field(changeset, :status), get_field(changeset, :finished_at)} do
      {status, nil} when status in [:succeeded, :failed] ->
        add_error(changeset, :finished_at, "is invalid")

      _running_or_finished ->
        changeset
    end
  end

  defp validate_error_summary(changeset) do
    validate_change(changeset, :error_summary, fn :error_summary, value ->
      if is_binary(value) and Enum.count_until(String.codepoints(value), 501) <= 500 do
        []
      else
        [error_summary: "must be 500 characters or fewer"]
      end
    end)
  end
end
