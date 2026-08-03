defmodule ProductCompareSchemas.Alerts.Cooldown do
  @moduledoc false

  @minimum_seconds 60
  @maximum_seconds 31_536_000

  @spec from_seconds(integer()) :: {:ok, Duration.t()} | :error
  def from_seconds(seconds)
      when is_integer(seconds) and seconds >= @minimum_seconds and seconds <= @maximum_seconds,
      do: {:ok, Duration.new!(second: seconds)}

  def from_seconds(_seconds), do: :error

  @spec to_seconds(Duration.t()) :: {:ok, non_neg_integer()} | :error
  def to_seconds(%Duration{
        year: 0,
        month: 0,
        week: weeks,
        day: days,
        hour: hours,
        minute: minutes,
        second: seconds,
        microsecond: {0, precision}
      })
      when is_integer(weeks) and weeks >= 0 and is_integer(days) and days >= 0 and
             is_integer(hours) and hours >= 0 and is_integer(minutes) and minutes >= 0 and
             is_integer(seconds) and seconds >= 0 and is_integer(precision) and precision >= 0 do
    {:ok, weeks * 604_800 + days * 86_400 + hours * 3_600 + minutes * 60 + seconds}
  end

  def to_seconds(_duration), do: :error
end
