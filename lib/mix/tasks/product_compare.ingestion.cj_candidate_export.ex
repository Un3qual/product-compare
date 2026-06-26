defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidateExport do
  @moduledoc "Exports reviewed CJ feed candidates as non-secret CSV."

  use Mix.Task

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @shortdoc "Exports reviewed CJ feed candidates"
  @allowed_statuses ~w(pending shortlisted dismissed)
  @columns [
    :provider,
    :provider_feed_id,
    :advertiser_id,
    :advertiser_name,
    :advertiser_country,
    :currency,
    :language,
    :feed_name,
    :product_count,
    :review_note,
    :last_seen_at
  ]

  @impl Mix.Task
  def run(argv) do
    Mix.Task.run("app.start")

    argv
    |> parse_argv()
    |> export_candidates()
    |> IO.write()
  end

  defp parse_argv(argv) do
    {opts, _args, _invalid} =
      OptionParser.parse(argv,
        switches: [
          status: :string
        ]
      )

    status = Keyword.get(opts, :status, "shortlisted")

    unless status in @allowed_statuses do
      Mix.raise("invalid review status: #{status}")
    end

    %{status: status}
  end

  defp export_candidates(%{status: status}) do
    status
    |> candidates_for_status()
    |> render_csv()
  end

  defp candidates_for_status(status) do
    MerchantFeedCandidate
    |> where([candidate], candidate.provider == "cj")
    |> where([candidate], candidate.review_status == ^status)
    |> order_by([candidate],
      asc: candidate.advertiser_name,
      asc: candidate.feed_name,
      asc: candidate.provider_feed_id,
      asc: candidate.id
    )
    |> Repo.all()
  end

  defp render_csv(candidates) do
    [
      render_row(@columns),
      Enum.map(candidates, &render_candidate/1)
    ]
    |> List.flatten()
    |> Enum.join("\n")
    |> Kernel.<>("\n")
  end

  defp render_candidate(%MerchantFeedCandidate{} = candidate) do
    @columns
    |> Enum.map(&Map.fetch!(candidate, &1))
    |> render_row()
  end

  defp render_row(values) do
    values
    |> Enum.map(&field_value/1)
    |> Enum.map(&escape_csv_value/1)
    |> Enum.join(",")
  end

  defp field_value(nil), do: ""
  defp field_value(%DateTime{} = value), do: DateTime.to_iso8601(value)
  defp field_value(value) when is_integer(value), do: Integer.to_string(value)
  defp field_value(value), do: to_string(value)

  defp escape_csv_value(value) do
    escaped_value = String.replace(value, ~s("), ~s(""))

    if String.contains?(value, [",", ~s("), "\r", "\n"]) do
      ~s("#{escaped_value}")
    else
      escaped_value
    end
  end
end
