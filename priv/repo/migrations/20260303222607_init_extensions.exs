defmodule ProductCompare.Repo.Migrations.InitExtensions do
  use Ecto.Migration

  def change do
    execute(
      """
      DO $$
      BEGIN
        IF current_setting('server_version_num')::int < 180000 THEN
          RAISE EXCEPTION 'PostgreSQL 18+ is required for uuidv7() support';
        END IF;
      END
      $$;
      """,
      "SELECT 1"
    )

    execute("CREATE EXTENSION IF NOT EXISTS citext", "DROP EXTENSION IF EXISTS citext")
  end
end
