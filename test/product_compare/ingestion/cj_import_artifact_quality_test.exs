defmodule ProductCompare.Ingestion.CJImportArtifactQualityTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Ingestion.CJImportArtifactQuality
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.ExternalProduct
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Specs.SourceArtifact

  describe "summary/0" do
    test "returns zero counts when the CJ source is missing" do
      assert %{
               provider: "cj",
               source_present: false,
               artifact_count: 0,
               external_product_count: 0,
               linked_external_product_count: 0,
               unlinked_external_product_count: 0,
               latest_artifact_fetched_at: nil,
               latest_external_product_seen_at: nil
             } = summary = CJImportArtifactQuality.summary()

      assert_safe_summary(summary)
    end

    test "summarizes persisted CJ artifacts and external products without raw fields" do
      cj_source = source_fixture(%{kind: "affiliate_feed", name: "CJ", domain: "cj.com"})
      other_source = source_fixture(%{name: "Other source"})
      linked_product = SpecsFixtures.product_fixture(%{slug: "cj-linked-product"})

      source_artifact_fixture(cj_source, %{
        fetched_at: ~U[2026-07-01 10:00:00Z],
        content_hash: "hash-older",
        raw_json: %{"token" => "secret"},
        url: "https://example.invalid/secret"
      })

      latest_artifact =
        source_artifact_fixture(cj_source, %{
          fetched_at: ~U[2026-07-02 10:00:00Z],
          content_hash: "hash-newer"
        })

      source_artifact_fixture(other_source, %{
        fetched_at: ~U[2026-07-03 10:00:00Z],
        content_hash: "hash-other"
      })

      external_product_fixture(cj_source, %{
        external_id: "linked",
        product_id: linked_product.id,
        last_seen_at: ~U[2026-07-01 12:00:00Z]
      })

      latest_external_product =
        external_product_fixture(cj_source, %{
          external_id: "unlinked",
          product_id: nil,
          last_seen_at: ~U[2026-07-02 12:00:00Z],
          canonical_url: "https://merchant.invalid/secret"
        })

      external_product_fixture(other_source, %{
        external_id: "other",
        product_id: nil,
        last_seen_at: ~U[2026-07-03 12:00:00Z]
      })

      latest_artifact_fetched_at = latest_artifact.fetched_at
      latest_external_product_seen_at = latest_external_product.last_seen_at

      assert %{
               provider: "cj",
               source_present: true,
               artifact_count: 2,
               external_product_count: 2,
               linked_external_product_count: 1,
               unlinked_external_product_count: 1,
               latest_artifact_fetched_at: ^latest_artifact_fetched_at,
               latest_external_product_seen_at: ^latest_external_product_seen_at
             } = summary = CJImportArtifactQuality.summary()

      assert_safe_summary(summary)
    end
  end

  defp source_fixture(attrs) do
    suffix = System.unique_integer([:positive])

    %Source{}
    |> Source.changeset(
      Map.merge(
        %{
          kind: "affiliate_feed",
          name: "CJ #{suffix}",
          domain: "cj-#{suffix}.example"
        },
        attrs
      )
    )
    |> Repo.insert!()
  end

  defp source_artifact_fixture(source, attrs) do
    suffix = System.unique_integer([:positive])

    attrs =
      Map.merge(
        %{
          source_id: source.id,
          fetched_at: ~U[2026-07-01 12:00:00Z],
          content_hash: "artifact-#{suffix}",
          raw_json: %{"secret" => "hidden"},
          url: "https://example.invalid/artifact-#{suffix}"
        },
        attrs
      )

    %SourceArtifact{}
    |> SourceArtifact.changeset(attrs)
    |> Repo.insert!()
  end

  defp external_product_fixture(source, attrs) do
    suffix = System.unique_integer([:positive])

    attrs =
      Map.merge(
        %{
          source_id: source.id,
          external_id: "external-#{suffix}",
          product_id: nil,
          canonical_url: "https://example.invalid/product-#{suffix}",
          last_seen_at: ~U[2026-07-01 12:00:00Z]
        },
        attrs
      )

    %ExternalProduct{}
    |> ExternalProduct.changeset(attrs)
    |> Repo.insert!()
  end

  defp assert_safe_summary(summary) do
    keys = summary |> Map.keys() |> MapSet.new()

    assert MapSet.disjoint?(
             keys,
             MapSet.new([:raw_json, :raw_text, :url, :canonical_url, :query, :credentials])
           )
  end
end
