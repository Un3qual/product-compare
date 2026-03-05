defmodule ProductCompare.Repo.Migrations.BackfillApiTokenPrefixes do
  use Ecto.Migration

  def up do
    execute("""
    UPDATE api_tokens
    SET token_prefix = SUBSTRING(encode(token_hash, 'hex') FROM 1 FOR 12)
    WHERE token_hash IS NOT NULL
    """)
  end

  def down do
    :ok
  end
end
