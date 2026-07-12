defmodule ProductCompareWeb.GraphQL.Authorization do
  @moduledoc false

  alias ProductCompareSchemas.Accounts.User

  @spec require_operator(Absinthe.Resolution.t()) ::
          {:ok, User.t()} | {:error, :unauthenticated | :forbidden}
  def require_operator(%{context: %{current_user: %User{is_operator: true} = user}}),
    do: {:ok, user}

  def require_operator(%{context: %{current_user: %User{}}}), do: {:error, :forbidden}
  def require_operator(_resolution), do: {:error, :unauthenticated}
end
