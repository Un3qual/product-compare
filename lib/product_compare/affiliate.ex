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
    name = Map.get(attrs, :name) || Map.get(attrs, "name")

    case Repo.get_by(AffiliateNetwork, name: name) do
      nil -> %AffiliateNetwork{} |> AffiliateNetwork.changeset(attrs) |> Repo.insert()
      network -> network |> AffiliateNetwork.changeset(attrs) |> Repo.update()
    end
  end

  @spec upsert_program(map()) :: {:ok, AffiliateProgram.t()} | {:error, Ecto.Changeset.t()}
  def upsert_program(attrs) do
    network_id = Map.get(attrs, :affiliate_network_id) || Map.get(attrs, "affiliate_network_id")
    merchant_id = Map.get(attrs, :merchant_id) || Map.get(attrs, "merchant_id")

    query =
      from p in AffiliateProgram,
        where: p.affiliate_network_id == ^network_id and p.merchant_id == ^merchant_id

    case Repo.one(query) do
      nil -> %AffiliateProgram{} |> AffiliateProgram.changeset(attrs) |> Repo.insert()
      program -> program |> AffiliateProgram.changeset(attrs) |> Repo.update()
    end
  end

  @spec upsert_link(map()) :: {:ok, AffiliateLink.t()} | {:error, Ecto.Changeset.t()}
  def upsert_link(attrs) do
    merchant_product_id =
      Map.get(attrs, :merchant_product_id) || Map.get(attrs, "merchant_product_id")

    case Repo.get_by(AffiliateLink, merchant_product_id: merchant_product_id) do
      nil -> %AffiliateLink{} |> AffiliateLink.changeset(attrs) |> Repo.insert()
      link -> link |> AffiliateLink.changeset(attrs) |> Repo.update()
    end
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
        order_by: [asc: c.valid_to]
    )
  end
end
