defmodule ProductCompare.CommerceAttribution.Clicks.Links do
  @moduledoc false

  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.CommerceLink

  @upsert_fields [:campaign_params, :backfilled_from_affiliate_links, :is_active]
  @conflict_target {:unsafe_fragment,
                    "(destination_url, COALESCE(affiliate_program_id, 0), merchant_id, link_type)"}

  @spec upsert(map()) :: {:ok, CommerceLink.t()} | {:error, Ecto.Changeset.t()}
  def upsert(attrs) do
    now = DateTime.utc_now()
    changeset = CommerceLink.changeset(%CommerceLink{}, attrs)
    update_fields = Input.present_upsert_fields(attrs, changeset, @upsert_fields)

    Repo.insert(
      changeset,
      on_conflict: [set: update_fields ++ [updated_at: now]],
      conflict_target: @conflict_target,
      returning: true
    )
  end

  @spec ensure_active(CommerceLink.t()) :: :ok | {:error, :merchant_product_not_found}
  def ensure_active(%CommerceLink{is_active: true}), do: :ok
  def ensure_active(%CommerceLink{is_active: false}), do: {:error, :merchant_product_not_found}

  @spec tracked_attrs(map()) :: map()
  def tracked_attrs(destination) do
    destination
    |> commerce_link_attrs()
    |> Map.delete(:is_active)
  end

  defp commerce_link_attrs(destination) do
    %{
      merchant_id: destination.merchant_id,
      affiliate_program_id: destination.affiliate_program_id,
      destination_url: destination.destination_url,
      link_type: destination.link_type,
      backfilled_from_affiliate_links: destination.backfilled_from_affiliate_links,
      is_active: true
    }
  end
end
