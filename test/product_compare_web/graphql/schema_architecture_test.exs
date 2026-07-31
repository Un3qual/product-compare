defmodule ProductCompareWeb.GraphQL.SchemaArchitectureTest do
  use ExUnit.Case, async: true

  @project_root Path.expand("../../..", __DIR__)
  @schema_root Path.join(@project_root, "lib/product_compare_web/schema")
  @root_schema Path.join(@project_root, "lib/product_compare_web/schema.ex")
  @graphql_root Path.join(@project_root, "lib/product_compare_web/graphql")
  @schema_sdl Path.join(@project_root, "assets/schema.graphql")

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
  @mutation_contexts @contexts -- ~w(pricing seo)
  @stable_node_types ~w(
    affiliate_link
    affiliate_network
    affiliate_program
    alert_event
    api_token
    brand
    cj_program
    comparison_snapshot
    coupon
    merchant
    merchant_feed_candidate
    merchant_product
    price_point
    price_watch
    product
    product_answer
    product_question
    product_review
    saved_comparison_set
    source_artifact
    specification_correction
    user
  )a

  test "the GraphQL loader contains no KV source" do
    offenders =
      [@graphql_root, @schema_root, @root_schema]
      |> source_files()
      |> Enum.filter(&(File.read!(&1) =~ "Dataloader.KV"))

    assert offenders == []
  end

  test "the GraphQL loader registers only honest Ecto sources" do
    refute File.exists?(Path.join(@graphql_root, "loader/ecto_batch_source.ex"))

    assert %Dataloader{sources: sources} = ProductCompareWeb.GraphQL.Loader.new()
    assert sources != %{}
    assert Enum.all?(sources, fn {_name, source} -> match?(%Dataloader.Ecto{}, source) end)
  end

  test "Relay-native schema names and root coupon connection stay canonical" do
    sdl = File.read!(@schema_sdl)

    assert sdl =~
             ~r/activeCoupons\([^)]*after: String[^)]*first: Int![^)]*merchantId: ID![^)]*at: DateTime[^)]*\): CouponConnection/

    assert sdl =~ "type CJProgramConnection"
    assert sdl =~ "type CJProgramEdge"
    refute sdl =~ "type CjProgramConnection"
    refute sdl =~ "type CjProgramEdge"
    refute sdl =~ "ActiveCouponsPayload"
    refute sdl =~ "ActiveCouponsInput"
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

    declared_node_types =
      schema_source
      |> then(&Regex.scan(~r/\bnode\s+object\(\s*:([a-z0-9_]+)/, &1, capture: :all_but_first))
      |> List.flatten()
      |> Enum.map(&String.to_existing_atom/1)
      |> Enum.sort()

    assert declared_node_types == Enum.sort(@stable_node_types)

    assert schema_source
           |> then(&Regex.scan(~r/\bconnection(?:\s+|\(\s*)node_type:/, &1))
           |> Enum.count_until(17) == 17
  end

  test "generated connections expose a bounded forward-only contract" do
    sdl = File.read!(@schema_sdl)

    refute sdl =~ ~r/\b(?:before|last):/

    assert sdl
           |> then(
             &Regex.scan(
               ~r/type \w+Edge \{\s+node: \w+!\s+cursor: String!\s+\}/,
               &1
             )
           )
           |> Enum.count_until(17) == 17

    assert [merchant_products_input] =
             Regex.run(
               ~r/input MerchantProductsInput \{(?<body>.*?)\}/s,
               sdl,
               capture: ["body"]
             )

    refute merchant_products_input =~ ~r/\b(?:first|after):/
  end

  test "each context owns types and queries while mutation contexts own non-empty modules" do
    missing =
      for context <- @contexts,
          kind <- ~w(types queries),
          path = Path.join([@schema_root, context, "#{kind}.ex"]),
          not File.exists?(path),
          do: path

    missing_mutations =
      for context <- @mutation_contexts,
          path = Path.join([@schema_root, context, "mutations.ex"]),
          not File.exists?(path),
          do: path

    assert missing ++ missing_mutations == []
    refute File.exists?(Path.join([@schema_root, "pricing/mutations.ex"]))
    refute File.exists?(Path.join([@schema_root, "seo/mutations.ex"]))
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
