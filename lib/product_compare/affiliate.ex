defmodule ProductCompare.Affiliate do
  @moduledoc """
  Affiliate context for networks, programs, links, and coupons.
  """

  import Ecto.Query

  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateLink
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.Affiliate.AffiliateProgram
  alias ProductCompareSchemas.Affiliate.Coupon

  @spec get_affiliate_network(pos_integer()) :: AffiliateNetwork.t() | nil
  def get_affiliate_network(id), do: Repo.get(AffiliateNetwork, id)

  @spec get_affiliate_program(pos_integer()) :: AffiliateProgram.t() | nil
  def get_affiliate_program(id), do: Repo.get(AffiliateProgram, id)

  @spec get_affiliate_link(pos_integer()) :: AffiliateLink.t() | nil
  def get_affiliate_link(id), do: Repo.get(AffiliateLink, id)

  @spec get_coupon(pos_integer()) :: Coupon.t() | nil
  def get_coupon(id), do: Repo.get(Coupon, id)

  @type node_type :: :affiliate_network | :affiliate_program | :affiliate_link | :coupon

  @spec get_affiliate_nodes(node_type(), [pos_integer()]) ::
          %{optional(pos_integer()) => struct() | nil}
  def get_affiliate_nodes(type, ids) when is_list(ids) do
    schema = affiliate_node_schema(type)
    ids = Enum.uniq(ids)

    records_by_id =
      case ids do
        [] ->
          %{}

        ids ->
          schema
          |> where([record], record.id in ^ids)
          |> Repo.all()
          |> Map.new(&{&1.id, &1})
      end

    Map.new(ids, &{&1, Map.get(records_by_id, &1)})
  end

  @spec upsert_network(map()) :: {:ok, AffiliateNetwork.t()} | {:error, Ecto.Changeset.t()}
  def upsert_network(attrs) do
    changeset = AffiliateNetwork.changeset(%AffiliateNetwork{}, attrs)

    changeset
    |> Repo.insert(on_conflict: :nothing, conflict_target: [:name], returning: true)
    |> fetch_existing_network(changeset)
  end

  @spec upsert_program(map()) :: {:ok, AffiliateProgram.t()} | {:error, Ecto.Changeset.t()}
  def upsert_program(attrs) do
    now = DateTime.utc_now()
    changeset = AffiliateProgram.changeset(%AffiliateProgram{}, attrs)
    update_fields = conflict_update_fields(attrs, changeset, [:program_code, :status])

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
      conflict_update_fields(attrs, changeset, [
        :affiliate_network_id,
        :original_url,
        :affiliate_url,
        :last_verified_at
      ])

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

  @spec list_active_coupons_query(pos_integer(), DateTime.t()) :: Ecto.Query.t()
  def list_active_coupons_query(merchant_id, now \\ DateTime.utc_now()) do
    from c in Coupon,
      where: c.merchant_id == ^merchant_id,
      where: is_nil(c.valid_from) or c.valid_from <= ^now,
      where: is_nil(c.valid_to) or c.valid_to >= ^now,
      order_by: [asc: c.valid_to, asc: c.code, asc: c.id]
  end

  @spec list_active_coupons(pos_integer(), DateTime.t()) :: [Coupon.t()]
  def list_active_coupons(merchant_id, now \\ DateTime.utc_now()) do
    merchant_id
    |> list_active_coupons_query(now)
    |> Repo.all()
  end

  @spec active_coupon_pages([pos_integer()], DateTime.t(), %{
          offset: non_neg_integer(),
          fetch_limit: non_neg_integer()
        }) :: %{optional(pos_integer()) => [Coupon.t()]}
  def active_coupon_pages(merchant_ids, now, %{offset: offset, fetch_limit: fetch_limit})
      when is_list(merchant_ids) do
    merchant_ids = Enum.uniq(merchant_ids)

    if merchant_ids == [] do
      %{}
    else
      ranked_coupons =
        Coupon
        |> where([coupon], coupon.merchant_id in ^merchant_ids)
        |> where([coupon], is_nil(coupon.valid_from) or coupon.valid_from <= ^now)
        |> where([coupon], is_nil(coupon.valid_to) or coupon.valid_to >= ^now)
        |> windows(
          [coupon],
          coupon_page: [
            partition_by: coupon.merchant_id,
            order_by: [asc: coupon.valid_to, asc: coupon.code, asc: coupon.id]
          ]
        )
        |> select([coupon], %{
          id: coupon.id,
          row_number: over(row_number(), :coupon_page)
        })

      coupons_by_merchant =
        Coupon
        |> join(:inner, [coupon], ranked in subquery(ranked_coupons), on: ranked.id == coupon.id)
        |> where(
          [_coupon, ranked],
          ranked.row_number > ^offset and ranked.row_number <= ^(offset + fetch_limit)
        )
        |> order_by(
          [coupon, _ranked],
          asc: coupon.merchant_id,
          asc: coupon.valid_to,
          asc: coupon.code,
          asc: coupon.id
        )
        |> Repo.all()
        |> Enum.group_by(& &1.merchant_id)

      Map.new(merchant_ids, fn merchant_id ->
        {merchant_id, Map.get(coupons_by_merchant, merchant_id, [])}
      end)
    end
  end

  defp conflict_update_fields(attrs, changeset, fields) do
    Enum.flat_map(fields, fn field ->
      cond do
        Map.has_key?(changeset.changes, field) -> [{field, Map.fetch!(changeset.changes, field)}]
        Input.attr_key_present?(attrs, field) -> [{field, Input.fetch_attr(attrs, field)}]
        true -> []
      end
    end)
  end

  defp fetch_existing_network({:ok, %AffiliateNetwork{id: nil}}, changeset) do
    name = Ecto.Changeset.get_field(changeset, :name)
    {:ok, Repo.get_by!(AffiliateNetwork, name: name)}
  end

  defp fetch_existing_network(result, _changeset), do: result

  defp affiliate_node_schema(:affiliate_network), do: AffiliateNetwork
  defp affiliate_node_schema(:affiliate_program), do: AffiliateProgram
  defp affiliate_node_schema(:affiliate_link), do: AffiliateLink
  defp affiliate_node_schema(:coupon), do: Coupon
end
