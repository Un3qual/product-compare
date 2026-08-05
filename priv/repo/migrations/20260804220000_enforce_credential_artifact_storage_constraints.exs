defmodule ProductCompare.Repo.Migrations.EnforceCredentialArtifactStorageConstraints do
  use Ecto.Migration

  def up do
    drop constraint(:api_tokens, :api_tokens_prefix_not_empty)

    create constraint(:api_tokens, :api_tokens_prefix_length_check,
             check: "char_length(token_prefix) BETWEEN 1 AND 32"
           )

    create constraint(:api_tokens, :api_tokens_label_length_check,
             check: "label IS NULL OR char_length(label) <= 120"
           )

    create constraint(:users_tokens, :users_tokens_hash_length_check,
             check: "octet_length(token_hash) = 32"
           )
  end

  def down do
    drop constraint(:users_tokens, :users_tokens_hash_length_check)
    drop constraint(:api_tokens, :api_tokens_label_length_check)
    drop constraint(:api_tokens, :api_tokens_prefix_length_check)

    create constraint(:api_tokens, :api_tokens_prefix_not_empty,
             check: "char_length(token_prefix) > 0"
           )
  end
end
