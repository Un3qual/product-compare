defmodule ProductCompare.WorkQueue.ValidatorTest do
  use ExUnit.Case, async: true

  alias ProductCompare.WorkQueue.Validator

  test "accepts three or more complete ready implementation rows" do
    assert {:ok, %{ready_count: 4}} = Validator.validate(queue_with_rows(4))
  end

  test "rejects fewer than three ready rows" do
    assert {:error, errors} = Validator.validate(queue_with_rows(2))
    assert "Ready Work requires at least 3 complete rows; found 2" in errors
  end

  test "rejects incomplete dispatch contracts" do
    markdown =
      queue_with_rows(3)
      |> String.replace("Prerequisites:\n- None.\n", "", global: false)

    assert {:error, errors} = Validator.validate(markdown)
    assert Enum.any?(errors, &String.contains?(&1, "missing Prerequisites:"))
  end

  test "rejects required scalar fields with empty values" do
    for {field, populated_line} <- [
          {"Lane:", "Lane: Lane 1"},
          {"Plan:", "Plan: `docs/plans/candidate-1.md`"},
          {"Next action:", "Next action: Implement candidate 1."},
          {"Exit condition:", "Exit condition: Candidate 1 passes verification."}
        ] do
      markdown = String.replace(queue_with_rows(3), populated_line, field, global: false)

      assert {:error, errors} = Validator.validate(markdown)
      assert "ready row 1 has empty #{field}" in errors
    end
  end

  test "rejects required list fields without a non-empty item" do
    for {field, populated_section} <- [
          {"Owned paths:", "Owned paths:\n- `path/1`\n"},
          {"Prerequisites:", "Prerequisites:\n- None.\n"},
          {"Verification:", "Verification:\n- `mix test`\n"}
        ] do
      markdown =
        String.replace(queue_with_rows(3), populated_section, "#{field}\n", global: false)

      assert {:error, errors} = Validator.validate(markdown)
      assert "ready row 1 has no items under #{field}" in errors
    end
  end

  test "rejects empty-queue shortage language" do
    markdown = """
    # Work Dispatch Index

    ## Ready Work

    None. The plan catalog contains no additional validated candidate.

    ## Active Work
    """

    assert {:error, errors} = Validator.validate(markdown)
    assert Enum.any?(errors, &String.contains?(&1, "empty-state language"))
  end

  defp queue_with_rows(count) do
    rows =
      1..count
      |> Enum.map_join("\n", fn index ->
        """
        ### #{index}. Candidate #{index}

        Status: ready
        Lane: Lane #{index}
        Plan: `docs/plans/candidate-#{index}.md`
        Next action: Implement candidate #{index}.
        Owned paths:
        - `path/#{index}`
        Prerequisites:
        - None.
        Verification:
        - `mix test`
        Exit condition: Candidate #{index} passes verification.
        """
      end)

    """
    # Work Dispatch Index

    ## Ready Work

    #{rows}
    ## Active Work
    """
  end
end
