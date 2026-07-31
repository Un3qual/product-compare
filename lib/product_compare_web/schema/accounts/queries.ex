defmodule ProductCompareWeb.Schema.Accounts.Queries do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  alias ProductCompareWeb.Resolvers.AuthResolver

  object :accounts_queries do
    @desc "Returns the current authenticated user, if any."
    field :viewer, :user, resolve: &AuthResolver.viewer/3

    @desc "Returns API tokens owned by the current authenticated user."
    connection field :my_api_tokens, node_type: :api_token, non_null_connection: true do
      arg(:status, :api_token_status_filter)
      resolve(&AuthResolver.my_api_tokens/3)
    end
  end
end
