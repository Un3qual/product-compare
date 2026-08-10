defmodule ProductCompare.WorkQueue.Validator do
  @moduledoc false

  @minimum_ready_rows 3
  @ready_floor_exception_fields ["Reason", "Rejected split", "Replenishment action"]
  @h2_heading_opening_source ~S"[ ]{0,3}##[ \t]+"
  @h3_heading_opening_source ~S"[ ]{0,3}###[ \t]+"
  @ready_floor_exception_heading_source "#{@h2_heading_opening_source}Ready Floor Exception(?:[ \\t]+#+)?[ \\t]*\\r?"
  @ready_floor_exception_heading_regex Regex.compile!(
                                         "^#{@ready_floor_exception_heading_source}$",
                                         "m"
                                       )
  @ready_floor_exception_body_regex Regex.compile!(
                                      "^#{@ready_floor_exception_heading_source}\\n(?<body>.*?)(?=^#{@h2_heading_opening_source}|\\z)",
                                      "ms"
                                    )
  @ready_section_heading_source "#{@h2_heading_opening_source}Ready Work(?:[ \\t]+#+)?[ \\t]*\\r?"
  @ready_section_heading_regex Regex.compile!("^#{@ready_section_heading_source}$", "m")
  @ready_section_regex Regex.compile!(
                         "^#{@ready_section_heading_source}\\n(?<body>.*?)(?=^#{@h2_heading_opening_source}|\\z)",
                         "ms"
                       )
  @ready_row_regex Regex.compile!(
                     "^#{@h3_heading_opening_source}[^\\r\\n]+\\r?\\n(?<body>.*?)(?=^#{@h3_heading_opening_source}|\\z)",
                     "ms"
                   )
  @fenced_code_opening_regex ~r/^[ ]{0,3}(`{3,}|~{3,})([^\r\n]*)\r?$/
  @raw_html_tag_opening_regex ~r/^[ ]{0,3}<(?<tag>script|pre|style|textarea)(?:[ \t]|>|\r?$)/i
  @raw_html_block_tags ~w(
    address article aside base basefont blockquote body caption center col colgroup dd details
    dialog dir div dl dt fieldset figcaption figure footer form frame frameset h1 h2 h3 h4 h5
    h6 head header hgroup hr html iframe legend li link main menu menuitem nav noframes ol
    optgroup option p param search section summary table tbody td tfoot th thead title tr track ul
  )
  @raw_html_block_tag_opening_regex Regex.compile!(
                                      "^[ ]{0,3}</?(?:#{Enum.join(@raw_html_block_tags, "|")})(?:[ \\t]|/?>|\\r?$)",
                                      "i"
                                    )
  @raw_html_generic_tag_opening_regex ~r"""
  ^[ ]{0,3}
  (?:
    <
    [A-Za-z][A-Za-z0-9-]*
    (?:
      [ \t]+
      [A-Za-z_:][A-Za-z0-9_.:-]*
      (?:
        [ \t]*=[ \t]*
        (?:[^ "'=<>`\t\r\n]+|'[^']*'|"[^"]*")
      )?
    )*
    [ \t]*/?>
    |
    </[A-Za-z][A-Za-z0-9-]*[ \t]*>
  )
  [ \t]*\r?$
  """x
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
    visible_markdown = markdown_without_non_rendered_examples(markdown)

    with {:ok, ready_section} <- ready_section(visible_markdown) do
      rows = ready_rows(ready_section)
      ready_floor_exception = ready_floor_exception(visible_markdown)

      errors =
        terminal_status_errors(visible_markdown) ++
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
    case Regex.scan(@ready_section_heading_regex, markdown) do
      [] ->
        {:error, ["missing ## Ready Work section"]}

      [_heading] ->
        case Regex.run(@ready_section_regex, markdown, capture: :all_names) do
          [body] -> {:ok, body}
          _ -> {:error, ["missing ## Ready Work section"]}
        end

      _duplicates ->
        {:error, ["Ready Work must appear exactly once"]}
    end
  end

  defp ready_rows(section) do
    @ready_row_regex
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
    case Regex.scan(@ready_floor_exception_heading_regex, markdown) do
      [] -> :missing
      [_heading] -> ready_floor_exception_body(markdown)
      _duplicates -> :duplicate
    end
  end

  defp ready_floor_exception_body(markdown) do
    case Regex.run(@ready_floor_exception_body_regex, markdown, capture: :all_names) do
      [body] -> {:ok, body}
      _ -> :malformed
    end
  end

  defp markdown_without_non_rendered_examples(markdown) do
    markdown
    |> String.split("\n", trim: false)
    |> Enum.map_reduce(:visible, &visible_markdown_line/2)
    |> elem(0)
    |> Enum.join("\n")
  end

  defp visible_markdown_line(line, {:fence, marker, minimum_length} = state) do
    if fence_closing?(line, marker, minimum_length),
      do: {mask(line), :visible},
      else: {mask(line), state}
  end

  defp visible_markdown_line(line, {:raw_html, terminator} = state) do
    if raw_html_closing?(line, terminator),
      do: {mask(line), :visible},
      else: {mask(line), state}
  end

  defp visible_markdown_line(line, :raw_html_until_blank) do
    if Regex.match?(~r/^[ \t]*\r?$/, line),
      do: {line, :visible},
      else: {mask(line), :raw_html_until_blank}
  end

  defp visible_markdown_line(line, state) when state in [:visible, :html_comment] do
    case state == :visible && fence_opening(line) do
      {marker, minimum_length} ->
        {mask(line), {:fence, marker, minimum_length}}

      _not_a_fence ->
        case state == :visible && raw_html_opening(line) do
          {:until, terminator} ->
            next_state =
              if raw_html_closing?(line, terminator),
                do: :visible,
                else: {:raw_html, terminator}

            {mask(line), next_state}

          :until_blank ->
            {mask(line), :raw_html_until_blank}

          _not_raw_html ->
            mask_html_comments(line, state)
        end
    end
  end

  defp fence_opening(line) do
    case Regex.run(@fenced_code_opening_regex, line, capture: :all_but_first) do
      [fence, info] ->
        marker = String.first(fence)

        if marker == "`" and String.contains?(info, "`"),
          do: nil,
          else: {marker, byte_size(fence)}

      _not_an_opening_fence ->
        nil
    end
  end

  defp fence_closing?(line, marker, minimum_length) do
    marker = Regex.escape(marker)

    Regex.match?(
      Regex.compile!("^[ ]{0,3}#{marker}{#{minimum_length},}[ \\t]*\\r?$"),
      line
    )
  end

  defp raw_html_opening(line) do
    case Regex.run(@raw_html_tag_opening_regex, line, capture: :all_names) do
      [tag] ->
        {:until, {:closing_tag, String.downcase(tag)}}

      _not_a_tag_block ->
        cond do
          Regex.match?(~r/^[ ]{0,3}<\?/, line) -> {:until, :processing_instruction}
          Regex.match?(~r/^[ ]{0,3}<!\[CDATA\[/, line) -> {:until, :cdata}
          Regex.match?(~r/^[ ]{0,3}<![A-Z]/, line) -> {:until, :declaration}
          Regex.match?(@raw_html_block_tag_opening_regex, line) -> :until_blank
          Regex.match?(@raw_html_generic_tag_opening_regex, line) -> :until_blank
          true -> nil
        end
    end
  end

  defp raw_html_closing?(line, {:closing_tag, tag}) do
    String.contains?(String.downcase(line), "</#{tag}>")
  end

  defp raw_html_closing?(line, :processing_instruction), do: String.contains?(line, "?>")
  defp raw_html_closing?(line, :cdata), do: String.contains?(line, "]]>")
  defp raw_html_closing?(line, :declaration), do: String.contains?(line, ">")

  defp mask_html_comments(line, state) do
    mask_html_comments(line, state, [])
  end

  defp mask_html_comments(line, :visible, masked) do
    case :binary.match(line, "<!--") do
      :nomatch ->
        {IO.iodata_to_binary([masked, line]), :visible}

      {opening_index, _opening_length} ->
        prefix = binary_part(line, 0, opening_index)
        comment = binary_part(line, opening_index, byte_size(line) - opening_index)

        case :binary.match(comment, "-->") do
          :nomatch ->
            {IO.iodata_to_binary([masked, prefix, mask(comment)]), :html_comment}

          {closing_index, closing_length} ->
            comment_length = closing_index + closing_length
            remainder_index = opening_index + comment_length
            remainder = binary_part(line, remainder_index, byte_size(line) - remainder_index)

            mask_html_comments(
              remainder,
              :visible,
              [masked, prefix, mask(binary_part(comment, 0, comment_length))]
            )
        end
    end
  end

  defp mask_html_comments(line, :html_comment, masked) do
    case :binary.match(line, "-->") do
      :nomatch ->
        {IO.iodata_to_binary([masked, mask(line)]), :html_comment}

      {closing_index, closing_length} ->
        comment_length = closing_index + closing_length
        remainder = binary_part(line, comment_length, byte_size(line) - comment_length)

        mask_html_comments(
          remainder,
          :visible,
          [masked, mask(binary_part(line, 0, comment_length))]
        )
    end
  end

  defp mask(text), do: String.duplicate(" ", byte_size(text))

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
