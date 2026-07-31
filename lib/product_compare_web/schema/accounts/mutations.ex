defmodule ProductCompareWeb.Schema.Accounts.Mutations do
  use Absinthe.Schema.Notation

  alias ProductCompareWeb.Resolvers.AuthResolver

  object :accounts_mutations do
    @desc "Creates a new user session by registering an email/password account."
    field :register, non_null(:auth_session_payload) do
      arg(:email, non_null(:string))
      arg(:password, non_null(:string))
      resolve(&AuthResolver.register/3)
    end

    @desc "Creates a new user session from email/password credentials."
    field :login, non_null(:auth_session_payload) do
      arg(:email, non_null(:string))
      arg(:password, non_null(:string))
      resolve(&AuthResolver.login/3)
    end

    @desc "Deletes the current browser session."
    field :logout, non_null(:logout_payload), resolve: &AuthResolver.logout/3

    @desc "Requests a password reset email for an existing account."
    field :forgot_password, non_null(:auth_action_payload) do
      arg(:email, non_null(:string))
      resolve(&AuthResolver.forgot_password/3)
    end

    @desc "Resets an account password using a previously issued reset token."
    field :reset_password, non_null(:auth_action_payload) do
      arg(:token, non_null(:string))
      arg(:password, non_null(:string))
      resolve(&AuthResolver.reset_password/3)
    end

    @desc "Confirms an account email using a previously issued verification token."
    field :verify_email, non_null(:auth_action_payload) do
      arg(:token, non_null(:string))
      resolve(&AuthResolver.verify_email/3)
    end

    @desc "Creates a new API token for the current authenticated user."
    field :create_api_token, non_null(:create_api_token_payload) do
      arg(:label, :string)
      arg(:expires_at, :datetime)
      resolve(&AuthResolver.create_api_token/3)
    end

    @desc "Revokes one of the current authenticated user's API tokens."
    field :revoke_api_token, non_null(:revoke_api_token_payload) do
      arg(:token_id, non_null(:id))
      resolve(&AuthResolver.revoke_api_token/3)
    end

    @desc "Rotates one of the current authenticated user's API tokens."
    field :rotate_api_token, non_null(:create_api_token_payload) do
      arg(:token_id, non_null(:id))
      arg(:label, :string)
      arg(:expires_at, :datetime)
      resolve(&AuthResolver.rotate_api_token/3)
    end
  end
end
