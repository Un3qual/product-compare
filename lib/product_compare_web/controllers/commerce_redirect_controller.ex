defmodule ProductCompareWeb.CommerceRedirectController do
  use ProductCompareWeb, :controller

  alias ProductCompare.CommerceAttribution

  def show(conn, %{"click_id" => click_id}) do
    case CommerceAttribution.redirect_destination(click_id) do
      {:ok, destination_url} -> redirect(conn, external: destination_url)
      {:error, :not_found} -> send_resp(conn, :not_found, "redirect not found")
    end
  end
end
