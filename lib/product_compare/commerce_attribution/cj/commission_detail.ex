defmodule ProductCompare.CommerceAttribution.CJ.CommissionDetail do
  @moduledoc false

  @fields ~w(
    commissionId
    original
    originalActionId
    correctionReason
    actionStatus
    shopperId
    eventDate
    postingDate
    saleAmountUsd
    pubCommissionAmountUsd
  )

  @action_statuses ~w(new extended locked closed)

  @spec validate_publisher_ids(term()) ::
          {:ok, [String.t()]} | {:error, {:invalid_request, :publisher_ids}}
  def validate_publisher_ids(publisher_ids) when is_list(publisher_ids) do
    publisher_ids = Enum.map(publisher_ids, &normalize_string/1)

    if publisher_ids != [] and Enum.all?(publisher_ids, &is_binary/1) do
      {:ok, publisher_ids}
    else
      {:error, {:invalid_request, :publisher_ids}}
    end
  end

  def validate_publisher_ids(_publisher_ids),
    do: {:error, {:invalid_request, :publisher_ids}}

  @spec validate_window(term(), term()) ::
          {:ok, DateTime.t(), DateTime.t()} | {:error, {:invalid_request, :window}}
  def validate_window(%DateTime{} = from, %DateTime{} = before) do
    if utc?(from) and utc?(before) and DateTime.compare(from, before) == :lt do
      {:ok, from, before}
    else
      {:error, {:invalid_request, :window}}
    end
  end

  def validate_window(_from, _before), do: {:error, {:invalid_request, :window}}

  @spec valid_record?(term()) :: boolean()
  def valid_record?(record) when is_map(record) do
    Enum.all?(@fields, &Map.has_key?(record, &1)) and
      nonblank_string?(record["commissionId"]) and
      is_boolean(record["original"]) and
      nullable_string?(record["originalActionId"]) and
      nullable_string?(record["correctionReason"]) and
      action_status?(record["actionStatus"]) and
      nullable_string?(record["shopperId"]) and
      utc_datetime_string?(record["eventDate"]) and
      utc_datetime_string?(record["postingDate"]) and
      decimal_string?(record["saleAmountUsd"]) and
      decimal_string?(record["pubCommissionAmountUsd"])
  end

  def valid_record?(_record), do: false

  @spec normalize_string(term()) :: String.t() | nil
  def normalize_string(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      normalized -> normalized
    end
  end

  def normalize_string(_value), do: nil

  defp nonblank_string?(value), do: not is_nil(normalize_string(value))
  defp nullable_string?(nil), do: true
  defp nullable_string?(value), do: is_binary(value)

  defp action_status?(value) do
    case normalize_string(value) do
      nil -> false
      value -> String.downcase(value) in @action_statuses
    end
  end

  defp decimal_string?(value) when is_binary(value) do
    match?({%Decimal{}, ""}, value |> String.trim() |> Decimal.parse())
  end

  defp decimal_string?(_value), do: false

  defp utc_datetime_string?(value) when is_binary(value) do
    match?(
      {:ok, %DateTime{utc_offset: 0, std_offset: 0}, 0},
      DateTime.from_iso8601(String.trim(value))
    )
  end

  defp utc_datetime_string?(_value), do: false

  defp utc?(%DateTime{utc_offset: 0, std_offset: 0}), do: true
  defp utc?(_datetime), do: false
end
