defmodule ProductCompare.CommerceAttribution.Clicks.Sessions do
  @moduledoc false

  alias ProductCompare.CommerceAttribution.Clicks.Destinations
  alias ProductCompare.CommerceAttribution.Clicks.Links
  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession

  @spec create(map()) :: {:ok, CommerceClickSession.t()} | {:error, Ecto.Changeset.t()}
  def create(attrs) do
    %CommerceClickSession{}
    |> CommerceClickSession.changeset(attrs)
    |> Repo.insert()
  end

  @spec track_outbound(map()) ::
          {:ok,
           %{
             commerce_link: ProductCompareSchemas.CommerceAttribution.CommerceLink.t(),
             click_session: CommerceClickSession.t(),
             redirect_path: String.t()
           }}
          | {:error, :merchant_product_not_found | Ecto.Changeset.t()}
  def track_outbound(attrs) do
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

  defp normalize_merchant_product_id(attrs) do
    attrs |> Input.fetch_attr(:merchant_product_id) |> Input.normalize_integer_id()
  end

  defp persist_tracked_click(attrs, destination) do
    Repo.transaction(fn ->
      with {:ok, commerce_link} <- Links.upsert(Links.tracked_attrs(destination)),
           :ok <- Links.ensure_active(commerce_link),
           {:ok, click_session} <- create(click_session_attrs(attrs, commerce_link.id)) do
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
