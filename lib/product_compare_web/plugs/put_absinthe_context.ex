defmodule ProductCompareWeb.Plugs.PutAbsintheContext do
  @moduledoc """
  Injects per-request authentication assigns into Absinthe context.
  """

  @behaviour Plug

  @impl Plug
  @spec init(term()) :: term()
  def init(opts), do: opts

  @impl Plug
  @spec call(Plug.Conn.t(), term()) :: Plug.Conn.t()
  def call(conn, _opts) do
    context =
      conn.assigns
      |> Map.take([:current_user, :api_token])
      |> Enum.reject(fn {_key, value} -> is_nil(value) end)
      |> Map.new()

    Absinthe.Plug.put_options(conn, context: context)
  end
end
