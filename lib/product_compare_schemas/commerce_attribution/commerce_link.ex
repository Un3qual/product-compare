defmodule ProductCompareSchemas.CommerceAttribution.CommerceLink do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompare.CommerceAttribution.DestinationUrl

  @link_types [:affiliate, :non_affiliate]

  @type t :: %__MODULE__{}

  schema "commerce_links" do
    field :entropy_id, Ecto.UUID
    field :destination_url, :string
    field :link_type, Ecto.Enum, values: @link_types
    field :campaign_params, :map, default: %{}
    field :backfilled_from_affiliate_links, :boolean, default: false
    field :is_active, :boolean, default: true

    belongs_to :merchant, ProductCompareSchemas.Pricing.Merchant
    belongs_to :affiliate_program, ProductCompareSchemas.Affiliate.AffiliateProgram

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(link, attrs) do
    link
    |> cast(attrs, [
      :merchant_id,
      :affiliate_program_id,
      :destination_url,
      :link_type,
      :campaign_params,
      :backfilled_from_affiliate_links,
      :is_active
    ])
    |> validate_required([:merchant_id, :destination_url, :link_type])
    |> validate_destination_url()
    |> validate_campaign_params()
    |> unique_constraint(:destination_url, name: :commerce_links_business_key_uq)
    |> foreign_key_constraint(:merchant_id)
    |> foreign_key_constraint(:affiliate_program_id)
    |> check_constraint(:affiliate_program_id, name: :commerce_links_affiliate_program_check)
  end

  defp validate_campaign_params(changeset) do
    case get_field(changeset, :campaign_params) do
      nil -> put_change(changeset, :campaign_params, %{})
      value when is_map(value) -> changeset
      _value -> add_error(changeset, :campaign_params, "must be a map")
    end
  end

  @spec valid_destination_url?(term()) :: boolean()
  defdelegate valid_destination_url?(url), to: DestinationUrl, as: :valid?

  defp validate_destination_url(changeset) do
    validate_change(changeset, :destination_url, fn :destination_url, destination_url ->
      if valid_destination_url?(destination_url) do
        []
      else
        [destination_url: "must be a valid http/https URL"]
      end
    end)
  end
end
