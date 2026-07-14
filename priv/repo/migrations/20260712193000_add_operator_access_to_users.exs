defmodule ProductCompare.Repo.Migrations.AddOperatorAccessToUsers do
  use Ecto.Migration

  @operator_ids_env "PRODUCT_COMPARE_OPERATOR_USER_IDS"
  @max_bigint 9_223_372_036_854_775_807

  def up do
    alter table(:users) do
      add :is_operator, :boolean, null: false, default: false
    end

    flush()
    execute(&apply_explicit_legacy_operator_decision/0)
  end

  def down do
    alter table(:users) do
      remove :is_operator
    end
  end

  defp apply_explicit_legacy_operator_decision do
    users = qualified_table("users")

    if legacy_staff_email_exists?(users) do
      operator_ids = explicit_operator_ids!()
      promote_exact_operator_ids!(operator_ids, users)
    end
  end

  defp legacy_staff_email_exists?(users) do
    %{num_rows: num_rows} =
      repo().query!("""
      SELECT 1
      FROM #{users}
      WHERE email IN ('admin@example.com', 'moderator@example.com')
      LIMIT 1
      """)

    num_rows == 1
  end

  defp explicit_operator_ids! do
    case System.get_env(@operator_ids_env) do
      "none" ->
        []

      value when is_binary(value) ->
        parse_operator_ids!(value)

      nil ->
        raise """
        #{@operator_ids_env} is required because legacy admin@example.com or
        moderator@example.com rows exist. Inspect account ownership, then set it
        to a comma-separated list of positive user IDs to promote, or to the
        literal none to acknowledge that no legacy account should be promoted.
        """
    end
  end

  defp parse_operator_ids!(value) do
    if Regex.match?(~r/\A[1-9][0-9]*(?:,[1-9][0-9]*)*\z/, value) do
      ids = value |> String.split(",") |> Enum.map(&String.to_integer/1)

      if Enum.uniq(ids) == ids and Enum.all?(ids, &(&1 <= @max_bigint)) do
        ids
      else
        invalid_operator_ids!(value)
      end
    else
      invalid_operator_ids!(value)
    end
  end

  defp invalid_operator_ids!(value) do
    raise """
    Invalid #{@operator_ids_env}=#{inspect(value)}. Use the literal none or a
    canonical comma-separated list of unique positive PostgreSQL bigint user
    IDs with no whitespace (for example: 12,34).
    """
  end

  defp promote_exact_operator_ids!([], _users), do: :ok

  defp promote_exact_operator_ids!(operator_ids, users) do
    %{rows: rows} =
      repo().query!(
        """
        UPDATE #{users}
        SET is_operator = TRUE
        WHERE id = ANY($1::bigint[])
        RETURNING id
        """,
        [operator_ids]
      )

    promoted_ids = rows |> List.flatten() |> Enum.sort()
    requested_ids = Enum.sort(operator_ids)

    if promoted_ids != requested_ids do
      missing_ids = requested_ids -- promoted_ids

      raise """
      #{@operator_ids_env} selected user IDs that do not exist: #{Enum.join(missing_ids, ",")}.
      Inspect the target database and retry with existing user IDs, or use none.
      """
    end
  end

  defp qualified_table(table) do
    case prefix() do
      nil -> quote_identifier(table)
      prefix -> "#{quote_identifier(prefix)}.#{quote_identifier(table)}"
    end
  end

  defp quote_identifier(identifier) do
    escaped = String.replace(identifier, "\"", "\"\"")
    "\"#{escaped}\""
  end
end
