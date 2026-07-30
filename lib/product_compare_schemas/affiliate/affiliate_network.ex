defmodule ProductCompareSchemas.Affiliate.AffiliateNetwork do
  use ProductCompareSchemas.Schema, :relational

  @provider_codes [:impact, :awin, :rakuten, :cj, :amazon_associates]

  @type t :: %__MODULE__{}

  schema "affiliate_networks" do
    field :entropy_id, Ecto.UUID
    field :code, :string
    field :name, :string

    timestamps()
  end

  @spec provider_codes() :: [atom()]
  def provider_codes, do: @provider_codes

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(network, attrs) do
    network
    |> cast(attrs, [:code, :name])
    |> put_default_code()
    |> validate_required([:code, :name])
    |> validate_format(:code, ~r/^[a-z0-9]+(?:_[a-z0-9]+)*$/)
    |> unique_constraint(:code)
    |> unique_constraint(:name)
  end

  defp put_default_code(changeset) do
    case {get_change(changeset, :code), get_field(changeset, :name)} do
      {nil, name} when is_binary(name) -> put_change(changeset, :code, code_from_name(name))
      {code, _name} when is_binary(code) -> put_change(changeset, :code, code_from_name(code))
      _missing_name_and_code -> changeset
    end
  end

  defp code_from_name(value) do
    value
    |> String.trim()
    |> String.downcase()
    |> String.replace(~r/[^a-z0-9]+/, "_")
    |> String.trim("_")
  end
end
