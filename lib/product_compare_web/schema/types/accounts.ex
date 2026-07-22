defmodule ProductCompareWeb.Schema.Types.Accounts do
  use Absinthe.Schema.Notation

  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.Resolvers.ComparisonSnapshotsResolver

  object :create_api_token_payload do
    field :plain_text_token, :string
    field :api_token, :api_token
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :auth_session_payload do
    field :viewer, :user
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :logout_payload do
    field :ok, non_null(:boolean)
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :auth_action_payload do
    field :ok, non_null(:boolean)
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :revoke_api_token_payload do
    field :api_token, :api_token
    field :errors, non_null(list_of(non_null(:mutation_error)))
  end

  object :user do
    field :id, non_null(:id) do
      resolve(fn user, _, _ -> {:ok, GlobalId.encode(:user, user.entropy_id)} end)
    end

    field :email, non_null(:string)
    field :is_operator, non_null(:boolean)

    field :comparison_snapshots, non_null(:comparison_snapshot_connection) do
      arg(:first, :integer)
      arg(:after, :string)
      resolve(&ComparisonSnapshotsResolver.owned_snapshots/3)
    end
  end

  object :api_token do
    interface(:node)

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
end
