defmodule ProductCompare.Seo.QualificationPolicy do
  @moduledoc false

  @minimum_description_length 80
  @minimum_specification_count 2
  @minimum_category_products 3

  @spec minimum_description_length() :: pos_integer()
  def minimum_description_length, do: @minimum_description_length

  @spec minimum_specification_count() :: pos_integer()
  def minimum_specification_count, do: @minimum_specification_count

  @spec minimum_category_products() :: pos_integer()
  def minimum_category_products, do: @minimum_category_products

  @spec adequate_text?(term()) :: boolean()
  def adequate_text?(value) when is_binary(value),
    do: String.length(String.trim(value)) >= @minimum_description_length

  def adequate_text?(_value), do: false
end
