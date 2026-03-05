defmodule ProductCompareWeb.Plugs.PutAbsintheContext do
  @moduledoc """
  Injects per-request authentication assigns into Absinthe context.
  """

  @behaviour Plug

  @impl Plug
  def init(opts), do: opts

  @impl Plug
  def call(conn, _opts) do
    context =
      conn.assigns
      |> Map.take([:current_user, :api_token])
      |> Enum.reject(fn {_key, value} -> is_nil(value) end)
      |> Map.new()

    Absinthe.Plug.put_options(conn, context: context)
  end
end
