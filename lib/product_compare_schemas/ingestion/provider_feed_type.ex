defmodule ProductCompareSchemas.Ingestion.ProviderFeedType do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Reference.ReferenceCode

  @primary_key {:id, :integer, autogenerate: false}
  @foreign_key_type :integer
  @codes %{"SHOPPING" => 1, "PRODUCT" => 2}

  @type t :: %__MODULE__{}

  schema "provider_feed_types" do
    field :code, :string
    field :name, :string
    field :enabled, :boolean

    belongs_to :provider, ProductCompareSchemas.Ingestion.IntegrationProvider

    timestamps()
  end

  @spec codes() :: %{String.t() => pos_integer()}
  def codes, do: @codes

  @spec normalize_code(term()) :: String.t() | nil
  def normalize_code(value), do: ReferenceCode.normalize(value, @codes, :upper)

  @spec provider_code_for_code(term()) :: String.t() | nil
  def provider_code_for_code(value) do
    if normalize_code(value), do: "cj"
  end
end
