defmodule ProductCompare.MixTasks.CliOptions do
  @moduledoc false

  @spec parse!([String.t()], keyword()) :: keyword()
  def parse!(argv, switches) do
    {opts, args, invalid} = OptionParser.parse(argv, strict: switches)

    reject_invalid!(invalid)
    reject_args!(args)

    opts
  end

  @spec positive_integer!(integer() | nil, integer(), String.t()) :: integer()
  def positive_integer!(nil, default, _name), do: default
  def positive_integer!(value, _default, _name) when is_integer(value) and value > 0, do: value

  def positive_integer!(_value, _default, name),
    do: Mix.raise("invalid #{name}: expected a positive integer")

  @spec non_negative_integer!(integer() | nil, non_neg_integer(), String.t()) :: non_neg_integer()
  def non_negative_integer!(nil, default, _name), do: default

  def non_negative_integer!(value, _default, _name)
      when is_integer(value) and value >= 0,
      do: value

  def non_negative_integer!(_value, _default, name),
    do: Mix.raise("invalid #{name}: expected a non-negative integer")

  @spec optional_positive_integer!(integer() | nil, String.t()) :: pos_integer() | nil
  def optional_positive_integer!(nil, _name), do: nil
  def optional_positive_integer!(value, _name) when is_integer(value) and value > 0, do: value

  def optional_positive_integer!(_value, name),
    do: Mix.raise("invalid #{name}: expected a positive integer")

  @spec positive_integer_or_default(term(), pos_integer()) :: pos_integer()
  def positive_integer_or_default(value, _default) when is_integer(value) and value > 0,
    do: value

  def positive_integer_or_default(_value, default), do: default

  defp reject_invalid!([]), do: :ok

  defp reject_invalid!([{switch, nil} | _rest]),
    do: Mix.raise("unsupported option: #{switch}")

  defp reject_invalid!([{switch, value} | _rest]),
    do: Mix.raise("invalid value for #{switch}: #{value}")

  defp reject_args!([]), do: :ok

  defp reject_args!([arg | _rest]),
    do: Mix.raise("unexpected argument: #{arg}")
end
