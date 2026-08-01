defmodule ProductCompare.DevSeeds.Support do
  @moduledoc false

  @unobserved_watch_entropy_id "d3ca0000-0000-4000-8000-000000000004"

  @spec unobserved_watch_entropy_id() :: Ecto.UUID.t()
  def unobserved_watch_entropy_id, do: @unobserved_watch_entropy_id

  @spec expect!({:ok, value} | {:error, term()}, String.t()) :: value when value: var
  def expect!({:ok, value}, _stage), do: value

  def expect!({:error, reason}, stage) do
    raise "development seed #{stage} failed: #{format_reason(reason)}"
  end

  @spec capture_token!(((String.t() -> :ok) -> :ok)) :: String.t()
  def capture_token!(delivery) when is_function(delivery, 1) do
    receiver = self()
    reference = make_ref()

    :ok =
      delivery.(fn token ->
        send(receiver, {reference, token})
        :ok
      end)

    receive do
      {^reference, token} when is_binary(token) -> token
    after
      1_000 -> raise "development seed token callback did not return a token"
    end
  end

  defp format_reason(%Ecto.Changeset{} = changeset), do: inspect(changeset.errors)
  defp format_reason(reason), do: inspect(reason)
end
