defmodule ProductCompare.CommerceAttribution.Clicks do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.CommerceAttribution.Clicks.Destinations
  alias ProductCompare.CommerceAttribution.Clicks.Links
  alias ProductCompare.CommerceAttribution.Clicks.Sessions
  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.CommerceAttribution.CommerceLink

  @spec upsert_commerce_link(map()) :: {:ok, CommerceLink.t()} | {:error, Ecto.Changeset.t()}
  def upsert_commerce_link(attrs), do: Links.upsert(attrs)

  @spec create_click_session(map()) ::
          {:ok, CommerceClickSession.t()} | {:error, Ecto.Changeset.t()}
  def create_click_session(attrs), do: Sessions.create(attrs)

  @spec track_outbound_click(map()) ::
          {:ok,
           %{
             commerce_link: CommerceLink.t(),
             click_session: CommerceClickSession.t(),
             redirect_path: String.t()
           }}
          | {:error, :merchant_product_not_found | Ecto.Changeset.t()}
  def track_outbound_click(attrs), do: Sessions.track_outbound(attrs)

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

  defp redirect_destination_url(%{
         destination_url: destination_url,
         link_type: :affiliate,
         network: :impact,
         click_id: click_id
       }) do
    Destinations.append_public_click_id(destination_url, click_id)
  end

  defp redirect_destination_url(%{destination_url: destination_url}), do: destination_url
end
