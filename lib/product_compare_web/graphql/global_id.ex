defmodule ProductCompareWeb.GraphQL.GlobalId do
  @moduledoc false

  @type_names %{
    user: "User",
    api_token: "ApiToken"
  }
  @type_atoms Map.new(@type_names, fn {type_atom, type_name} -> {type_name, type_atom} end)

  @spec encode(:user | :api_token, String.t()) :: String.t()
  def encode(type, local_id) when is_binary(local_id) do
    type_name = Map.fetch!(@type_names, type)
    Base.encode64("#{type_name}:#{local_id}")
  end

  @spec decode(String.t()) :: {:ok, {:user | :api_token, String.t()}} | :error
  def decode(global_id) when is_binary(global_id) do
    with {:ok, decoded_id} <- Base.decode64(global_id),
         [type_name, local_id] <- String.split(decoded_id, ":", parts: 2),
         true <- local_id != "",
         {:ok, type_atom} <- Map.fetch(@type_atoms, type_name) do
      {:ok, {type_atom, local_id}}
    else
      _ -> :error
    end
  end

  def decode(_global_id), do: :error
end
