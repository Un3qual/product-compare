defmodule ProductCompare.ChangesetErrors do
  @moduledoc false

  @spec unique_error_on_field?(Ecto.Changeset.t() | term(), atom()) :: boolean()
  def unique_error_on_field?(%Ecto.Changeset{errors: errors}, field) do
    Enum.any?(errors, fn
      {^field, {_message, opts}} -> opts[:constraint] == :unique
      _error -> false
    end)
  end

  def unique_error_on_field?(_changeset, _field), do: false

  @spec unique_error_on_any_field?(Ecto.Changeset.t() | term(), [atom()]) :: boolean()
  def unique_error_on_any_field?(changeset, fields) do
    Enum.any?(fields, &unique_error_on_field?(changeset, &1))
  end
end
