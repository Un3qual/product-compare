defmodule ProductCompareSchemas.Ingestion.IntegrationProvider do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Reference.ReferenceCode

  @primary_key {:id, :integer, autogenerate: false}
  @foreign_key_type :integer
  @codes %{"cj" => 1, "awin" => 2, "impact" => 3, "shopify" => 4}

  @type t :: %__MODULE__{}

  schema "integration_providers" do
    field :code, :string
    field :name, :string
    field :enabled, :boolean

    timestamps()
  end

  @spec codes() :: %{String.t() => pos_integer()}
  def codes, do: @codes

  @spec normalize_code(term()) :: String.t() | nil
  def normalize_code(value), do: ReferenceCode.normalize(value, @codes, :lower)
end
