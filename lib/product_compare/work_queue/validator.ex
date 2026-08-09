defmodule ProductCompare.WorkQueue.Validator do
  @moduledoc false

  @minimum_ready_rows 3
  @ready_floor_exception_fields ["Reason", "Rejected split", "Replenishment action"]
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

  @spec validate_file(Path.t(), Path.t()) ::
          {:ok, %{ready_count: non_neg_integer()}} | {:error, [String.t()]}
  def validate_file(path, repository_root) do
    markdown = File.read!(path)

    validate_ready_section(markdown, fn rows ->
      plan_reference_errors(rows) ++ file_plan_errors(rows, repository_root)
    end)
  end

  @spec validate(String.t()) ::
          {:ok, %{ready_count: non_neg_integer()}} | {:error, [String.t()]}
  def validate(markdown) when is_binary(markdown) do
    validate_ready_section(markdown, &plan_reference_errors/1)
  end

  defp validate_ready_section(markdown, additional_errors) do
    with {:ok, ready_section} <- ready_section(markdown) do
      rows = ready_rows(ready_section)
      ready_floor_exception = ready_floor_exception(markdown)

      errors =
        terminal_status_errors(markdown) ++
          ready_count_errors(ready_floor_exception, rows) ++
          incomplete_row_errors(rows) ++
          trailing_row_content_errors(rows) ++
          empty_state_errors(ready_floor_exception, ready_section, rows) ++
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
    case Regex.scan(~r/^Plan:[ \t]*(?<value>[^\r\n]*)$/m, row, capture: :all_names) do
      [[value]] when value != "" ->
        parse_plan_path(String.trim(value), index)

      [[_empty]] ->
        :missing

      [] ->
        :missing

      _multiple ->
        invalid_plan_path(index)
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

  defp file_plan_errors(rows, repository_root) do
    repository_root = Path.expand(repository_root)

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
    case Path.safe_relative(relative_path, repository_root) do
      {:ok, safe_relative_path} ->
        case File.read(Path.join(repository_root, safe_relative_path)) do
          {:ok, plan} -> plan_contract_errors(plan, relative_path, index)
          {:error, _reason} -> ["ready row #{index} Plan: file does not exist: #{relative_path}"]
        end

      :error ->
        ["ready row #{index} Plan: path escapes the repository: #{relative_path}"]
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
    |> Enum.reject(fn {pattern, _error} -> Regex.match?(pattern, plan) end)
    |> Enum.map(fn {_pattern, error} -> error end)
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

  defp ready_count_errors(ready_floor_exception, rows) do
    case {length(rows) >= @minimum_ready_rows, ready_floor_exception} do
      {_floor_reached?, :duplicate} ->
        ["Ready Floor Exception must appear exactly once"]

      {true, :missing} ->
        []

      {true, _present} ->
        ["Ready Floor Exception must be removed when at least 3 rows are ready"]

      {false, :missing} ->
        [
          "Ready Work requires at least #{@minimum_ready_rows} complete rows; found #{length(rows)}"
        ]

      {false, :malformed} ->
        ["Ready Floor Exception is malformed"]

      {false, {:ok, section}} ->
        ready_floor_exception_field_errors(section)
    end
  end

  defp ready_floor_exception(markdown) do
    case Regex.scan(~r/^## Ready Floor Exception[ \t]*\r?$/m, markdown) do
      [] -> :missing
      [_heading] -> ready_floor_exception_body(markdown)
      _duplicates -> :duplicate
    end
  end

  defp ready_floor_exception_body(markdown) do
    case Regex.run(~r/^## Ready Floor Exception[ \t]*\r?\n(?<body>.*?)(?=^## |\z)/ms, markdown,
           capture: :all_names
         ) do
      [body] -> {:ok, body}
      _ -> :malformed
    end
  end

  defp ready_floor_exception_field_errors(section) do
    Enum.flat_map(@ready_floor_exception_fields, fn field ->
      matches =
        Regex.scan(~r/^#{Regex.escape(field)}:[ \t]*(?<value>[^\r\n]*)\r?$/m, section,
          capture: :all_names
        )

      case matches do
        [[value]] ->
          if String.trim(value) == "",
            do: ["Ready Floor Exception has empty #{field}:"],
            else: []

        [] ->
          ["Ready Floor Exception is missing #{field}:"]

        _duplicates ->
          ["Ready Floor Exception has duplicate #{field}:"]
      end
    end)
  end

  defp terminal_status_errors(markdown) do
    ~r/^Status:[ \t]*(complete|done)[ \t]*$/m
    |> Regex.scan(markdown, capture: :all_but_first)
    |> List.flatten()
    |> Enum.uniq()
    |> Enum.map(&"live queue contains terminal work status `#{&1}`")
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

  defp trailing_row_content_errors(rows) do
    rows
    |> Enum.with_index(1)
    |> Enum.filter(fn {row, _index} -> content_after_exit_condition?(row) end)
    |> Enum.map(fn {_row, index} ->
      "ready row #{index} contains content after its Exit condition"
    end)
  end

  defp content_after_exit_condition?(row) do
    case Regex.run(~r/^Exit condition:[^\r\n]*\r?\n(?<tail>.*)\z/ms, row, capture: :all_names) do
      [tail] ->
        case Regex.split(~r/\r?\n[ \t]*\r?\n/, "\n" <> tail, parts: 2) do
          [_continuation, trailing] -> String.trim(trailing) != ""
          [_continuation] -> false
        end

      _missing_exit_condition ->
        false
    end
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

  defp empty_state_errors(ready_floor_exception, section, rows) do
    valid_empty_state? =
      rows == [] and
        case ready_floor_exception do
          {:ok, exception} -> ready_floor_exception_field_errors(exception) == []
          _invalid -> false
        end

    if not valid_empty_state? and
         Enum.any?(@empty_state_patterns, &Regex.match?(&1, section)) do
      ["Ready Work contains forbidden empty-state language"]
    else
      []
    end
  end
end
