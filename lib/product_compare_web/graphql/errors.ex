defmodule ProductCompareWeb.GraphQL.Errors do
  @moduledoc false

  @type top_level_error :: [
          {:message, String.t()}
          | {:extensions, %{required(:code) => String.t()}}
        ]

  @type mutation_error :: %{
          required(:code) => String.t(),
          required(:message) => String.t(),
          required(:field) => String.t() | nil
        }

  @unauthenticated_code "UNAUTHENTICATED"
  @unauthenticated_message "unauthorized"
  @forbidden_code "FORBIDDEN"
  @forbidden_message "forbidden"

  @spec unauthenticated_code() :: String.t()
  def unauthenticated_code, do: @unauthenticated_code

  @spec unauthenticated() :: top_level_error()
  def unauthenticated do
    [
      message: @unauthenticated_message,
      extensions: %{code: unauthenticated_code()}
    ]
  end

  @spec unauthenticated_mutation_error() :: mutation_error()
  def unauthenticated_mutation_error do
    mutation_error(unauthenticated_code(), @unauthenticated_message)
  end

  @spec forbidden() :: top_level_error()
  def forbidden do
    [message: @forbidden_message, extensions: %{code: @forbidden_code}]
  end

  @spec forbidden_mutation_error() :: mutation_error()
  def forbidden_mutation_error, do: mutation_error(@forbidden_code, @forbidden_message)

  @spec community_write_error(:idempotency_conflict | :rate_limited | :invalid_lifecycle) ::
          mutation_error()
  def community_write_error(:idempotency_conflict) do
    camelized_mutation_error(
      "IDEMPOTENCY_CONFLICT",
      "idempotency key was already used with different content",
      :idempotency_key
    )
  end

  def community_write_error(:rate_limited) do
    mutation_error("RATE_LIMITED", "community write limit reached; try again later")
  end

  def community_write_error(:invalid_lifecycle) do
    mutation_error("INVALID_LIFECYCLE", "removed community content cannot be changed")
  end

  @spec authorization_error(:unauthenticated | :forbidden) :: top_level_error()
  def authorization_error(:unauthenticated), do: unauthenticated()
  def authorization_error(:forbidden), do: forbidden()

  @spec authorization_mutation_error(:unauthenticated | :forbidden) :: mutation_error()
  def authorization_mutation_error(:unauthenticated), do: unauthenticated_mutation_error()
  def authorization_mutation_error(:forbidden), do: forbidden_mutation_error()

  @spec mutation_error(String.t(), String.t(), String.t() | atom() | nil) :: mutation_error()
  def mutation_error(code, message, field \\ nil) do
    %{code: code, message: message, field: normalize_field(field)}
  end

  @spec camelized_mutation_error(String.t(), String.t(), String.t() | atom() | nil) ::
          mutation_error()
  def camelized_mutation_error(code, message, field \\ nil) do
    %{code: code, message: message, field: camelize_field(field)}
  end

  @spec changeset_mutation_errors(Ecto.Changeset.t()) :: [mutation_error()]
  def changeset_mutation_errors(%Ecto.Changeset{} = changeset) do
    changeset
    |> Ecto.Changeset.traverse_errors(&interpolate_error/1)
    |> Enum.flat_map(fn {field, messages} ->
      Enum.map(messages, &mutation_error("INVALID_ARGUMENT", &1, field))
    end)
  end

  @spec changeset_first_error(Ecto.Changeset.t()) :: {String.t() | nil, String.t()}
  def changeset_first_error(%Ecto.Changeset{errors: [{field, error} | _]}) do
    {normalize_field(field), interpolate_error(error)}
  end

  def changeset_first_error(%Ecto.Changeset{}), do: {nil, "invalid payload"}

  @spec changeset_first_message(Ecto.Changeset.t()) :: String.t()
  def changeset_first_message(%Ecto.Changeset{} = changeset) do
    {_field, message} = changeset_first_error(changeset)
    message
  end

  defp normalize_field(nil), do: nil
  defp normalize_field(field) when is_atom(field), do: Atom.to_string(field)
  defp normalize_field(field) when is_binary(field), do: field

  defp camelize_field(nil), do: nil

  defp camelize_field(field) when is_atom(field),
    do: field |> Atom.to_string() |> camelize_field()

  defp camelize_field(field) when is_binary(field) do
    case String.split(field, "_") do
      [single] -> single
      [first | rest] -> first <> Enum.map_join(rest, &String.capitalize/1)
    end
  end

  defp interpolate_error({message, opts}) do
    opts_by_key = Map.new(opts, fn {key, value} -> {to_string(key), value} end)

    Regex.replace(~r"%{(\w+)}", message, fn _, key ->
      opts_by_key
      |> Map.get(key, key)
      |> to_string()
    end)
  end
end
