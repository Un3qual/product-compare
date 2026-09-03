defmodule ProductCompareSchemas.CommerceAttribution.CJActionCorrection do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Affiliate.AffiliateNetwork

  @type t :: %__MODULE__{}

  schema "commerce_cj_action_corrections" do
    belongs_to :affiliate_network, AffiliateNetwork
    field :network_action_ref, :string
    field :network_correction_ref, :string
    field :posting_date, :utc_datetime_usec
    field :raw_payload, :map

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(correction, attrs) do
    correction
    |> cast(attrs, [
      :affiliate_network_id,
      :network_action_ref,
      :network_correction_ref,
      :posting_date,
      :raw_payload
    ])
    |> validate_required([
      :affiliate_network_id,
      :network_action_ref,
      :network_correction_ref,
      :posting_date,
      :raw_payload
    ])
    |> validate_correction_payload()
    |> unique_constraint([:affiliate_network_id, :network_action_ref],
      name: :commerce_cj_action_corrections_network_action_uq
    )
    |> foreign_key_constraint(:affiliate_network_id)
    |> check_constraint(:network_action_ref,
      name: :commerce_cj_action_corrections_action_ref_nonblank
    )
    |> check_constraint(:network_correction_ref,
      name: :commerce_cj_action_corrections_correction_ref_nonblank
    )
    |> check_constraint(:raw_payload,
      name: :commerce_cj_action_corrections_payload_is_correction
    )
  end

  defp validate_correction_payload(changeset) do
    case get_field(changeset, :raw_payload) do
      %{"original" => false} -> changeset
      _missing_or_invalid -> add_error(changeset, :raw_payload, "must identify a correction")
    end
  end
end
