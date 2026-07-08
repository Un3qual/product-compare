defmodule ProductCompareWeb.CommerceRedirectController do
  use ProductCompareWeb, :controller

  alias ProductCompare.CommerceAttribution
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.Plugs.RequireSameOrigin

  def show(conn, %{"click_id" => click_id}) do
    case CommerceAttribution.redirect_destination(click_id) do
      {:ok, destination_url} -> redirect(conn, external: destination_url)
      {:error, :not_found} -> send_resp(conn, :not_found, "redirect not found")
    end
  end

  def merchant_product(conn, %{"merchantProductId" => merchant_product_id}) do
    with true <- RequireSameOrigin.trusted_request_origin?(conn),
         {:ok, merchant_product_id} <-
           GlobalId.decode_integer(merchant_product_id, :merchant_product),
         {:ok, tracked_click} <-
           CommerceAttribution.track_outbound_click(%{
             merchant_product_id: merchant_product_id,
             source_surface: :web
           }),
         {:ok, destination_url} <-
           CommerceAttribution.redirect_destination(tracked_click.click_session.click_id) do
      redirect(conn, external: destination_url)
    else
      _error -> send_resp(conn, :not_found, "redirect not found")
    end
  end

  def merchant_product(conn, _params), do: send_resp(conn, :not_found, "redirect not found")
end
