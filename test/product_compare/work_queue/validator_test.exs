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

  test "requires a shippable batch outcome and at least one internal slice" do
    without_outcome =
      String.replace(
        queue_with_rows(3),
        "Batch outcome: Candidate 1 ships a reviewer-sized outcome.\n",
        "",
        global: false
      )

    assert {:error, outcome_errors} = Validator.validate(without_outcome)
    assert "ready row 1 is missing Batch outcome:" in outcome_errors

    without_slices =
      String.replace(
        queue_with_rows(3),
        "Internal slices:\n- Slice 1.\n",
        "Internal slices:\n",
        global: false
      )

    assert {:error, slice_errors} = Validator.validate(without_slices)
    assert "ready row 1 has no items under Internal slices:" in slice_errors
  end

  test "rejects required scalar fields with empty values" do
    for {field, populated_line} <- [
          {"Lane:", "Lane: Lane 1"},
          {"Plan:", "Plan: `docs/plans/candidate-1.md`"},
          {"Batch outcome:", "Batch outcome: Candidate 1 ships a reviewer-sized outcome."},
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
          {"Internal slices:", "Internal slices:\n- Slice 1.\n"},
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
        Batch outcome: Candidate #{index} ships a reviewer-sized outcome.
        Next action: Implement candidate #{index}.
        Owned paths:
        - `path/#{index}`
        Internal slices:
        - Slice #{index}.
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
