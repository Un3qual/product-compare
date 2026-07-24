defmodule ProductCompare.CommerceAttribution.Clicks do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Input
  alias ProductCompare.CommerceAttribution.Clicks.Destinations
  alias ProductCompare.CommerceAttribution.Clicks.Links
  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.CommerceAttribution.CommerceLink

  @spec upsert_commerce_link(map()) :: {:ok, CommerceLink.t()} | {:error, Ecto.Changeset.t()}
  def upsert_commerce_link(attrs), do: Links.upsert(attrs)

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
         {:ok, destination} <- Destinations.for_merchant_product(merchant_product_id) do
      attrs
      |> Map.put(:merchant_product_id, merchant_product_id)
      |> persist_tracked_click(destination)
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

  defp redirect_destination_url(%{
         destination_url: destination_url,
         link_type: :affiliate,
         network: :impact,
         click_id: click_id
       }) do
    Destinations.append_public_click_id(destination_url, click_id)
  end

  defp redirect_destination_url(%{destination_url: destination_url}), do: destination_url

  defp persist_tracked_click(attrs, destination) do
    Repo.transaction(fn ->
      with {:ok, commerce_link} <- upsert_commerce_link(Links.tracked_attrs(destination)),
           :ok <- Links.ensure_active(commerce_link),
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
end
