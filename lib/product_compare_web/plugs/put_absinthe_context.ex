defmodule ProductCompareWeb.Plugs.PutAbsintheContext do
  @moduledoc """
  Injects per-request authentication assigns into Absinthe context.
  """

  import Plug.Conn, only: [get_session: 2]

  alias ProductCompareWeb.GraphQL.Loader
  alias ProductCompareWeb.CommerceAttribution.RequestDiagnostics
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

    base_context =
      Map.merge(auth_context, %{
        anonymous_visitor_entropy_id: conn.assigns[:anonymous_visitor_entropy_id],
        graphql_observed_at: DateTime.utc_now(),
        session_user_token: get_session(conn, :user_token),
        trusted_request_origin?: RequireSameOrigin.trusted_request_origin?(conn),
        request_diagnostics: RequestDiagnostics.from_conn(conn)
      })

    context = Map.put(base_context, :loader, Loader.new(base_context))

    Absinthe.Plug.put_options(conn, context: context)
  end
end
