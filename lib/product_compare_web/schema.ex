defmodule ProductCompareWeb.Schema do
  use Absinthe.Schema

  import_types(Absinthe.Type.Custom)

  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.Resolvers.AuthResolver

  query do
    @desc "Returns the current authenticated user, if any."
    field :viewer, :user do
      resolve(&AuthResolver.viewer/3)
    end

    @desc "Returns API tokens owned by the current authenticated user."
    field :my_api_tokens, non_null(:api_token_connection) do
      arg(:first, :integer)
      arg(:after, :string)
      arg(:status, :api_token_status_filter)

      resolve(&AuthResolver.my_api_tokens/3)
    end
  end

  mutation do
    @desc "Creates a new API token for the current authenticated user."
    field :create_api_token, :create_api_token_payload do
      arg(:label, :string)
      arg(:expires_at, :datetime)

      resolve(&AuthResolver.create_api_token/3)
    end

    @desc "Revokes one of the current authenticated user's API tokens."
    field :revoke_api_token, :api_token do
      arg(:token_id, non_null(:id))

      resolve(&AuthResolver.revoke_api_token/3)
    end

    @desc "Rotates one of the current authenticated user's API tokens."
    field :rotate_api_token, :create_api_token_payload do
      arg(:token_id, non_null(:id))
      arg(:label, :string)
      arg(:expires_at, :datetime)

      resolve(&AuthResolver.rotate_api_token/3)
    end
  end

  object :create_api_token_payload do
    field :plain_text_token, non_null(:string)
    field :api_token, non_null(:api_token)
  end

  object :user do
    field :id, non_null(:id) do
      resolve(fn user, _, _ -> {:ok, GlobalId.encode(:user, user.entropy_id)} end)
    end

    field :email, non_null(:string)
  end

  object :api_token do
    field :id, non_null(:id) do
      resolve(fn api_token, _, _ -> {:ok, GlobalId.encode(:api_token, api_token.entropy_id)} end)
    end

    field :label, :string
    field :token_prefix, non_null(:string)
    field :last_used_at, :datetime
    field :expires_at, :datetime
    field :revoked_at, :datetime
    field :inserted_at, non_null(:datetime)
  end

  object :api_token_connection do
    field :edges, non_null(list_of(non_null(:api_token_edge)))
    field :page_info, non_null(:page_info)
  end

  object :api_token_edge do
    field :cursor, non_null(:string)
    field :node, non_null(:api_token)
  end

  enum :api_token_status_filter do
    value(:active)
    value(:revoked)
    value(:all)
  end

  object :page_info do
    field :has_next_page, non_null(:boolean)
    field :has_previous_page, non_null(:boolean)
    field :start_cursor, :string
    field :end_cursor, :string
  end
end
