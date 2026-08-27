defmodule ProductCompare.CommerceAttribution.Conversions do
  @moduledoc false

  alias ProductCompare.CommerceAttribution.Conversions.Persistence
  alias ProductCompare.CommerceAttribution.Conversions.PurchaseFacts
  alias ProductCompare.CommerceAttribution.CJAdapter
  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion
  alias ProductCompareSchemas.CommerceAttribution.PurchasePriceFact

  @spec ingest_conversion(map()) ::
          {:ok, CommerceConversion.t()} | {:error, Ecto.Changeset.t()}
  def ingest_conversion(attrs), do: Persistence.ingest(attrs)

  @spec persist_cj_action_group([map()]) ::
          {:ok, %{persisted: non_neg_integer(), reversed: non_neg_integer()}}
          | {:error, term()}
  def persist_cj_action_group(records) when is_list(records) do
    Repo.transaction(fn ->
      {originals, corrections} = Enum.split_with(records, &original?/1)

      with {:ok, persisted} <- persist_cj_originals(sort_records(originals)),
           {:ok, reversed} <- reverse_cj_corrections(sort_records(corrections)) do
        %{persisted: persisted + length(corrections), reversed: reversed}
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end

  def persist_cj_action_group(_records), do: {:error, :invalid_action_group}

  @spec create_purchase_price_fact(map()) ::
          {:ok, PurchasePriceFact.t()} | {:error, Ecto.Changeset.t()}
  def create_purchase_price_fact(attrs), do: PurchaseFacts.create(attrs)

  defp persist_cj_originals(originals) do
    Enum.reduce_while(originals, {:ok, 0}, fn original, {:ok, persisted} ->
      case CJAdapter.ingest_transaction(original) do
        {:ok, _conversion} -> {:cont, {:ok, persisted + 1}}
        {:error, changeset} -> {:halt, {:error, changeset}}
      end
    end)
  end

  defp reverse_cj_corrections(corrections) do
    Enum.reduce_while(corrections, {:ok, 0}, fn correction, {:ok, reversed} ->
      with {:ok, action_ref} <- correction_action_ref(correction),
           {:ok, posting_date} <- correction_posting_date(correction),
           {:ok, result} <- Persistence.reverse_cj_action(action_ref, posting_date, correction) do
        {:cont, {:ok, reversed + result.updated}}
      else
        {:error, reason} -> {:halt, {:error, reason}}
      end
    end)
  end

  defp correction_action_ref(correction) do
    correction
    |> Map.get("originalActionId")
    |> normalize_string()
    |> case do
      nil -> {:error, correction_changeset(:network_action_ref, "can't be blank")}
      action_ref -> {:ok, action_ref}
    end
  end

  defp correction_posting_date(correction) do
    case Map.get(correction, "postingDate") do
      posting_date when is_binary(posting_date) ->
        case DateTime.from_iso8601(posting_date) do
          {:ok, %DateTime{utc_offset: 0, std_offset: 0} = posting_date, _offset} ->
            {:ok, posting_date}

          _invalid ->
            {:error, correction_changeset(:reported_at, "is invalid")}
        end

      _invalid ->
        {:error, correction_changeset(:reported_at, "is invalid")}
    end
  end

  defp correction_changeset(field, message) do
    %CommerceConversion{}
    |> Ecto.Changeset.change()
    |> Ecto.Changeset.add_error(field, message)
  end

  defp sort_records(records) do
    Enum.sort_by(records, &record_sort_key/1)
  end

  defp record_sort_key(record) do
    posting_date = Map.get(record, "postingDate")
    commission_id = Map.get(record, "commissionId")

    case posting_date do
      posting_date when is_binary(posting_date) ->
        case DateTime.from_iso8601(posting_date) do
          {:ok, posting_date, _offset} ->
            {0, DateTime.to_unix(posting_date, :microsecond), commission_id}

          _invalid ->
            {1, posting_date, commission_id}
        end

      _invalid ->
        {1, "", commission_id}
    end
  end

  defp original?(%{"original" => true}), do: true
  defp original?(_record), do: false

  defp normalize_string(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      value -> value
    end
  end

  defp normalize_string(_value), do: nil
end
