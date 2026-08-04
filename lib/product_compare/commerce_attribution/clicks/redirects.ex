defmodule ProductCompare.CommerceAttribution.Clicks.Redirects do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.CommerceAttribution.Clicks.Destinations
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.Affiliate.AffiliateProgram
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.CommerceAttribution.CommerceLink

  @spec destination(String.t()) :: {:ok, String.t()} | {:error, :not_found}
  def destination(click_id) do
    with {:ok, cast_click_id} <- Ecto.UUID.cast(click_id),
         destination when is_map(destination) <- lookup_destination(cast_click_id),
         destination_url <- destination_url(destination),
         true <- CommerceLink.valid_destination_url?(destination_url) do
      {:ok, destination_url}
    else
      _not_found -> {:error, :not_found}
    end
  end

  defp lookup_destination(click_id) do
    Repo.one(
      from session in CommerceClickSession,
        join: link in assoc(session, :commerce_link),
        left_join: program in AffiliateProgram,
        on: program.id == link.affiliate_program_id,
        left_join: network in AffiliateNetwork,
        on: network.id == program.affiliate_network_id,
        where: session.click_id == ^click_id and link.is_active == true,
        select: %{
          click_id: session.click_id,
          destination_url: link.destination_url,
          link_type: link.link_type,
          network: network.code
        },
        limit: 1
    )
  end

  defp destination_url(%{
         destination_url: destination_url,
         link_type: :affiliate,
         network: network,
         click_id: click_id
       }) do
    Destinations.put_public_click_reference(destination_url, network, click_id)
  end

  defp destination_url(%{destination_url: destination_url}), do: destination_url
end
