defmodule ProductCompareWeb.CommerceRedirectController do
  use ProductCompareWeb, :controller

  alias ProductCompare.CommerceAttribution
  alias ProductCompareWeb.CommerceAttribution.RequestDiagnostics
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.Plugs.RequireSameOrigin

  def show(conn, %{"click_id" => click_id}) do
    case CommerceAttribution.redirect_destination(click_id) do
      {:ok, destination_url} -> redirect(conn, external: destination_url)
      {:error, :not_found} -> send_resp(conn, :not_found, "redirect not found")
    end
  end

  def merchant_product(conn, %{"merchantProductId" => merchant_product_id}) do
    with true <- trusted_or_direct_navigation?(conn),
         {:ok, merchant_product_id} <-
           GlobalId.decode_integer(merchant_product_id, :merchant_product),
         {:ok, tracked_click} <-
           CommerceAttribution.track_outbound_click(
             conn
             |> RequestDiagnostics.from_conn()
             |> Map.merge(%{
               merchant_product_id: merchant_product_id,
               source_surface: :web,
               user_id: current_user_id(conn)
             })
           ),
         {:ok, destination_url} <-
           CommerceAttribution.redirect_destination(tracked_click.click_session.click_id) do
      redirect(conn, external: destination_url)
    else
      _error -> send_resp(conn, :not_found, "redirect not found")
    end
  end

  def merchant_product(conn, _params), do: send_resp(conn, :not_found, "redirect not found")

  defp trusted_or_direct_navigation?(conn) do
    case RequireSameOrigin.request_origin(conn) do
      nil -> true
      _origin -> RequireSameOrigin.trusted_request_origin?(conn)
    end
  end

  defp current_user_id(%{assigns: %{current_user: %{id: id}}}) when is_integer(id), do: id
  defp current_user_id(_conn), do: nil
end
