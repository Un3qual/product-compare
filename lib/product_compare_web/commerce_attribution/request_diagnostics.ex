defmodule ProductCompareWeb.CommerceAttribution.RequestDiagnostics do
  @moduledoc false

  import Plug.Conn, only: [get_req_header: 2]

  @spec from_conn(Plug.Conn.t()) :: %{
          optional(:referrer) => String.t(),
          optional(:user_agent) => String.t(),
          optional(:ip_address) => String.t()
        }
  def from_conn(conn) do
    %{
      referrer: conn |> get_req_header("referer") |> List.first(),
      user_agent: conn |> get_req_header("user-agent") |> List.first(),
      ip_address: format_ip(conn.remote_ip)
    }
    |> Enum.reject(fn {_field, value} -> is_nil(value) end)
    |> Map.new()
  end

  defp format_ip(nil), do: nil
  defp format_ip(remote_ip), do: remote_ip |> :inet.ntoa() |> to_string()
end
