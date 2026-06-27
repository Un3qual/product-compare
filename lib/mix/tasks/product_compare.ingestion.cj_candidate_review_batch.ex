defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidateReviewBatch do
  @moduledoc """
  Reviews an explicit batch of CJ feed candidates.
  """

  use Mix.Task

  import Ecto.Query

  alias ProductCompare.Ingestion
  alias ProductCompare.MixTasks.RepoOnlyStartup
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @shortdoc "Reviews an explicit batch of CJ feed candidates"
  @allowed_statuses ~w(pending shortlisted dismissed)
  @max_identifiers 50
  @provider "cj"

  @impl Mix.Task
  def run(argv) do
    RepoOnlyStartup.start!()

    opts = parse_argv(argv)
    candidates = load_candidates(opts)
    {candidates, updated_count} = review_candidates(candidates, opts)

    candidates
    |> render_report(opts, updated_count)
    |> IO.write()
  end

  defp parse_argv(argv) do
    {opts, _args, _invalid} =
      OptionParser.parse(argv,
        strict: [
          status: :string,
          id: :keep,
          provider_feed_id: :keep,
          note: :string,
          apply: :boolean
        ]
      )

    relay_ids = Keyword.get_values(opts, :id)
    provider_feed_ids = normalize_provider_feed_ids(Keyword.get_values(opts, :provider_feed_id))
    requested_count = length(relay_ids) + length(provider_feed_ids)

    status = normalize_status(Keyword.get(opts, :status))
    note = normalize_note(Keyword.get(opts, :note))

    validate_identifier_count!(requested_count)

    {decoded_ids, invalid_ids} = decode_relay_ids(relay_ids)

    %{
      apply: Keyword.get(opts, :apply, false),
      decoded_ids: Enum.uniq(decoded_ids),
      invalid_ids: invalid_ids,
      note: note,
      note_present: not is_nil(note),
      provider_feed_ids: Enum.uniq(provider_feed_ids),
      requested_count: requested_count,
      status: status
    }
  end

  defp normalize_status(nil), do: Mix.raise("review status is required")

  defp normalize_status(status) when is_binary(status) do
    status = status |> String.trim() |> String.downcase()

    if status in @allowed_statuses do
      status
    else
      Mix.raise("invalid review status: #{status}")
    end
  end

  defp normalize_status(_status), do: Mix.raise("review status is required")

  defp normalize_provider_feed_ids(provider_feed_ids) do
    provider_feed_ids
    |> Enum.map(&normalize_string/1)
    |> Enum.reject(&is_nil/1)
  end

  defp normalize_note(note), do: normalize_string(note)

  defp normalize_string(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      value -> value
    end
  end

  defp normalize_string(_value), do: nil

  defp validate_identifier_count!(0) do
    Mix.raise("at least one candidate id or provider feed id is required")
  end

  defp validate_identifier_count!(count) when count > @max_identifiers do
    Mix.raise("candidate review batch limit is 50")
  end

  defp validate_identifier_count!(_count), do: :ok

  defp decode_relay_ids(relay_ids) do
    Enum.reduce(relay_ids, {[], 0}, fn relay_id, {decoded_ids, invalid_ids} ->
      case GlobalId.decode_integer(relay_id, :merchant_feed_candidate) do
        {:ok, decoded_id} -> {[decoded_id | decoded_ids], invalid_ids}
        :error -> {decoded_ids, invalid_ids + 1}
      end
    end)
    |> then(fn {decoded_ids, invalid_ids} -> {Enum.reverse(decoded_ids), invalid_ids} end)
  end

  defp load_candidates(%{decoded_ids: [], provider_feed_ids: []}), do: []

  defp load_candidates(%{decoded_ids: decoded_ids, provider_feed_ids: provider_feed_ids}) do
    MerchantFeedCandidate
    |> where([candidate], candidate.provider == @provider)
    |> where(
      [candidate],
      candidate.id in ^decoded_ids or candidate.provider_feed_id in ^provider_feed_ids
    )
    |> order_by([candidate],
      asc: candidate.advertiser_name,
      asc: candidate.feed_name,
      asc: candidate.provider_feed_id,
      asc: candidate.id
    )
    |> Repo.all()
  end

  defp review_candidates(candidates, %{apply: false}), do: {candidates, 0}

  defp review_candidates(candidates, %{apply: true, status: status, note: note}) do
    Enum.map_reduce(candidates, 0, fn candidate, updated_count ->
      attrs = %{review_status: status, review_note: note}

      case Ingestion.review_merchant_feed_candidate(candidate.id, attrs) do
        {:ok, reviewed_candidate} ->
          {reviewed_candidate, updated_count + 1}

        {:error, reason} ->
          Mix.raise("failed to review candidate #{candidate.id}: #{format_review_error(reason)}")
      end
    end)
  end

  defp render_report(candidates, opts, updated_count) do
    [
      render_summary(candidates, opts, updated_count)
      | Enum.map(candidates, &render_candidate/1)
    ]
    |> Enum.join("\n")
    |> Kernel.<>("\n")
  end

  defp render_summary(candidates, opts, updated_count) do
    dry_run = not opts.apply

    [
      {:provider, @provider},
      {:dry_run, dry_run},
      {:requested, opts.requested_count},
      {:matched, length(candidates)},
      {:updated, updated_count},
      {:invalid_ids, opts.invalid_ids},
      {:status, opts.status},
      {:note_present, opts.note_present}
    ]
    |> Enum.map(fn {key, value} -> "#{key}=#{format_value(value)}" end)
    |> Enum.join(" ")
  end

  defp render_candidate(%MerchantFeedCandidate{} = candidate) do
    {:ok, candidate_id} = GlobalId.encode_required(:merchant_feed_candidate, candidate.id)

    [
      {:candidate_id, candidate_id},
      {:provider_feed_id, candidate.provider_feed_id},
      {:review_status, candidate.review_status}
    ]
    |> Enum.map(fn {key, value} -> "#{key}=#{format_value(value)}" end)
    |> Enum.join(" ")
  end

  defp format_review_error(%Ecto.Changeset{} = changeset), do: inspect(changeset.errors)
  defp format_review_error(reason), do: inspect(reason)

  defp format_value(value) when is_boolean(value), do: to_string(value)
  defp format_value(value) when is_integer(value), do: Integer.to_string(value)
  defp format_value(value) when is_binary(value), do: value
end
