defmodule ProductCompareWeb.Plugs.PutAbsintheContext do
  @moduledoc """
  Injects per-request authentication assigns into Absinthe context.
  """

  import Plug.Conn, only: [get_session: 2]

  alias ProductCompareWeb.Plugs.RequireSameOrigin

  @behaviour Plug

  @impl Plug
  @spec init(term()) :: term()
  def init(opts), do: opts

  @impl Plug
  @spec call(Plug.Conn.t(), term()) :: Plug.Conn.t()
  def call(conn, _opts) do
    auth_context =
      conn.assigns
      |> Map.take([:current_user, :api_token])
      |> Enum.reject(fn {_key, value} -> is_nil(value) end)
      |> Map.new()

    context =
      Map.merge(auth_context, %{
        session_user_token: get_session(conn, :user_token),
        trusted_request_origin?: RequireSameOrigin.trusted_request_origin?(conn)
      })

    Absinthe.Plug.put_options(conn, context: context)
  end
end
