defmodule ProductCompareWeb.GraphQL.PriceWatchesAndAlertsTest do
  use ProductCompareWeb.ConnCase, async: false

  alias ProductCompare.Alerts
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareWeb.Resolvers.Alerts.Reads
  alias ProductCompareSchemas.Alerts.PriceWatchRule

  test "watch and inbox APIs require authentication", %{conn: conn} do
    assert %{"data" => nil, "errors" => [_]} =
             graphql(conn, watches_query(), %{})

    assert %{
             "data" => %{
               "createPriceWatch" => %{
                 "watch" => nil,
                 "errors" => [%{"code" => "UNAUTHENTICATED"}]
               }
             }
           } = graphql(conn, create_watch_mutation(), %{"input" => sample_watch_input()})

    assert Repo.aggregate(PriceWatchRule, :count, :id) == 0
  end

  test "creates, updates, lists, and deletes only owned watches", %{conn: conn} do
    owner = AccountsFixtures.user_fixture()
    stranger = AccountsFixtures.user_fixture()
    %{product: product} = offer_fixture()
    owner_conn = auth_conn(conn, owner)
    stranger_conn = auth_conn(conn, stranger)

    input =
      sample_watch_input(%{
        "productId" => relay_id(:product, product.id),
        "targetAmount" => "75"
      })

    assert %{
             "data" => %{
               "createPriceWatch" => %{
                 "watch" => %{
                   "id" => watch_id,
                   "productName" => product_name,
                   "ruleType" => "TARGET_PRICE",
                   "currency" => "USD",
                   "targetAmount" => "75",
                   "enabled" => true
                 },
                 "errors" => []
               }
             }
           } = graphql(owner_conn, create_watch_mutation(), %{"input" => input})

    assert product_name == product.name

    assert %{"data" => %{"myPriceWatches" => %{"edges" => []}}} =
             graphql(stranger_conn, watches_query(), %{})

    assert %{
             "data" => %{
               "updatePriceWatch" => %{
                 "watch" => nil,
                 "errors" => [%{"code" => "NOT_FOUND"}]
               }
             }
           } =
             graphql(stranger_conn, update_watch_mutation(), %{
               "input" => %{"id" => watch_id, "enabled" => false}
             })

    assert %{
             "data" => %{
               "updatePriceWatch" => %{
                 "watch" => %{"id" => ^watch_id, "enabled" => false},
                 "errors" => []
               }
             }
           } =
             graphql(owner_conn, update_watch_mutation(), %{
               "input" => %{"id" => watch_id, "enabled" => false}
             })

    assert %{
             "data" => %{
               "deletePriceWatch" => %{"deletedWatchId" => ^watch_id, "errors" => []}
             }
           } = graphql(owner_conn, delete_watch_mutation(), %{"id" => watch_id})
  end

  test "returns immutable in-app events and owner-only read state", %{conn: conn} do
    owner = AccountsFixtures.user_fixture()
    stranger = AccountsFixtures.user_fixture()
    %{product: product, merchant_product: offer} = offer_fixture()
    owner_conn = auth_conn(conn, owner)
    stranger_conn = auth_conn(conn, stranger)

    {:ok, _watch} =
      Alerts.create_watch(owner.id, %{
        product_id: product.id,
        rule_type: :target_price,
        currency: "USD",
        target_amount: "50"
      })

    {:ok, point} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        price: "40",
        shipping: "5",
        in_stock: true,
        observed_at: ~U[2026-07-13 21:00:00Z]
      })

    {:ok, %{events_created: 1}} =
      Alerts.evaluate_price_point(point.id, now: ~U[2026-07-13 21:00:00Z])

    assert %{
             "data" => %{
               "myAlertEvents" => %{
                 "edges" => [
                   %{
                     "node" => %{
                       "id" => event_id,
                       "productName" => product_name,
                       "ruleType" => "TARGET_PRICE",
                       "currency" => "USD",
                       "landedPrice" => "45",
                       "itemPrice" => "40",
                       "shipping" => "5",
                       "readAt" => nil
                     }
                   }
                 ]
               }
             }
           } = graphql(owner_conn, events_query(), %{})

    assert product_name == product.name

    assert %{"data" => %{"myAlertEvents" => %{"edges" => []}}} =
             graphql(stranger_conn, events_query(), %{})

    assert %{
             "data" => %{
               "markAlertRead" => %{
                 "event" => nil,
                 "errors" => [%{"code" => "NOT_FOUND"}]
               }
             }
           } = graphql(stranger_conn, mark_read_mutation(), %{"id" => event_id})

    assert %{
             "data" => %{
               "markAlertRead" => %{
                 "event" => %{
                   "id" => ^event_id,
                   "readAt" => read_at,
                   "merchantName" => merchant_name,
                   "productName" => ^product_name
                 },
                 "errors" => []
               }
             }
           } = graphql(owner_conn, mark_read_mutation(), %{"id" => event_id})

    assert is_binary(read_at)
    assert is_binary(merchant_name)
  end

  test "my_price_watches directly filters and paginates without a loader" do
    owner = AccountsFixtures.user_fixture()
    other_user = AccountsFixtures.user_fixture()
    first_enabled = price_watch_fixture(owner)
    second_enabled = price_watch_fixture(owner)
    disabled = price_watch_fixture(owner)
    _other_enabled = price_watch_fixture(other_user)

    assert {:ok, _disabled} =
             Alerts.update_watch(owner.id, disabled.entropy_id, %{enabled: false})

    resolution = %{context: %{current_user: owner}}

    assert {:ok,
            %{
              edges: [%{cursor: cursor, node: first_node}],
              page_info: %{has_next_page: true, has_previous_page: false}
            }} =
             Reads.my_price_watches(nil, %{enabled: true, first: 1}, resolution)

    assert {:ok,
            %{
              edges: [%{node: second_node}],
              page_info: %{has_next_page: false, has_previous_page: true}
            }} =
             Reads.my_price_watches(
               nil,
               %{enabled: true, first: 1, after: cursor},
               resolution
             )

    assert MapSet.new([first_node.id, second_node.id]) ==
             MapSet.new([first_enabled.id, second_enabled.id])

    refute disabled.id in [first_node.id, second_node.id]
  end

  test "my_alert_events directly filters and paginates without a loader" do
    owner = AccountsFixtures.user_fixture()
    other_user = AccountsFixtures.user_fixture()
    first_unread = alert_event_fixture(owner, ~U[2026-07-13 21:00:00Z])
    second_unread = alert_event_fixture(owner, ~U[2026-07-13 22:00:00Z])
    read_event = alert_event_fixture(owner, ~U[2026-07-13 23:00:00Z])
    _other_unread = alert_event_fixture(other_user, ~U[2026-07-14 00:00:00Z])

    assert {:ok, _read_event} = Alerts.mark_alert_read(owner.id, read_event.entropy_id)

    resolution = %{context: %{current_user: owner}}

    assert {:ok,
            %{
              edges: [%{cursor: cursor, node: first_node}],
              page_info: %{has_next_page: true, has_previous_page: false}
            }} =
             Reads.my_alert_events(nil, %{unread_only: true, first: 1}, resolution)

    assert {:ok,
            %{
              edges: [%{node: second_node}],
              page_info: %{has_next_page: false, has_previous_page: true}
            }} =
             Reads.my_alert_events(
               nil,
               %{unread_only: true, first: 1, after: cursor},
               resolution
             )

    assert MapSet.new([first_node.id, second_node.id]) ==
             MapSet.new([first_unread.id, second_unread.id])

    refute read_event.id in [first_node.id, second_node.id]
  end

  defp price_watch_fixture(user) do
    product = SpecsFixtures.product_fixture()

    assert {:ok, watch} =
             Alerts.create_watch(user.id, %{
               product_id: product.id,
               rule_type: :target_price,
               currency: "USD",
               target_amount: "50"
             })

    watch
  end

  defp alert_event_fixture(user, observed_at) do
    %{product: product, merchant_product: offer} = offer_fixture()

    assert {:ok, _watch} =
             Alerts.create_watch(user.id, %{
               product_id: product.id,
               rule_type: :target_price,
               currency: "USD",
               target_amount: "50"
             })

    assert {:ok, point} =
             Pricing.add_price_point(%{
               merchant_product_id: offer.id,
               price: "40",
               shipping: "5",
               in_stock: true,
               observed_at: observed_at
             })

    assert {:ok, %{events_created: 1}} = Alerts.evaluate_price_point(point.id, now: observed_at)

    user.id
    |> Alerts.list_alert_events_query()
    |> Repo.all()
    |> hd()
  end

  defp offer_fixture do
    product = SpecsFixtures.product_fixture()

    {:ok, merchant} =
      Pricing.upsert_merchant(%{
        name: "GraphQL Watch Merchant #{System.unique_integer([:positive])}",
        domain: "graphql-watch-#{System.unique_integer([:positive])}.example"
      })

    {:ok, merchant_product} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://graphql-watch.example/#{System.unique_integer([:positive])}",
        currency: "USD",
        is_active: true
      })

    %{product: product, merchant: merchant, merchant_product: merchant_product}
  end

  defp auth_conn(conn, user), do: conn |> log_in_user(user) |> put_req_header_same_origin()

  defp sample_watch_input(overrides \\ %{}) do
    Map.merge(
      %{
        "productId" => relay_id(:product, 1),
        "ruleType" => "TARGET_PRICE",
        "currency" => "USD",
        "targetAmount" => "50"
      },
      overrides
    )
  end

  defp graphql(conn, query, variables) do
    conn
    |> post("/api/graphql", %{query: query, variables: variables})
    |> json_response(200)
  end

  defp watches_query do
    """
    query MyPriceWatches {
      myPriceWatches(first: 20) {
        edges { node { id productName ruleType currency targetAmount enabled } }
        pageInfo { hasNextPage endCursor }
      }
    }
    """
  end

  defp events_query do
    """
    query MyAlertEvents {
      myAlertEvents(first: 20) {
        edges {
          node {
            id productName ruleType currency landedPrice itemPrice shipping observedAt readAt
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
    """
  end

  defp create_watch_mutation do
    """
    mutation CreatePriceWatch($input: CreatePriceWatchInput!) {
      createPriceWatch(input: $input) {
        watch { id productName ruleType currency targetAmount enabled }
        errors { code field message }
      }
    }
    """
  end

  defp update_watch_mutation do
    """
    mutation UpdatePriceWatch($input: UpdatePriceWatchInput!) {
      updatePriceWatch(input: $input) {
        watch { id enabled }
        errors { code field message }
      }
    }
    """
  end

  defp delete_watch_mutation do
    """
    mutation DeletePriceWatch($id: ID!) {
      deletePriceWatch(id: $id) { deletedWatchId errors { code field message } }
    }
    """
  end

  defp mark_read_mutation do
    """
    mutation MarkAlertRead($id: ID!) {
      markAlertRead(id: $id) {
        event { id readAt productName merchantName }
        errors { code field message }
      }
    }
    """
  end
end
