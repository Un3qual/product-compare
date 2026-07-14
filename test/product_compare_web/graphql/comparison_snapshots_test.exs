defmodule ProductCompareWeb.GraphQL.ComparisonSnapshotsTest do
  use ProductCompareWeb.ConnCase, async: false

  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing
  alias ProductCompareWeb.GraphQL.GlobalId

  test "authenticated publish returns a share path and public self-contained snapshot", %{
    conn: conn
  } do
    owner = AccountsFixtures.user_fixture()
    {first, _first_point} = product_with_price("First lens", "first-lens", "120")
    {second, second_point} = product_with_price("Second lens", "second-lens", "90")
    authenticated = conn |> log_in_user(owner) |> put_req_header_same_origin()

    assert %{
             "data" => %{
               "publishComparisonSnapshot" => %{
                 "snapshot" => %{
                   "id" => snapshot_id,
                   "title" => "Lens shortlist",
                   "searchIndexable" => true,
                   "seo" => %{"indexable" => false},
                   "products" => products,
                   "disclaimer" => disclaimer
                 },
                 "sharePath" => share_path,
                 "errors" => []
               }
             }
           } =
             graphql(authenticated, publish_mutation(), %{
               "input" => %{
                 "title" => "Lens shortlist",
                 "productIds" => [relay_id(:product, second.id), relay_id(:product, first.id)],
                 "recommendationProfile" => "LOWEST_CURRENT_COST",
                 "searchIndexable" => true
               }
             })

    assert Enum.map(products, & &1["slug"]) == ["second-lens", "first-lens"]
    assert {:ok, _entropy_id} = GlobalId.decode_uuid(snapshot_id, :comparison_snapshot)
    assert disclaimer =~ "captured"
    assert String.starts_with?(share_path, "/compare/shared/")
    token = String.replace_prefix(share_path, "/compare/shared/", "")

    assert %{
             "data" => %{
               "comparisonSnapshot" => %{
                 "title" => "Lens shortlist",
                 "products" => public_products,
                 "recommendation" => %{"status" => "WINNER"}
               }
             }
           } = graphql(conn, public_query(), %{"token" => token})

    assert Enum.map(public_products, & &1["name"]) == ["Second lens", "First lens"]

    assert get_in(hd(public_products), ["offers", Access.at(0), "pricePointId"]) ==
             relay_id(:price_point, second_point.id)

    assert get_in(hd(public_products), ["offers", Access.at(0), "landedPrice"]) == "90"
    refute inspect(public_products) =~ owner.email
  end

  test "publish requires authentication and valid product IDs", %{conn: conn} do
    product = SpecsFixtures.product_fixture()

    assert %{
             "data" => %{
               "publishComparisonSnapshot" => %{
                 "snapshot" => nil,
                 "sharePath" => nil,
                 "errors" => [%{"code" => "UNAUTHENTICATED"}]
               }
             }
           } =
             graphql(conn, publish_mutation(), %{
               "input" => %{
                 "productIds" => [relay_id(:product, product.id), relay_id(:product, product.id)],
                 "recommendationProfile" => "BEST_VALUE"
               }
             })
  end

  test "only the owner can revoke and revoked tokens resolve as not found", %{conn: conn} do
    owner = AccountsFixtures.user_fixture()
    other = AccountsFixtures.user_fixture()
    first = SpecsFixtures.product_fixture()
    second = SpecsFixtures.product_fixture()
    owner_conn = conn |> log_in_user(owner) |> put_req_header_same_origin()

    response =
      graphql(owner_conn, publish_mutation(), %{
        "input" => %{
          "productIds" => [relay_id(:product, first.id), relay_id(:product, second.id)],
          "recommendationProfile" => "LOWEST_CURRENT_COST"
        }
      })

    snapshot_id = get_in(response, ["data", "publishComparisonSnapshot", "snapshot", "id"])
    share_path = get_in(response, ["data", "publishComparisonSnapshot", "sharePath"])
    token = String.replace_prefix(share_path, "/compare/shared/", "")
    other_conn = conn |> log_in_user(other) |> put_req_header_same_origin()

    assert get_in(graphql(other_conn, revoke_mutation(), %{"id" => snapshot_id}), [
             "data",
             "revokeComparisonSnapshot",
             "errors",
             Access.at(0),
             "code"
           ]) == "NOT_FOUND"

    assert get_in(graphql(owner_conn, revoke_mutation(), %{"id" => snapshot_id}), [
             "data",
             "revokeComparisonSnapshot",
             "revokedSnapshotId"
           ]) == snapshot_id

    assert get_in(graphql(conn, public_query(), %{"token" => token}), [
             "data",
             "comparisonSnapshot"
           ]) == nil
  end

  test "viewer can rediscover active snapshots for later revocation", %{conn: conn} do
    owner = AccountsFixtures.user_fixture()
    other = AccountsFixtures.user_fixture()
    first = SpecsFixtures.product_fixture()
    second = SpecsFixtures.product_fixture()
    owner_conn = conn |> log_in_user(owner) |> put_req_header_same_origin()

    response =
      graphql(owner_conn, publish_mutation(), %{
        "input" => %{
          "title" => "Durable shortlist",
          "productIds" => [relay_id(:product, first.id), relay_id(:product, second.id)],
          "recommendationProfile" => "LOWEST_CURRENT_COST"
        }
      })

    snapshot_id = get_in(response, ["data", "publishComparisonSnapshot", "snapshot", "id"])
    share_path = get_in(response, ["data", "publishComparisonSnapshot", "sharePath"])

    assert [%{"node" => owned_snapshot}] =
             get_in(graphql(owner_conn, viewer_snapshots_query(), %{}), [
               "data",
               "viewer",
               "comparisonSnapshots",
               "edges"
             ])

    assert Map.take(owned_snapshot, ["id", "title", "sharePath"]) == %{
             "id" => snapshot_id,
             "title" => "Durable shortlist",
             "sharePath" => share_path
           }

    assert is_binary(owned_snapshot["capturedAt"])

    other_conn = conn |> log_in_user(other) |> put_req_header_same_origin()

    assert get_in(graphql(other_conn, viewer_snapshots_query(), %{}), [
             "data",
             "viewer",
             "comparisonSnapshots",
             "edges"
           ]) == []

    graphql(owner_conn, revoke_mutation(), %{"id" => snapshot_id})

    assert get_in(graphql(owner_conn, viewer_snapshots_query(), %{}), [
             "data",
             "viewer",
             "comparisonSnapshots",
             "edges"
           ]) == []
  end

  defp graphql(conn, query, variables) do
    conn |> post("/api/graphql", %{query: query, variables: variables}) |> json_response(200)
  end

  defp product_with_price(name, slug, price) do
    product = SpecsFixtures.product_fixture(%{name: name, slug: slug})

    {:ok, merchant} =
      Pricing.upsert_merchant(%{
        name: "#{name} merchant #{System.unique_integer([:positive])}",
        domain: "snapshot-#{System.unique_integer([:positive])}.example"
      })

    {:ok, offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://snapshot.example/#{System.unique_integer([:positive])}",
        currency: "USD",
        is_active: true
      })

    {:ok, point} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: DateTime.utc_now(),
        price: price,
        shipping: "0",
        in_stock: true
      })

    {product, point}
  end

  defp publish_mutation do
    """
    mutation PublishSnapshot($input: PublishComparisonSnapshotInput!) {
      publishComparisonSnapshot(input: $input) {
        snapshot {
          id title searchIndexable capturedAt disclaimer
          seo { title canonicalPath indexable structuredData }
          products { id name slug brandName attributes { claimId displayName valueText } offers { pricePointId landedPrice currency observedAt merchantName } }
          recommendation { profile algorithmVersion status winnerProductId missingInputs rankings { productId pricePointId claimIds reasons } }
        }
        sharePath
        errors { code message field }
      }
    }
    """
  end

  defp public_query do
    """
    query PublicSnapshot($token: String!) {
      comparisonSnapshot(token: $token) {
        id title capturedAt disclaimer
        products { id name slug brandName attributes { claimId displayName valueText } offers { pricePointId landedPrice currency observedAt merchantName } }
        recommendation { profile algorithmVersion status winnerProductId missingInputs rankings { productId pricePointId claimIds reasons } }
      }
    }
    """
  end

  defp revoke_mutation do
    """
    mutation RevokeSnapshot($id: ID!) {
      revokeComparisonSnapshot(snapshotId: $id) {
        revokedSnapshotId
        errors { code message field }
      }
    }
    """
  end

  defp viewer_snapshots_query do
    """
    query ViewerSnapshots {
      viewer {
        comparisonSnapshots(first: 10) {
          edges { node { id title sharePath capturedAt } }
        }
      }
    }
    """
  end
end
