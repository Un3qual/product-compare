defmodule ProductCompareSchemas.Ingestion.ImportRun do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Ingestion.IntegrationSurface
  alias ProductCompareSchemas.Reference.ReferenceCode

  @type t :: %__MODULE__{}

  @statuses [:running, :succeeded, :failed]
  @reconciliation_statuses [
    :not_requested,
    :pending,
    :succeeded,
    :skipped_partial,
    :skipped_failed,
    :skipped_superseded
  ]
  @required_fields [:source_id, :surface, :query, :status, :started_at]
  @count_fields [
    :pages_fetched,
    :records_fetched,
    :records_normalized,
    :records_persisted,
    :records_failed
  ]

  schema "ingestion_runs" do
    field :entropy_id, Ecto.UUID
    field :provider, :string, virtual: true

    field :surface, ReferenceCode,
      codes: IntegrationSurface.codes(),
      normalization: :none,
      source: :integration_surface_id

    field :query, :map, default: %{}
    field :status, Ecto.Enum, values: @statuses
    field :started_at, :utc_datetime_usec
    field :finished_at, :utc_datetime_usec
    field :cursor_start, :integer
    field :cursor_end, :integer
    field :page_size, :integer
    field :pages_requested, :integer
    field :pages_fetched, :integer, default: 0
    field :records_fetched, :integer, default: 0
    field :records_normalized, :integer, default: 0
    field :records_persisted, :integer, default: 0
    field :records_failed, :integer, default: 0
    field :error_summary, :string
    field :scope_fingerprint, :string

    field :reconciliation_status, Ecto.Enum,
      values: @reconciliation_statuses,
      default: :not_requested

    field :reconciled_at, :utc_datetime_usec
    field :offers_deactivated, :integer, default: 0

    belongs_to :source, ProductCompareSchemas.Specs.Source
    has_many :observations, ProductCompareSchemas.Ingestion.ImportObservation

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(import_run, attrs) do
    import_run
    |> cast(attrs, [
      :source_id,
      :provider,
      :surface,
      :query,
      :status,
      :started_at,
      :finished_at,
      :cursor_start,
      :cursor_end,
      :page_size,
      :pages_requested,
      :pages_fetched,
      :records_fetched,
      :records_normalized,
      :records_persisted,
      :records_failed,
      :error_summary,
      :scope_fingerprint,
      :reconciliation_status,
      :reconciled_at,
      :offers_deactivated
    ])
    |> validate_required(@required_fields)
    |> validate_number(:page_size, greater_than: 0)
    |> validate_number(:pages_requested, greater_than: 0)
    |> validate_counts()
    |> validate_number(:offers_deactivated, greater_than_or_equal_to: 0)
    |> foreign_key_constraint(:source_id)
    |> foreign_key_constraint(:surface, name: :ingestion_runs_integration_surface_id_fkey)
    |> check_constraint(:pages_fetched, name: :ingestion_runs_counts_non_negative)
  end

  defp validate_counts(changeset) do
    Enum.reduce(@count_fields, changeset, fn field, changeset ->
      validate_number(changeset, field, greater_than_or_equal_to: 0)
    end)
  end
end
