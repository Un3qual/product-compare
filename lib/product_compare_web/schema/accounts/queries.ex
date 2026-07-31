defmodule ProductCompareWeb.Schema.Accounts.Queries do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  alias ProductCompareWeb.Resolvers.Auth.AccountActions
  alias ProductCompareWeb.Resolvers.Auth.ApiTokens

  object :accounts_queries do
    @desc "Returns the current authenticated user, if any."
    field :viewer, :user, resolve: &AccountActions.viewer/3

    @desc "Returns API tokens owned by the current authenticated user."
    connection field :my_api_tokens, node_type: :api_token, non_null_connection: true do
      arg(:status, :api_token_status_filter)
      resolve(&ApiTokens.my_api_tokens/3)
    end
  end
end
