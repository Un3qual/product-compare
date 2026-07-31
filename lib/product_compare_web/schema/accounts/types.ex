defmodule ProductCompareWeb.Schema.Accounts.Types do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

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

    connection field :comparison_snapshots,
                 node_type: :comparison_snapshot,
                 non_null_connection: true,
                 paginate: :forward do
      resolve(&ComparisonSnapshotsResolver.owned_snapshots/3)
    end
  end

  node object(:api_token, id_fetcher: &GlobalId.fetch_entropy_id/2) do
    field :label, :string
    field :token_prefix, non_null(:string)
    field :last_used_at, :datetime
    field :expires_at, :datetime
    field :revoked_at, :datetime
    field :inserted_at, non_null(:datetime)
  end

  connection node_type: :api_token, non_null_edges: true, non_null_edge: true do
    edge do
      field :node, non_null(:api_token)
      field :cursor, non_null(:string)
    end
  end

  enum :api_token_status_filter do
    value(:active)
    value(:revoked)
    value(:all)
  end
end
