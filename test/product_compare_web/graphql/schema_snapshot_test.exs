defmodule ProductCompareWeb.GraphQL.SchemaSnapshotTest do
  use ExUnit.Case, async: true

  test "the Relay schema snapshot matches the live Absinthe schema" do
    schema_path = Path.expand("../../../assets/schema.graphql", __DIR__)

    assert File.read!(schema_path) == Absinthe.Schema.to_sdl(ProductCompareWeb.Schema)
  end
end
