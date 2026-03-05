defmodule ProductCompareWeb.Plugs.EnforceNoStoreGraphqlCache do
  @moduledoc """
  Forces GraphQL responses to be non-cacheable because token mutations can return
  one-time plaintext secrets.
  """

  @behaviour Plug

  @cache_control "no-store, private, max-age=0"

  @impl Plug
  @spec init(term()) :: term()
  def init(opts), do: opts

  @impl Plug
  @spec call(Plug.Conn.t(), term()) :: Plug.Conn.t()
  def call(conn, _opts) do
    Plug.Conn.register_before_send(conn, fn conn ->
      conn
      |> Plug.Conn.put_resp_header("cache-control", @cache_control)
      |> Plug.Conn.put_resp_header("pragma", "no-cache")
      |> Plug.Conn.put_resp_header("expires", "0")
    end)
  end
end
