defmodule Mix.Tasks.ProductCompare.Ingestion.CjCredentials do
  @moduledoc "Reports redacted CJ credential readiness from process environment variables."

  use Mix.Task

  @shortdoc "Reports CJ credential readiness"
  @required_vars ~w(CJ_API_TOKEN CJ_ACCOUNT_ID)
  @optional_vars ~w(CJ_PROPERTY_ID)

  @impl Mix.Task
  def run(argv) do
    argv
    |> parse_argv()
    |> build_report()
    |> enforce_required_readiness()
    |> render_report()
    |> IO.write()
  end

  defp parse_argv(argv) do
    {opts, _args, _invalid} =
      OptionParser.parse(argv,
        switches: [
          require_ready: :boolean
        ]
      )

    %{require_ready: Keyword.get(opts, :require_ready, false)}
  end

  defp build_report(opts) do
    missing_required = Enum.reject(@required_vars, &present_env?/1)
    required_present = @required_vars -- missing_required
    optional_present = Enum.filter(@optional_vars, &present_env?/1)

    Map.merge(opts, %{
      missing_required: missing_required,
      optional_present: optional_present,
      ready: missing_required == [],
      required_present: required_present
    })
  end

  defp present_env?(var) do
    case System.get_env(var) do
      nil -> false
      value -> String.trim(value) != ""
    end
  end

  defp enforce_required_readiness(%{require_ready: true, missing_required: missing_required})
       when missing_required != [] do
    Mix.raise("missing CJ credentials: #{Enum.join(missing_required, ",")}")
  end

  defp enforce_required_readiness(report), do: report

  defp render_report(%{
         missing_required: missing_required,
         optional_present: optional_present,
         ready: ready,
         required_present: required_present
       }) do
    [
      {:provider, "cj"},
      {:surfaces, "shoppingProducts,shoppingProductFeeds"},
      {:ready, ready},
      {:required_present, length(required_present)},
      {:missing_required, Enum.join(missing_required, ",")},
      {:optional_present, Enum.join(optional_present, ",")}
    ]
    |> Enum.map(fn {key, value} -> "#{key}=#{value}" end)
    |> Enum.join("\n")
    |> Kernel.<>("\n")
  end
end
