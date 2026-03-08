defmodule ProductCompareWeb.PreflightController do
  use ProductCompareWeb, :controller

  def options(conn, _params) do
    send_resp(conn, :no_content, "")
  end
end
