defmodule ProductCompare.CommerceAttribution.Clicks.Sessions do
  @moduledoc false

  alias ProductCompare.CommerceAttribution.Clicks.Destinations
  alias ProductCompare.CommerceAttribution.Clicks.Links
  alias ProductCompare.CommerceAttribution.Visitors
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
           {:ok, actor_attrs} <- actor_attrs(attrs),
           {:ok, click_session} <-
             create(attrs |> click_session_attrs(commerce_link.id) |> Map.merge(actor_attrs)) do
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
        :merchant_product_id,
        :source_surface,
        :referrer,
        :user_agent,
        :ip_address
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

  defp actor_attrs(attrs) do
    case Input.fetch_attr(attrs, :user_id) do
      user_id when is_integer(user_id) ->
        {:ok, %{user_id: user_id}}

      _no_user ->
        anonymous_visitor_attrs(Input.fetch_attr(attrs, :anonymous_visitor_entropy_id))
    end
  end

  defp anonymous_visitor_attrs(entropy_id) when is_binary(entropy_id) do
    case Visitors.get_or_create(entropy_id) do
      {:ok, visitor} -> {:ok, %{anonymous_visitor_id: visitor.id}}
      {:error, changeset} -> {:error, changeset}
    end
  end

  defp anonymous_visitor_attrs(_entropy_id), do: {:ok, %{}}
end
