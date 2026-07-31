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

  test "rejects terminal work records anywhere in the live queue" do
    markdown =
      queue_with_rows(3) <>
        """

        ## Completed Work

        ### Historical batch

        Status: complete
        """

    assert {:error, errors} = Validator.validate(markdown)
    assert "live queue contains terminal work status `complete`" in errors
  end

  test "rejects completion history appended to a ready row" do
    markdown =
      String.replace(
        queue_with_rows(3),
        "Exit condition: Candidate 3 passes verification.\n",
        """
        Exit condition: Candidate 3 passes verification.

        Candidate 3 completed last week and remains here as historical evidence.
        """
      )

    assert {:error, errors} = Validator.validate(markdown)
    assert "ready row 3 contains content after its Exit condition" in errors
  end

  test "requires one backticked repository-relative docs plan path per ready row" do
    cases = [
      {"Plan: docs/plans/candidate-1.md",
       "ready row 1 Plan: must be exactly one backticked `docs/**/*.md` path"},
      {"Plan: `/docs/plans/candidate-1.md`",
       "ready row 1 Plan: must be exactly one backticked `docs/**/*.md` path"},
      {"Plan: `docs/plans/../../outside.md`",
       "ready row 1 Plan: path cannot contain `..` traversal"},
      {"Plan: `docs/plans/candidate-1.md` `docs/plans/other.md`",
       "ready row 1 Plan: must be exactly one backticked `docs/**/*.md` path"}
    ]

    for {invalid_line, expected_error} <- cases do
      markdown =
        String.replace(
          queue_with_rows(3),
          "Plan: `docs/plans/candidate-1.md`",
          invalid_line,
          global: false
        )

      assert {:error, errors} = Validator.validate(markdown)
      assert expected_error in errors
    end
  end

  test "rejects duplicate Plan fields in one ready row" do
    markdown =
      String.replace(
        queue_with_rows(3),
        "Plan: `docs/plans/candidate-1.md`",
        """
        Plan: `docs/plans/candidate-1.md`
        Plan: `docs/plans/candidate-duplicate.md`
        """,
        global: false
      )

    assert {:error, errors} = Validator.validate(markdown)

    assert "ready row 1 Plan: must be exactly one backticked `docs/**/*.md` path" in errors
  end

  @tag :tmp_dir
  test "file-backed validation accepts repository-contained executable plans", %{tmp_dir: tmp_dir} do
    queue_path = write_repository(tmp_dir, queue_with_rows(3))

    assert {:ok, %{ready_count: 3}} = Validator.validate_file(queue_path, tmp_dir)
  end

  @tag :tmp_dir
  test "file-backed validation resolves plans from an explicit repository root", %{
    tmp_dir: tmp_dir
  } do
    queue_path =
      write_repository(tmp_dir, queue_with_rows(3), queue_path: "review-inputs/queue.md")

    assert {:ok, %{ready_count: 3}} = Validator.validate_file(queue_path, tmp_dir)
  end

  @tag :tmp_dir
  test "file-backed validation reports missing plans in ready-row order", %{tmp_dir: tmp_dir} do
    queue_path = write_repository(tmp_dir, queue_with_rows(3), skip_plans: [1, 3])

    assert {:error, errors} = Validator.validate_file(queue_path, tmp_dir)

    assert errors == [
             "ready row 1 Plan: file does not exist: docs/plans/candidate-1.md",
             "ready row 3 Plan: file does not exist: docs/plans/candidate-3.md"
           ]
  end

  @tag :tmp_dir
  test "file-backed validation reports incomplete plan contracts", %{tmp_dir: tmp_dir} do
    queue_path =
      write_repository(tmp_dir, queue_with_rows(3),
        plan_overrides: %{2 => "# Candidate 2 Notes\n"}
      )

    assert {:error, errors} = Validator.validate_file(queue_path, tmp_dir)

    assert errors == [
             "ready row 2 Plan: docs/plans/candidate-2.md is missing an implementation-plan H1",
             "ready row 2 Plan: docs/plans/candidate-2.md is missing **Goal:**",
             "ready row 2 Plan: docs/plans/candidate-2.md is missing ## Global Constraints",
             "ready row 2 Plan: docs/plans/candidate-2.md is missing a Task heading"
           ]
  end

  @tag :tmp_dir
  test "file-backed validation rejects plan symlinks that escape the repository", %{
    tmp_dir: tmp_dir
  } do
    repository_root = Path.join(tmp_dir, "repository")
    queue_path = write_repository(repository_root, queue_with_rows(3))
    external_plan_path = Path.join(tmp_dir, "external-plan.md")
    linked_plan_path = Path.join(repository_root, "docs/plans/candidate-1.md")

    File.write!(external_plan_path, valid_plan(1))
    File.rm!(linked_plan_path)
    File.ln_s!(external_plan_path, linked_plan_path)

    assert {:error, errors} = Validator.validate_file(queue_path, repository_root)

    assert errors == [
             "ready row 1 Plan: path escapes the repository: docs/plans/candidate-1.md"
           ]
  end

  @tag :tmp_dir
  test "pure validation never reads referenced plan files", %{tmp_dir: tmp_dir} do
    queue_path = write_repository(tmp_dir, queue_with_rows(3), skip_plans: [1, 2, 3])
    markdown = File.read!(queue_path)

    assert {:ok, %{ready_count: 3}} = Validator.validate(markdown)
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

  defp write_repository(tmp_dir, queue, opts \\ []) do
    queue_path = Path.join(tmp_dir, Keyword.get(opts, :queue_path, "docs/work/index.md"))
    File.mkdir_p!(Path.dirname(queue_path))
    File.write!(queue_path, queue)

    skipped = Keyword.get(opts, :skip_plans, [])
    overrides = Keyword.get(opts, :plan_overrides, %{})

    for index <- 1..3, index not in skipped do
      plan_path = Path.join(tmp_dir, "docs/plans/candidate-#{index}.md")
      File.mkdir_p!(Path.dirname(plan_path))
      File.write!(plan_path, Map.get(overrides, index, valid_plan(index)))
    end

    queue_path
  end

  defp valid_plan(index) do
    """
    # Candidate #{index} Implementation Plan

    **Goal:** Ship candidate #{index}.

    ## Global Constraints

    - Preserve existing behavior.

    ## Task 1: Implement Candidate #{index}

    - [ ] Complete the candidate.
    """
  end
end
