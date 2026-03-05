defmodule ProductCompare.Repo.Migrations.EnforceApiTokensHashLength do
  use Ecto.Migration

  def up do
    create constraint(:api_tokens, :api_tokens_hash_length_check,
             check: "octet_length(token_hash) = 32"
           )
  end

  def down do
    drop constraint(:api_tokens, :api_tokens_hash_length_check)
  end
end
