defmodule ProductCompareSchemas.Ingestion.CJProgram do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}
  @stage_keys %{
    "new" => :new,
    "considering" => :considering,
    "selected" => :selected,
    "applied" => :applied,
    "accepted" => :accepted,
    "not_pursuing" => :not_pursuing,
    "declined" => :declined
  }
  @stages Map.keys(@stage_keys)

  @spec stages() :: [String.t()]
  def stages, do: @stages

  @spec stage_keys() :: %{required(String.t()) => atom()}
  def stage_keys, do: @stage_keys

  schema "cj_programs" do
    field :entropy_id, Ecto.UUID
    field :advertiser_id, :string
    field :stage, :string, default: "new"
    field :note, :string
    field :changed_at, :utc_datetime_usec
    field :advertiser_name, :string, virtual: true
    field :feed_count, :integer, virtual: true
    field :warning_codes, {:array, :string}, virtual: true

    belongs_to :source, ProductCompareSchemas.Specs.Source
    has_many :feeds, ProductCompareSchemas.Ingestion.MerchantFeedCandidate
    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(program, attrs) do
    program
    |> cast(attrs, [:source_id, :advertiser_id, :stage, :note, :changed_at])
    |> require_stage_attribute(attrs)
    |> validate_required([:source_id, :advertiser_id, :stage, :changed_at])
    |> validate_trimmed_advertiser_id()
    |> validate_inclusion(:stage, @stages)
    |> unique_constraint([:source_id, :advertiser_id], name: :cj_programs_source_advertiser_uq)
    |> foreign_key_constraint(:source_id)
    |> check_constraint(:stage, name: :cj_programs_stage_chk)
  end

  @spec lifecycle_changeset(t(), map()) :: Ecto.Changeset.t()
  def lifecycle_changeset(program, attrs) do
    program
    |> cast(attrs, [:stage, :note])
    |> update_change(:note, &blank_to_nil/1)
    |> validate_required([:stage, :changed_at])
    |> validate_inclusion(:stage, @stages)
    |> check_constraint(:stage, name: :cj_programs_stage_chk)
  end

  defp require_stage_attribute(changeset, attrs) do
    if Map.has_key?(attrs, :stage) or Map.has_key?(attrs, "stage") do
      changeset
    else
      add_error(changeset, :stage, "can't be blank", validation: :required)
    end
  end

  defp validate_trimmed_advertiser_id(changeset) do
    validate_change(changeset, :advertiser_id, fn :advertiser_id, advertiser_id ->
      trimmed_advertiser_id = String.trim(advertiser_id)

      cond do
        trimmed_advertiser_id == "" -> [advertiser_id: "can't be blank"]
        trimmed_advertiser_id != advertiser_id -> [advertiser_id: "must be trimmed"]
        true -> []
      end
    end)
  end

  defp blank_to_nil(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      trimmed -> trimmed
    end
  end

  defp blank_to_nil(value), do: value
end
