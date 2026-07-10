defmodule ProductCompare.WorkQueue.Validator do
  @moduledoc false

  @minimum_ready_rows 3
  @required_markers [
    "Status:",
    "Lane:",
    "Plan:",
    "Next action:",
    "Owned paths:",
    "Prerequisites:",
    "Verification:",
    "Exit condition:"
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
    path
    |> File.read!()
    |> validate()
  end

  @spec validate(String.t()) ::
          {:ok, %{ready_count: pos_integer()}} | {:error, [String.t()]}
  def validate(markdown) when is_binary(markdown) do
    with {:ok, ready_section} <- ready_section(markdown) do
      rows = ready_rows(ready_section)

      errors =
        ready_count_errors(rows) ++
          incomplete_row_errors(rows) ++
          empty_state_errors(ready_section)

      case errors do
        [] -> {:ok, %{ready_count: length(rows)}}
        _ -> {:error, errors}
      end
    end
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
            not String.contains?(row, marker),
            do: "ready row #{index} is missing #{marker}"

      status_errors =
        if Regex.match?(~r/^Status: ready\s*$/m, row),
          do: [],
          else: ["ready row #{index} must contain `Status: ready`"]

      marker_errors ++ status_errors
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
