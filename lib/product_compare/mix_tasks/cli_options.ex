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
  def positive_integer!(value, default, name) do
    integer!(value, default, name, &positive_integer?/1, "positive integer")
  end

  @spec non_negative_integer!(integer() | nil, non_neg_integer(), String.t()) :: non_neg_integer()
  def non_negative_integer!(value, default, name) do
    integer!(value, default, name, &non_negative_integer?/1, "non-negative integer")
  end

  @spec optional_positive_integer!(integer() | nil, String.t()) :: pos_integer() | nil
  def optional_positive_integer!(value, name) do
    integer!(value, nil, name, &positive_integer?/1, "positive integer")
  end

  @spec positive_integer_or_default(term(), pos_integer()) :: pos_integer()
  def positive_integer_or_default(value, _default) when is_integer(value) and value > 0,
    do: value

  def positive_integer_or_default(_value, default), do: default

  defp integer!(nil, default, _name, _predicate, _description), do: default

  defp integer!(value, _default, name, predicate, description) when is_integer(value) do
    if predicate.(value) do
      value
    else
      Mix.raise("invalid #{name}: expected a #{description}")
    end
  end

  defp integer!(_value, _default, name, _predicate, description),
    do: Mix.raise("invalid #{name}: expected a #{description}")

  defp positive_integer?(value), do: value > 0
  defp non_negative_integer?(value), do: value >= 0

  defp reject_invalid!([]), do: :ok

  defp reject_invalid!([{switch, nil} | _rest]),
    do: Mix.raise("unsupported option: #{switch}")

  defp reject_invalid!([{switch, value} | _rest]),
    do: Mix.raise("invalid value for #{switch}: #{value}")

  defp reject_args!([]), do: :ok

  defp reject_args!([arg | _rest]),
    do: Mix.raise("unexpected argument: #{arg}")
end
