defmodule ProductCompareWeb.Schema.ComparisonSnapshots.Mutations do
  use Absinthe.Schema.Notation

  alias ProductCompareWeb.Resolvers.ComparisonSnapshotsResolver

  object :comparison_snapshots_mutations do
    @desc "Publishes an immutable comparison snapshot for the current user."
    field :publish_comparison_snapshot, non_null(:publish_comparison_snapshot_payload) do
      arg(:input, non_null(:publish_comparison_snapshot_input))
      resolve(&ComparisonSnapshotsResolver.publish/3)
    end

    @desc "Revokes one of the current user's public comparison snapshots."
    field :revoke_comparison_snapshot, non_null(:revoke_comparison_snapshot_payload) do
      arg(:snapshot_id, non_null(:id))
      resolve(&ComparisonSnapshotsResolver.revoke/3)
    end
  end
end
