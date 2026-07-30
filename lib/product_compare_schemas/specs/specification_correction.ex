defmodule ProductCompareSchemas.Specs.SpecificationCorrection do
  use ProductCompareSchemas.Schema, :relational

  @statuses [:pending, :accepted, :rejected]

  @type t :: %__MODULE__{}

  schema "specification_corrections" do
    field :entropy_id, Ecto.UUID
    field :reason, :string
    field :source_url, :string
    field :explanation, :string
    field :status, Ecto.Enum, values: @statuses, default: :pending
    field :reviewed_at, :utc_datetime_usec
    field :moderation_note, :string

    belongs_to :claim, ProductCompareSchemas.Specs.ProductAttributeClaim
    belongs_to :product, ProductCompareSchemas.Catalog.Product
    belongs_to :attribute, ProductCompareSchemas.Specs.Attribute

    belongs_to :submitter, ProductCompareSchemas.Accounts.User, foreign_key: :submitted_by

    belongs_to :reviewer, ProductCompareSchemas.Accounts.User, foreign_key: :reviewed_by

    timestamps()
  end

  @spec statuses() :: [atom()]
  def statuses, do: @statuses

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(correction, attrs) do
    correction
    |> cast(attrs, [
      :claim_id,
      :product_id,
      :attribute_id,
      :submitted_by,
      :reason,
      :source_url,
      :explanation,
      :status
    ])
    |> normalize_text([:reason, :source_url, :explanation])
    |> validate_required([:claim_id, :product_id, :attribute_id, :submitted_by, :reason, :status])
    |> validate_length(:reason, min: 10, max: 500)
    |> validate_length(:source_url, max: 2_048)
    |> validate_length(:explanation, max: 2_000)
    |> validate_source_url()
    |> validate_evidence()
    |> unique_constraint(:claim_id)
    |> unique_constraint(:attribute_id,
      name: :specification_corrections_one_pending_uq,
      message: "already has a pending correction"
    )
    |> check_constraint(:base, name: :specification_corrections_evidence_check)
  end

  @spec moderation_changeset(t(), map()) :: Ecto.Changeset.t()
  def moderation_changeset(correction, attrs) do
    correction
    |> cast(attrs, [:status, :reviewed_by, :reviewed_at, :moderation_note])
    |> normalize_text([:moderation_note])
    |> validate_required([:status, :reviewed_by, :reviewed_at])
    |> validate_inclusion(:status, [:accepted, :rejected])
    |> validate_length(:moderation_note, max: 1_000)
  end

  defp normalize_text(changeset, fields) do
    Enum.reduce(fields, changeset, fn field, changeset ->
      update_change(changeset, field, fn
        value when is_binary(value) ->
          case String.trim(value) do
            "" -> nil
            trimmed -> trimmed
          end

        value ->
          value
      end)
    end)
  end

  defp validate_source_url(changeset) do
    validate_change(changeset, :source_url, fn :source_url, value ->
      case URI.parse(value) do
        %URI{scheme: scheme, host: host}
        when scheme in ["http", "https"] and is_binary(host) and host != "" ->
          []

        _ ->
          [source_url: "must be an HTTP(S) URL"]
      end
    end)
  end

  defp validate_evidence(changeset) do
    if present?(get_field(changeset, :source_url)) or
         present?(get_field(changeset, :explanation)) do
      changeset
    else
      add_error(changeset, :base, "provide a source URL or explanation")
    end
  end

  defp present?(value), do: is_binary(value) and value != ""
end
