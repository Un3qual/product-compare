defmodule ProductCompare.WorkQueue.Validator do
  @moduledoc false

  @minimum_ready_rows 3
  @required_markers [
    "Status:",
    "Lane:",
    "Plan:",
    "Batch outcome:",
    "Next action:",
    "Owned paths:",
    "Internal slices:",
    "Prerequisites:",
    "Verification:",
    "Exit condition:"
  ]
  @scalar_fields ["Lane", "Plan", "Batch outcome", "Next action", "Exit condition"]
  @list_fields ["Owned paths", "Internal slices", "Prerequisites", "Verification"]
  @field_names [
    "Status",
    "Lane",
    "Plan",
    "Batch outcome",
    "Next action",
    "Owned paths",
    "Internal slices",
    "Prerequisites",
    "Verification",
    "Exit condition"
  ]
  @empty_state_patterns [
    ~r/^None\./m,
    ~r/no (?:additional )?validated candidate/i,
    ~r/no ready (?:row|rows|work)/i,
    ~r/shortage of validated candidates/i
  ]

  @spec validate_file(Path.t()) ::
          {:ok, %{ready_count: pos_integer()}} | {:error, [String.t()]}
  def validate_file(path) do
    markdown = File.read!(path)

    validate_ready_section(markdown, fn rows ->
      plan_reference_errors(rows) ++ file_plan_errors(rows, path)
    end)
  end

  @spec validate(String.t()) ::
          {:ok, %{ready_count: pos_integer()}} | {:error, [String.t()]}
  def validate(markdown) when is_binary(markdown) do
    validate_ready_section(markdown, &plan_reference_errors/1)
  end

  defp validate_ready_section(markdown, additional_errors) do
    with {:ok, ready_section} <- ready_section(markdown) do
      rows = ready_rows(ready_section)

      errors =
        ready_count_errors(rows) ++
          incomplete_row_errors(rows) ++
          empty_state_errors(ready_section) ++
          additional_errors.(rows)

      case errors do
        [] -> {:ok, %{ready_count: length(rows)}}
        _ -> {:error, errors}
      end
    end
  end

  defp plan_reference_errors(rows) do
    rows
    |> Enum.with_index(1)
    |> Enum.flat_map(fn {row, index} ->
      case plan_path(row, index) do
        {:ok, _path} -> []
        {:error, error} -> [error]
        :missing -> []
      end
    end)
  end

  defp plan_path(row, index) do
    case Regex.run(~r/^Plan:[ \t]*(?<value>[^\r\n]*)$/m, row, capture: :all_names) do
      [value] when value != "" ->
        parse_plan_path(String.trim(value), index)

      [_empty] ->
        :missing

      nil ->
        :missing
    end
  end

  defp parse_plan_path(value, index) do
    case Regex.run(~r/^`(?<path>[^`]+)`$/, value, capture: :all_names) do
      [path] ->
        cond do
          ".." in Path.split(path) ->
            {:error, "ready row #{index} Plan: path cannot contain `..` traversal"}

          Path.type(path) == :relative and Regex.match?(~r{\Adocs/(?:[^/]+/)*[^/]+\.md\z}, path) ->
            {:ok, path}

          true ->
            invalid_plan_path(index)
        end

      _ ->
        invalid_plan_path(index)
    end
  end

  defp invalid_plan_path(index) do
    {:error, "ready row #{index} Plan: must be exactly one backticked `docs/**/*.md` path"}
  end

  defp file_plan_errors(rows, queue_path) do
    repository_root =
      queue_path
      |> Path.expand()
      |> Path.dirname()
      |> Path.join("../..")
      |> Path.expand()

    rows
    |> Enum.with_index(1)
    |> Enum.flat_map(fn {row, index} ->
      case plan_path(row, index) do
        {:ok, relative_path} ->
          validate_plan_file(repository_root, relative_path, index)

        _invalid_or_missing ->
          []
      end
    end)
  end

  defp validate_plan_file(repository_root, relative_path, index) do
    expanded_path = Path.expand(relative_path, repository_root)

    if contained_path?(expanded_path, repository_root) do
      case File.read(expanded_path) do
        {:ok, plan} -> plan_contract_errors(plan, relative_path, index)
        {:error, _reason} -> ["ready row #{index} Plan: file does not exist: #{relative_path}"]
      end
    else
      ["ready row #{index} Plan: path escapes the repository: #{relative_path}"]
    end
  end

  defp contained_path?(path, repository_root) do
    case Path.relative_to(path, repository_root) do
      ".." -> false
      "../" <> _rest -> false
      relative -> Path.type(relative) == :relative
    end
  end

  defp plan_contract_errors(plan, relative_path, index) do
    prefix = "ready row #{index} Plan: #{relative_path}"

    [
      {~r/^# .+Implementation Plan[ \t]*$/m, "#{prefix} is missing an implementation-plan H1"},
      {~r/^\*\*Goal:\*\*[ \t]*\S/m, "#{prefix} is missing **Goal:**"},
      {~r/^## Global Constraints[ \t]*$/m, "#{prefix} is missing ## Global Constraints"},
      {~r/^(?:##|###) Task(?:[ \t]+\d+)?(?:[ \t]*:|[ \t]+\S)/m,
       "#{prefix} is missing a Task heading"}
    ]
    |> Enum.flat_map(fn {pattern, error} ->
      if Regex.match?(pattern, plan), do: [], else: [error]
    end)
  end

  defp ready_section(markdown) do
    case Regex.run(~r/^## Ready Work\s*\n(?<body>.*?)(?=^## |\z)/ms, markdown,
           capture: :all_names
         ) do
      [body] -> {:ok, body}
      _ -> {:error, ["missing ## Ready Work section"]}
    end
  end

  defp ready_rows(section) do
    ~r/^### .+?\n(?<body>.*?)(?=^### |\z)/ms
    |> Regex.scan(section, capture: :all_names)
    |> List.flatten()
  end

  defp ready_count_errors(rows) when length(rows) >= @minimum_ready_rows, do: []

  defp ready_count_errors(rows) do
    ["Ready Work requires at least #{@minimum_ready_rows} complete rows; found #{length(rows)}"]
  end

  defp incomplete_row_errors(rows) do
    rows
    |> Enum.with_index(1)
    |> Enum.flat_map(fn {row, index} ->
      marker_errors =
        for marker <- @required_markers,
            not Regex.match?(~r/^#{Regex.escape(marker)}/m, row),
            do: "ready row #{index} is missing #{marker}"

      status_errors =
        if Regex.match?(~r/^Status: ready\s*$/m, row),
          do: [],
          else: ["ready row #{index} must contain `Status: ready`"]

      marker_errors ++ status_errors ++ field_content_errors(row, index)
    end)
  end

  defp field_content_errors(row, index) do
    scalar_field_errors(row, index) ++ list_field_errors(row, index)
  end

  defp scalar_field_errors(row, index) do
    Enum.flat_map(@scalar_fields, fn field ->
      pattern = ~r/^#{Regex.escape(field)}:[ \t]*(?<value>[^\r\n]*)$/m

      case Regex.run(pattern, row, capture: :all_names) do
        [value] ->
          if String.trim(value) == "",
            do: ["ready row #{index} has empty #{field}:"],
            else: []

        _ ->
          []
      end
    end)
  end

  defp list_field_errors(row, index) do
    boundary = Enum.map_join(@field_names, "|", &Regex.escape/1)

    Enum.flat_map(@list_fields, fn field ->
      pattern =
        Regex.compile!(
          "^#{Regex.escape(field)}:[ \\t]*\\r?\\n(?<body>.*?)(?=^(?:#{boundary}):|\\z)",
          "ms"
        )

      case Regex.run(pattern, row, capture: :all_names) do
        [body] ->
          if Regex.match?(~r/^[ \t]*-[ \t]+\S.*$/m, body),
            do: [],
            else: ["ready row #{index} has no items under #{field}:"]

        _ ->
          []
      end
    end)
  end

  defp empty_state_errors(section) do
    if Enum.any?(@empty_state_patterns, &Regex.match?(&1, section)) do
      ["Ready Work contains forbidden empty-state language"]
    else
      []
    end
  end
end
