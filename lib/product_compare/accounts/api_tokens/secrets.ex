defmodule ProductCompare.Accounts.ApiTokens.Secrets do
  @moduledoc false

  @prefix_length 12
  @secret_bytes 32

  @spec generate() :: String.t()
  def generate do
    @secret_bytes
    |> :crypto.strong_rand_bytes()
    |> Base.url_encode64(padding: false)
  end

  @spec hash(String.t()) :: binary()
  def hash(plain_text_token), do: :crypto.hash(:sha3_256, plain_text_token)

  @spec prefix(binary()) :: String.t()
  def prefix(token_hash) do
    token_hash
    |> Base.encode16(case: :lower)
    |> binary_part(0, @prefix_length)
  end
end
