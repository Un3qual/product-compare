defmodule ProductCompare.CommerceAttribution.Clicks do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateLink
  alias ProductCompareSchemas.Affiliate.AffiliateProgram
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.CommerceAttribution.CommerceLink
  alias ProductCompareSchemas.Pricing.MerchantProduct

  @affiliate_network_names %{
    "amazon" => :amazon_associates,
    "amazon associates" => :amazon_associates,
    "awin" => :awin,
    "cj" => :cj,
    "commission junction" => :cj,
    "impact" => :impact,
    "rakuten" => :rakuten
  }
  @commerce_link_upsert_fields [
    :network,
    :campaign_params,
    :backfilled_from_affiliate_links,
    :is_active
  ]
  @commerce_link_conflict_target {:unsafe_fragment,
                                  "(destination_url, COALESCE(affiliate_program_id, 0), merchant_id, link_type)"}
  @click_id_query_keys MapSet.new(~w(ClickId clickId click_id subId subid sub_id))

  @spec upsert_commerce_link(map()) :: {:ok, CommerceLink.t()} | {:error, Ecto.Changeset.t()}
  def upsert_commerce_link(attrs) do
    now = DateTime.utc_now()
    changeset = CommerceLink.changeset(%CommerceLink{}, attrs)

    update_fields =
      present_upsert_fields(attrs, changeset, @commerce_link_upsert_fields)

    Repo.insert(
      changeset,
      on_conflict: [set: update_fields ++ [updated_at: now]],
      conflict_target: @commerce_link_conflict_target,
      returning: true
    )
  end

  @spec create_click_session(map()) ::
          {:ok, CommerceClickSession.t()} | {:error, Ecto.Changeset.t()}
  def create_click_session(attrs) do
    %CommerceClickSession{}
    |> CommerceClickSession.changeset(attrs)
    |> Repo.insert()
  end

  @spec track_outbound_click(map()) ::
          {:ok,
           %{
             commerce_link: CommerceLink.t(),
             click_session: CommerceClickSession.t(),
             redirect_path: String.t()
           }}
          | {:error, :merchant_product_not_found | Ecto.Changeset.t()}
  def track_outbound_click(attrs) do
    with {:ok, merchant_product_id} <- normalize_merchant_product_id(attrs),
         {:ok, destination} <- trusted_click_destination(merchant_product_id) do
      attrs
      |> Map.put(:merchant_product_id, merchant_product_id)
      |> persist_tracked_click(destination)
      |> unwrap_transaction()
    else
      :error -> {:error, :merchant_product_not_found}
      {:error, _reason} = error -> error
    end
  end

  @spec redirect_destination(String.t()) :: {:ok, String.t()} | {:error, :not_found}
  def redirect_destination(click_id) do
    with {:ok, cast_click_id} <- Ecto.UUID.cast(click_id),
         destination when is_map(destination) <- lookup_redirect_destination(cast_click_id),
         destination_url <- redirect_destination_url(destination),
         true <- CommerceLink.valid_destination_url?(destination_url) do
      {:ok, destination_url}
    else
      _not_found -> {:error, :not_found}
    end
  end

  defp lookup_redirect_destination(click_id) do
    Repo.one(
      from session in CommerceClickSession,
        join: link in assoc(session, :commerce_link),
        where: session.click_id == ^click_id and link.is_active == true,
        select: %{
          click_id: session.click_id,
          destination_url: link.destination_url,
          link_type: link.link_type,
          network: link.network
        },
        limit: 1
    )
  end

  defp normalize_merchant_product_id(attrs) do
    attrs
    |> Input.fetch_attr(:merchant_product_id)
    |> Input.normalize_integer_id()
  end

  defp trusted_click_destination(merchant_product_id) do
    case Repo.get_by(MerchantProduct, id: merchant_product_id, is_active: true) do
      %MerchantProduct{} = merchant_product ->
        {:ok, destination_from_merchant_product(merchant_product)}

      nil ->
        {:error, :merchant_product_not_found}
    end
  end

  defp destination_from_merchant_product(merchant_product) do
    case affiliate_link_for_merchant_product(merchant_product.id) do
      %AffiliateLink{} = affiliate_link ->
        affiliate_destination_or_fallback(affiliate_link, merchant_product)

      nil ->
        merchant_product_destination(merchant_product)
    end
  end

  defp affiliate_destination_or_fallback(affiliate_link, merchant_product) do
    affiliate_url = normalize_browser_accepted_destination_url(affiliate_link.affiliate_url)

    if CommerceLink.valid_destination_url?(affiliate_url) do
      %{
        destination_url: affiliate_url,
        affiliate_program_id: affiliate_program_id(affiliate_link, merchant_product),
        link_type: :affiliate,
        merchant_id: merchant_product.merchant_id,
        network: commerce_network(affiliate_link),
        backfilled_from_affiliate_links: true
      }
    else
      merchant_product_destination(merchant_product)
    end
  end

  defp merchant_product_destination(merchant_product) do
    %{
      destination_url: normalize_browser_accepted_destination_url(merchant_product.url),
      affiliate_program_id: nil,
      link_type: :non_affiliate,
      merchant_id: merchant_product.merchant_id,
      network: nil,
      backfilled_from_affiliate_links: false
    }
  end

  defp normalize_browser_accepted_destination_url(url) when is_binary(url) do
    url
    |> String.trim()
    |> String.replace("\\", "/")
    |> String.replace(" ", "%20")
  end

  defp normalize_browser_accepted_destination_url(url), do: url

  defp affiliate_link_for_merchant_product(merchant_product_id) do
    AffiliateLink
    |> Repo.get_by(merchant_product_id: merchant_product_id)
    |> Repo.preload(:affiliate_network)
  end

  defp affiliate_program_id(
         %AffiliateLink{affiliate_network_id: affiliate_network_id},
         %MerchantProduct{merchant_id: merchant_id}
       )
       when is_integer(affiliate_network_id) and is_integer(merchant_id) do
    case Repo.get_by(AffiliateProgram,
           affiliate_network_id: affiliate_network_id,
           merchant_id: merchant_id
         ) do
      %AffiliateProgram{id: affiliate_program_id} -> affiliate_program_id
      nil -> nil
    end
  end

  defp affiliate_program_id(_affiliate_link, _merchant_product), do: nil

  defp commerce_network(%AffiliateLink{affiliate_network: %{name: name}}) when is_binary(name) do
    name
    |> String.downcase()
    |> String.trim()
    |> then(&Map.get(@affiliate_network_names, &1))
  end

  defp commerce_network(_affiliate_link), do: nil

  defp redirect_destination_url(%{
         destination_url: destination_url,
         link_type: :affiliate,
         network: :impact,
         click_id: click_id
       }) do
    append_public_click_id(destination_url, click_id)
  end

  defp redirect_destination_url(%{destination_url: destination_url}), do: destination_url

  defp append_public_click_id(destination_url, click_id) do
    uri = URI.parse(destination_url)
    query = uri.query || ""

    if has_click_id_query_param?(query) do
      destination_url
    else
      %{uri | query: append_click_id_query_param(query, click_id)}
      |> URI.to_string()
    end
  end

  defp has_click_id_query_param?(query) do
    query
    |> URI.decode_query()
    |> Map.keys()
    |> Enum.any?(&MapSet.member?(@click_id_query_keys, &1))
  end

  defp append_click_id_query_param("", click_id), do: URI.encode_query(%{"ClickId" => click_id})

  defp append_click_id_query_param(query, click_id),
    do: query <> "&" <> URI.encode_query(%{"ClickId" => click_id})

  defp persist_tracked_click(attrs, destination) do
    Repo.transaction(fn ->
      with {:ok, commerce_link} <- upsert_commerce_link(tracked_commerce_link_attrs(destination)),
           :ok <- ensure_commerce_link_active(commerce_link),
           {:ok, click_session} <-
             create_click_session(click_session_attrs(attrs, commerce_link.id)) do
        %{
          commerce_link: commerce_link,
          click_session: click_session,
          redirect_path: "/r/#{click_session.click_id}"
        }
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end

  defp unwrap_transaction({:ok, tracked_click}), do: {:ok, tracked_click}
  defp unwrap_transaction({:error, reason}), do: {:error, reason}

  defp tracked_commerce_link_attrs(destination) do
    destination
    |> commerce_link_attrs()
    |> Map.delete(:is_active)
    |> drop_nil_tracked_network()
  end

  defp drop_nil_tracked_network(%{network: nil} = attrs), do: Map.delete(attrs, :network)
  defp drop_nil_tracked_network(attrs), do: attrs

  defp ensure_commerce_link_active(%CommerceLink{is_active: true}), do: :ok

  defp ensure_commerce_link_active(%CommerceLink{is_active: false}),
    do: {:error, :merchant_product_not_found}

  defp commerce_link_attrs(destination) do
    %{
      merchant_id: destination.merchant_id,
      affiliate_program_id: destination.affiliate_program_id,
      destination_url: destination.destination_url,
      link_type: destination.link_type,
      network: destination.network,
      backfilled_from_affiliate_links: destination.backfilled_from_affiliate_links,
      is_active: true
    }
  end

  defp click_session_attrs(attrs, commerce_link_id) do
    attrs
    |> take_click_session_attrs()
    |> Map.put(:commerce_link_id, commerce_link_id)
    |> Map.put_new(:source_surface, :web)
  end

  defp take_click_session_attrs(attrs) do
    Enum.reduce(
      [
        :user_id,
        :merchant_product_id,
        :anonymous_id,
        :source_surface,
        :referrer,
        :user_agent_hash,
        :ip_hash
      ],
      %{},
      fn field, acc ->
        case Input.fetch_attr(attrs, field) do
          nil -> acc
          value -> Map.put(acc, field, value)
        end
      end
    )
  end

  defp present_upsert_fields(attrs, changeset, fields) do
    for field <- fields,
        Input.attr_key_present?(attrs, field),
        do: {field, Ecto.Changeset.get_field(changeset, field)}
  end
end
