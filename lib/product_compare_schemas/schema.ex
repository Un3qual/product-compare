defmodule ProductCompareSchemas.Schema do
  @moduledoc false

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
