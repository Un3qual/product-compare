defmodule ProductCompareWeb.GraphQL.SchemaSnapshotTest do
  use ExUnit.Case, async: true

  test "the Relay schema snapshot matches the live Absinthe schema" do
    schema_path = Path.expand("../../../assets/schema.graphql", __DIR__)

    for module <- [
          ProductCompareWeb.Schema.Types.Common,
          ProductCompareWeb.Schema.Types.Accounts,
          ProductCompareWeb.Schema.Types.Commerce,
          ProductCompareWeb.Schema.Types.Catalog,
          ProductCompareWeb.Schema.Types.Trust
        ] do
      assert Code.ensure_loaded?(module)
    end

    assert File.read!(schema_path) == Absinthe.Schema.to_sdl(ProductCompareWeb.Schema)
  end
end
