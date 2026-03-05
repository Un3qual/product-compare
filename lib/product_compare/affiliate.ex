defmodule ProductCompare.Affiliate do
  @moduledoc """
  Affiliate context for networks, programs, links, and coupons.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateLink
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.Affiliate.AffiliateProgram
  alias ProductCompareSchemas.Affiliate.Coupon

  @spec upsert_network(map()) :: {:ok, AffiliateNetwork.t()} | {:error, Ecto.Changeset.t()}
  def upsert_network(attrs) do
    now = DateTime.utc_now()
    changeset = AffiliateNetwork.changeset(%AffiliateNetwork{}, attrs)

    Repo.insert(
      changeset,
      on_conflict: [set: [updated_at: now]],
      conflict_target: [:name],
      returning: true
    )
  end

  @spec upsert_program(map()) :: {:ok, AffiliateProgram.t()} | {:error, Ecto.Changeset.t()}
  def upsert_program(attrs) do
    now = DateTime.utc_now()
    changeset = AffiliateProgram.changeset(%AffiliateProgram{}, attrs)
    update_fields = Map.take(changeset.changes, [:program_code, :status]) |> Map.to_list()

    Repo.insert(
      changeset,
      on_conflict: [set: update_fields ++ [updated_at: now]],
      conflict_target: [:affiliate_network_id, :merchant_id],
      returning: true
    )
  end

  @spec upsert_link(map()) :: {:ok, AffiliateLink.t()} | {:error, Ecto.Changeset.t()}
  def upsert_link(attrs) do
    now = DateTime.utc_now()
    changeset = AffiliateLink.changeset(%AffiliateLink{}, attrs)

    update_fields =
      Map.take(changeset.changes, [
        :affiliate_network_id,
        :original_url,
        :affiliate_url,
        :last_verified_at
      ])
      |> Map.to_list()

    Repo.insert(
      changeset,
      on_conflict: [set: update_fields ++ [updated_at: now]],
      conflict_target: [:merchant_product_id],
      returning: true
    )
  end

  @spec create_coupon(map()) :: {:ok, Coupon.t()} | {:error, Ecto.Changeset.t()}
  def create_coupon(attrs) do
    %Coupon{}
    |> Coupon.changeset(attrs)
    |> Repo.insert()
  end

  @spec list_active_coupons(pos_integer(), DateTime.t()) :: [Coupon.t()]
  def list_active_coupons(merchant_id, now \\ DateTime.utc_now()) do
    Repo.all(
      from c in Coupon,
        where: c.merchant_id == ^merchant_id,
        where: is_nil(c.valid_from) or c.valid_from <= ^now,
        where: is_nil(c.valid_to) or c.valid_to >= ^now,
        order_by: [asc: c.valid_to, asc: c.code, asc: c.id]
    )
  end
end
