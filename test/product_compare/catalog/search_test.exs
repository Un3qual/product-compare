defmodule ProductCompare.Catalog.SearchTest do
  use ProductCompare.DataCase, async: false

  import Ecto.Query

  alias ProductCompare.Catalog
  alias ProductCompare.Catalog.Search
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Catalog.Product

  test "orders matches through all seven relevance tiers" do
    description_contains =
      product(%{
        name: "Description Only",
        description: "Designed for xaurorax workflows"
      })

    typo = product(%{name: "Aurorra"})
    full_text = product(%{name: "Northern Lights", description: "aurora workflow"})
    contains = product(%{name: "Display for Aurora Creators"})
    prefix = product(%{name: "Aurora Pro Display"})
    slug_exact = product(%{name: "Beacon", slug: "aurora"})
    name_exact = product(%{name: "Aurora"})
    model_exact = product(%{name: "Zulu Model", model_number: "AURORA"})

    assert Enum.map(ranked_search("aurora"), & &1.id) == [
             model_exact.id,
             name_exact.id,
             slug_exact.id,
             prefix.id,
             contains.id,
             full_text.id,
             typo.id,
             description_contains.id
           ]
  end

  test "matches only validated GTIN identifiers after normalization" do
    validated = product(%{name: "Validated Identifier"})
    unverified = product(%{name: "Unverified Identifier"})
    rejected = product(%{name: "Rejected Identifier"})

    create_identifier!(validated, "validated")
    create_identifier!(unverified, "unverified")
    create_identifier!(rejected, "rejected")

    assert Enum.map(ranked_search("4006-3813-3393-1"), & &1.id) == [validated.id]
  end

  test "preserves indexed contains, full-text, and brand matches through candidate selection" do
    name_match =
      product(%{
        name: "aaaaaaaaaaaaaaaanameneedlezzzzzzzzzzzzzzzz",
        slug: "candidate-name-path"
      })

    slug_match =
      product(%{
        name: "Slug Candidate Reference",
        slug: "aaaaaaaaaaaaaaaaslugneedlezzzzzzzzzzzzzzzz"
      })

    model_match =
      product(%{
        name: "Model Candidate Reference",
        model_number: "aaaaaaaaaaaaaaaamodelneedlezzzzzzzzzzzzzzzz"
      })

    description_match =
      product(%{
        name: "Description Candidate Reference",
        description: "aaaaaaaaaaaaaaaadescneedlezzzzzzzzzzzzzzzz"
      })

    {:ok, brand} =
      Catalog.upsert_brand(%{
        name: "aaaaaaaaaaaaaaaabrandneedlezzzzzzzzzzzzzzzz"
      })

    brand_match =
      product(%{
        brand_id: brand.id,
        name: "Brand Candidate Reference"
      })

    full_text_match =
      product(%{
        name: "Morphology Candidate Reference",
        description: "A compact keyboard for studio work"
      })

    for {query, product} <- [
          {"nameneedle", name_match},
          {"slugneedle", slug_match},
          {"modelneedle", model_match},
          {"descneedle", description_match},
          {"brandneedle", brand_match},
          {"keyboards", full_text_match}
        ] do
      assert Enum.map(ranked_search(query), & &1.id) == [product.id]
    end
  end

  test "preserves trigram matches on every ranked text field through candidate selection" do
    name_match = product(%{name: "Monitora", slug: "candidate-trigram-name"})

    slug_match =
      product(%{
        name: "Slug Trigram Reference",
        slug: "peripherala"
      })

    model_match =
      product(%{
        name: "Model Trigram Reference",
        model_number: "RX7900A"
      })

    {:ok, brand} = Catalog.upsert_brand(%{name: "Logitecha"})
    brand_match = product(%{brand_id: brand.id, name: "Brand Trigram Reference"})

    for {query, field_value, product} <- [
          {"monitorb", name_match.name, name_match},
          {"peripheralb", slug_match.slug, slug_match},
          {"rx7900b", model_match.model_number, model_match},
          {"logitechb", brand.name, brand_match}
        ] do
      assert similarity(field_value, query) >= 0.35
      assert Enum.map(ranked_search(query), & &1.id) == [product.id]
    end
  end

  test "candidate selection keeps boundary-only trigrams and rejects overlap below 0.35" do
    above_threshold = product(%{name: "Ab", slug: "candidate-boundary-ab"})
    below_threshold = product(%{name: "Abx", slug: "candidate-boundary-abx"})

    assert similarity(above_threshold.name, "abc") >= 0.35
    assert similarity(below_threshold.name, "abc") < 0.35

    assert Enum.map(ranked_search("abc"), & &1.id) == [above_threshold.id]
  end

  test "enables trigram matching at three characters and enforces the similarity threshold" do
    monitor = product(%{name: "Monitor"})

    %Postgrex.Result{rows: [[above_threshold, below_threshold]]} =
      Repo.query!(
        "SELECT similarity(lower($1), lower($2)), similarity(lower($1), lower($3))",
        ["Monitor", "Monitr", "Moxyz"]
      )

    assert above_threshold >= 0.35
    assert below_threshold < 0.35
    assert Enum.map(ranked_search("monitr"), & &1.id) == [monitor.id]
    assert ranked_search("moxyz") == []
    assert Enum.map(ranked_search("mo"), & &1.id) == [monitor.id]
    assert ranked_search("mt") == []
  end

  test "matches a brand-only typo through the shared brand join" do
    {:ok, brand} = Catalog.upsert_brand(%{name: "Logitech"})
    brand_product = product(%{name: "Conference Camera", brand_id: brand.id})

    assert Enum.map(ranked_search("logitec"), & &1.id) == [brand_product.id]
  end

  test "uses normalized name and ID for deterministic ties and treats wildcards literally" do
    first = product(%{name: "Same Search Name", description: "literal %_\\ token"})
    second = product(%{name: "Same Search Name", description: "literal %_\\ token"})

    assert Enum.map(ranked_search("same search"), & &1.id) == [first.id, second.id]
    assert Enum.map(ranked_search("%_\\"), & &1.id) == [first.id, second.id]
    assert ranked_search("!!!") == []
  end

  test "requires every natural-query term across the combined persisted document" do
    {:ok, brand} = Catalog.upsert_brand(%{name: "Asterion Instruments"})

    complete =
      product(%{
        brand_id: brand.id,
        name: "Helios Drafting Keyboard",
        model_number: "RX-7900",
        slug: "helios-drafting-keyboard",
        description: "A compact mechanical keyboard for studio work"
      })

    product(%{
      brand_id: brand.id,
      name: "Helios Drafting Keyboard",
      model_number: "RX-7900",
      description: "A compact membrane keyboard for studio work"
    })

    assert Enum.map(
             ranked_search("Asterion Helios RX-7900 drafting mechanical"),
             & &1.id
           ) == [complete.id]
  end

  test "matches technical tokens through the simple search configuration" do
    technical =
      product(%{
        name: "Technical Reference",
        model_number: "RX-7900",
        description: "Discrete graphics architecture"
      })

    assert Enum.map(ranked_search("RX 7900"), & &1.id) == [technical.id]
  end

  test "matches English morphology through the persisted document" do
    keyboard = product(%{name: "Input Reference", description: "A compact keyboard"})

    assert Enum.map(ranked_search("keyboards"), & &1.id) == [keyboard.id]
  end

  test "quoted phrases require order and adjacency" do
    adjacent = product(%{name: "Adjacent Terms", description: "A mechanical keyboard for work"})
    product(%{name: "Reversed Terms", description: "A keyboard mechanical layout"})
    product(%{name: "Separated Terms", description: "A mechanical compact keyboard"})

    assert Enum.map(ranked_search("\"mechanical keyboard\""), & &1.id) == [adjacent.id]
  end

  test "websearch OR syntax matches either branch" do
    keyboard = product(%{name: "Keyboard Branch", description: "A compact keyboard"})
    mouse = product(%{name: "Mouse Branch", description: "A precise mouse"})
    product(%{name: "Unrelated Branch", description: "A drawing tablet"})

    assert MapSet.new(Enum.map(ranked_search("keyboard OR mouse"), & &1.id)) ==
             MapSet.new([keyboard.id, mouse.id])
  end

  test "websearch exclusion syntax removes negative terms" do
    wired = product(%{name: "Wired Input", description: "A wired keyboard"})
    product(%{name: "Cordless Input", description: "A wireless keyboard"})

    assert Enum.map(ranked_search("keyboard -wireless"), & &1.id) == [wired.id]
  end

  test "stopword-only and punctuation-only queries return safely" do
    assert ranked_search("the and") == []
    assert ranked_search("!!!") == []
  end

  test "weighted full-text rank places a name lexeme ahead of a description lexeme" do
    description_match =
      product(%{
        name: "Input Reference",
        model_number: "KEYBOARS",
        description: "A compact keyboard for work"
      })

    name_match =
      product(%{
        name: "Studio Keyboard",
        model_number: "KEYBOARS",
        description: "A compact input device"
      })

    assert Enum.map(ranked_search("keyboards"), & &1.id) == [
             name_match.id,
             description_match.id
           ]
  end

  test "equal tier-five rank and similarity use normalized name and then ID" do
    later_name =
      product(%{
        name: "Zulu Reference",
        model_number: "KEYBOARS",
        description: "A compact keyboard"
      })

    first =
      product(%{
        name: "Alpha Reference",
        model_number: "KEYBOARS",
        description: "A compact keyboard"
      })

    second =
      product(%{
        name: "Alpha Reference",
        model_number: "KEYBOARS",
        description: "A compact keyboard"
      })

    assert Enum.map(ranked_search("keyboards"), & &1.id) == [
             first.id,
             second.id,
             later_name.id
           ]
  end

  defp ranked_search(query) do
    Product
    |> from(as: :product)
    |> Search.apply_match(query)
    |> Search.order_by_relevance(query)
    |> Repo.all()
  end

  defp similarity(left, right) do
    %Postgrex.Result{rows: [[similarity]]} =
      Repo.query!("SELECT similarity(lower($1), lower($2))", [left, right])

    similarity
  end

  defp product(attrs) do
    SpecsFixtures.product_fixture(
      Map.put_new_lazy(attrs, :slug, fn ->
        "ranked-search-#{System.unique_integer([:positive])}"
      end)
    )
  end

  defp create_identifier!(product, status, normalized_value \\ "4006381333931") do
    {:ok, identifier} =
      Catalog.create_product_identifier(%{
        product_id: product.id,
        scheme: "gtin",
        normalized_value: normalized_value,
        display_value: normalized_value,
        verification_status: status
      })

    identifier
  end
end
