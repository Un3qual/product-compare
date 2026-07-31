defmodule ProductCompareWeb.Schema.ComparisonSnapshots.Queries do
  use Absinthe.Schema.Notation

  alias ProductCompareWeb.Resolvers.ComparisonSnapshotsResolver

  object :comparison_snapshots_queries do
    @desc "Returns a published, non-revoked immutable comparison snapshot."
    field :comparison_snapshot, :comparison_snapshot do
      arg(:token, non_null(:string))
      resolve(&ComparisonSnapshotsResolver.comparison_snapshot/3)
    end
  end
end
