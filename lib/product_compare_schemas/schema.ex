defmodule ProductCompareSchemas.Schema do
  @moduledoc false

  @spec normalize_non_finite_decimals(map(), [atom()]) :: map()
  def normalize_non_finite_decimals(params, fields) when is_map(params) and is_list(fields) do
    Enum.reduce(fields, params, fn field, normalized_params ->
      key = if Map.has_key?(normalized_params, field), do: field, else: Atom.to_string(field)

      case Map.get(normalized_params, key) do
        %Decimal{} = value ->
          if Decimal.nan?(value) or Decimal.inf?(value) do
            Map.put(normalized_params, key, Decimal.to_string(value))
          else
            normalized_params
          end

        _other ->
          normalized_params
      end
    end)
  end

  defmacro __using__(which) when is_atom(which) do
    apply(__MODULE__, which, [])
  end

  def relational do
    quote do
      use Ecto.Schema
      import Ecto.Changeset

      @primary_key {:id, :id, autogenerate: true}
      @foreign_key_type :id
      @timestamps_opts [type: :utc_datetime_usec]
    end
  end
end
