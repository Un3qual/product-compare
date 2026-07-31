defmodule ProductCompareWeb.GraphQL.SchemaSnapshotTest do
  use ExUnit.Case, async: true

  test "the Relay schema snapshot matches the live Absinthe schema" do
    schema_path = Path.expand("../../../assets/schema.graphql", __DIR__)

    for module <- [
          ProductCompareWeb.Schema.Accounts.Types,
          ProductCompareWeb.Schema.Affiliate.Types,
          ProductCompareWeb.Schema.Alerts.Types,
          ProductCompareWeb.Schema.Catalog.Types,
          ProductCompareWeb.Schema.CommerceAttribution.Types,
          ProductCompareWeb.Schema.ComparisonSnapshots.Types,
          ProductCompareWeb.Schema.Discussions.Types,
          ProductCompareWeb.Schema.Ingestion.Types,
          ProductCompareWeb.Schema.Pricing.Types,
          ProductCompareWeb.Schema.Seo.Types,
          ProductCompareWeb.Schema.Specs.Types
        ] do
      assert Code.ensure_loaded?(module)
    end

    assert File.read!(schema_path) == Absinthe.Schema.to_sdl(ProductCompareWeb.Schema)
  end
end
