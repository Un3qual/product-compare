defmodule ProductCompare.CommerceAttribution.DestinationUrl.Punycode do
  @moduledoc false

  @base 36
  @tmin 1
  @tmax 26
  @skew 38
  @damp 700
  @initial_bias 72
  @initial_n 128

  @spec encode(String.t()) :: String.t()
  def encode(label) do
    codepoints = String.to_charlist(label)
    basic_codepoints = Enum.filter(codepoints, &(&1 < 128))
    encoded = Enum.map_join(basic_codepoints, &<<&1::utf8>>)
    basic_count = length(basic_codepoints)
    encoded = if basic_count > 0, do: encoded <> "-", else: encoded

    encode_codepoints(
      codepoints,
      length(codepoints),
      basic_count,
      @initial_n,
      0,
      @initial_bias,
      encoded
    )
  end

  defp encode_codepoints(
         codepoints,
         input_length,
         handled_count,
         n,
         delta,
         bias,
         encoded
       )
       when handled_count < input_length do
    m = codepoints |> Enum.filter(&(&1 >= n)) |> Enum.min()
    delta = delta + (m - n) * (handled_count + 1)

    {handled_count, delta, bias, encoded} =
      Enum.reduce(codepoints, {handled_count, delta, bias, encoded}, fn codepoint,
                                                                        {handled_count, delta,
                                                                         bias, encoded} ->
        cond do
          codepoint < m ->
            {handled_count, delta + 1, bias, encoded}

          codepoint == m ->
            encoded = encode_delta(delta, bias, encoded)

            bias =
              adapt_bias(
                delta,
                handled_count + 1,
                handled_count == basic_count(codepoints)
              )

            {handled_count + 1, 0, bias, encoded}

          true ->
            {handled_count, delta, bias, encoded}
        end
      end)

    encode_codepoints(
      codepoints,
      input_length,
      handled_count,
      m + 1,
      delta + 1,
      bias,
      encoded
    )
  end

  defp encode_codepoints(
         _codepoints,
         _input_length,
         _handled_count,
         _n,
         _delta,
         _bias,
         encoded
       ),
       do: encoded

  defp basic_count(codepoints), do: Enum.count(codepoints, &(&1 < 128))
  defp encode_delta(delta, bias, encoded), do: encode_delta(delta, @base, bias, encoded)

  defp encode_delta(q, k, bias, encoded) do
    t = threshold(k, bias)

    if q < t do
      encoded <> digit(q)
    else
      digit = t + rem(q - t, @base - t)
      q = div(q - t, @base - t)
      encode_delta(q, k + @base, bias, encoded <> digit(digit))
    end
  end

  defp threshold(k, bias) when k <= bias + @tmin, do: @tmin
  defp threshold(k, bias) when k >= bias + @tmax, do: @tmax
  defp threshold(k, bias), do: k - bias

  defp digit(value) when value in 0..25, do: <<?a + value>>
  defp digit(value), do: <<?0 + value - 26>>

  defp adapt_bias(delta, numpoints, first_time?) do
    delta = if first_time?, do: div(delta, @damp), else: div(delta, 2)
    delta = delta + div(delta, numpoints)

    {k, delta} = reduce_bias_delta(delta, 0)
    k + div((@base - @tmin + 1) * delta, delta + @skew)
  end

  defp reduce_bias_delta(delta, k) when delta > div((@base - @tmin) * @tmax, 2) do
    reduce_bias_delta(div(delta, @base - @tmin), k + @base)
  end

  defp reduce_bias_delta(delta, k), do: {k, delta}
end
