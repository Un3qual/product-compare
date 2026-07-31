defmodule ProductCompareWeb.GraphQL.SchemaArchitectureTest do
  use ExUnit.Case, async: true

  @project_root Path.expand("../../..", __DIR__)
  @schema_root Path.join(@project_root, "lib/product_compare_web/schema")
  @root_schema Path.join(@project_root, "lib/product_compare_web/schema.ex")
  @graphql_root Path.join(@project_root, "lib/product_compare_web/graphql")

  @contexts ~w(
    accounts
    affiliate
    alerts
    catalog
    commerce_attribution
    comparison_snapshots
    discussions
    ingestion
    pricing
    seo
    specs
  )

  test "the GraphQL loader contains no KV source" do
    offenders =
      [@graphql_root, @schema_root, @root_schema]
      |> source_files()
      |> Enum.filter(&(File.read!(&1) =~ "Dataloader.KV"))

    assert offenders == []
  end

  test "global types live in schema.ex without a Common module" do
    refute File.exists?(Path.join(@schema_root, "types/common.ex"))

    refute Enum.any?(source_files(@schema_root), fn path ->
             File.read!(path) =~ "Schema.Types.Common"
           end)
  end

  test "Relay modern mode owns Node and connection declarations" do
    root_source = File.read!(@root_schema)
    schema_source = @schema_root |> source_files() |> Enum.map_join("\n", &File.read!/1)

    assert root_source =~ "use Absinthe.Relay.Schema, :modern"
    refute schema_source =~ ~r/\binterface\s+:node\b/
    refute schema_source =~ ~r/\bobject\s+:page_info\b/
    refute schema_source =~ ~r/\bobject\s+:[a-z0-9_]+_(connection|edge)\b/
    assert length(Regex.scan(~r/\bnode\s+object(?:\s+|\():/, schema_source)) >= 12
    assert length(Regex.scan(~r/\bconnection(?:\s+|\(\s*)node_type:/, schema_source)) >= 17
  end

  test "each context owns separate types, queries, and mutations modules" do
    missing =
      for context <- @contexts,
          kind <- ~w(types queries mutations),
          path = Path.join([@schema_root, context, "#{kind}.ex"]),
          not File.exists?(path),
          do: path

    assert missing == []
  end

  test "the root schema composes context fields without declaring them inline" do
    source = File.read!(@root_schema)

    assert source =~ "query do"
    assert source =~ "mutation do"
    refute root_operation_body(source, "query") =~ ~r/\bfield\s+:/
    refute root_operation_body(source, "mutation") =~ ~r/\bfield\s+:/
  end

  test "schema fields reference resolver owners without pass-through facades" do
    facades = ~w(
      affiliate_resolver.ex
      alerts_resolver.ex
      auth_resolver.ex
      commerce_attribution_resolver.ex
      discussions_resolver.ex
      pricing_resolver.ex
      specs_resolver.ex
    )

    assert Enum.all?(facades, fn filename ->
             not File.exists?(
               Path.join(@project_root, "lib/product_compare_web/resolvers/#{filename}")
             )
           end)
  end

  defp source_files(paths) when is_list(paths) do
    Enum.flat_map(paths, &source_files/1)
  end

  defp source_files(path) do
    cond do
      File.regular?(path) ->
        [path]

      File.dir?(path) ->
        Path.wildcard(Path.join(path, "**/*.ex"))

      true ->
        []
    end
  end

  defp root_operation_body(source, operation) do
    case Regex.run(~r/#{operation}\s+do(?<body>.*?)^\s*end$/ms, source, capture: ["body"]) do
      [body] -> body
      nil -> ""
    end
  end
end
