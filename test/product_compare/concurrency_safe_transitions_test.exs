defmodule ProductCompare.ConcurrencySafeTransitionsTest do
  use ProductCompare.DataCase, async: false

  import ProductCompare.DatabaseTestHelpers,
    only: [
      assert_backend_blocked: 1,
      assert_blocked_by: 2,
      assert_some_backend_blocked_by: 1
    ]

  alias Ecto.Adapters.SQL.Sandbox
  alias ProductCompare.Accounts
  alias ProductCompare.Alerts
  alias ProductCompare.Catalog
  alias ProductCompare.ComparisonSnapshots
  alias ProductCompare.Discussions
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Fixtures.TaxonomyFixtures
  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.ListingPersistence.Enrichment
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompare.Taxonomy
  alias ProductCompareSchemas.Accounts.ApiToken
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Accounts.UserSessionToken
  alias ProductCompareSchemas.Alerts.AlertEvent
  alias ProductCompareSchemas.Catalog.Brand
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Specs.Attribute
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Taxonomy.{Taxon, TaxonAlias}
  alias ProductCompareSchemas.Taxonomy.Taxonomy, as: TaxonomySchema

  @first_transition_at ~U[2026-07-30 12:00:00.000000Z]

  test "API token revocation preserves the transition that wins the row lock" do
    fixture = committed_api_token_fixture()
    on_exit(fn -> delete_committed_user(fixture.user.id) end)

    {lock_holder, lock_backend_pid} =
      hold_row_lock(ApiToken, fixture.api_token.id, fn token ->
        token
        |> Ecto.Changeset.change(revoked_at: @first_transition_at)
        |> Repo.update!()
      end)

    {revocation, revocation_backend_pid} =
      start_unboxed_action(fn ->
        Accounts.revoke_api_token(fixture.user.id, fixture.api_token.entropy_id)
      end)

    assert_blocked_by(revocation_backend_pid, lock_backend_pid)
    release_row_lock(lock_holder)

    assert {:ok, revoked} = Task.await(revocation)
    assert revoked.revoked_at == @first_transition_at
    assert Repo.get!(ApiToken, fixture.api_token.id).revoked_at == @first_transition_at
  end

  test "marking an alert read preserves the first committed read timestamp" do
    fixture = committed_alert_fixture()
    on_exit(fn -> delete_committed_alert_fixture(fixture) end)

    {lock_holder, lock_backend_pid} =
      hold_row_lock(AlertEvent, fixture.event.id, fn event ->
        event
        |> AlertEvent.read_changeset(@first_transition_at)
        |> Repo.update!()
      end)

    {mark_read, mark_read_backend_pid} =
      start_unboxed_action(fn ->
        Alerts.mark_alert_read(fixture.user.id, fixture.event.entropy_id)
      end)

    assert_blocked_by(mark_read_backend_pid, lock_backend_pid)
    release_row_lock(lock_holder)

    assert {:ok, read_event} = Task.await(mark_read)
    assert read_event.read_at == @first_transition_at
    assert Repo.get!(AlertEvent, fixture.event.id).read_at == @first_transition_at
  end

  test "snapshot revocation cannot reclaim an already committed active transition" do
    fixture = committed_snapshot_fixture()
    on_exit(fn -> delete_committed_user(fixture.user.id) end)

    {lock_holder, lock_backend_pid} =
      hold_row_lock(ComparisonSnapshot, fixture.snapshot.id, fn snapshot ->
        snapshot
        |> ComparisonSnapshot.revoke_changeset(@first_transition_at)
        |> Repo.update!()
      end)

    {revocation, _revocation_backend_pid} =
      start_unboxed_action(fn ->
        ComparisonSnapshots.revoke(
          fixture.user.id,
          fixture.snapshot.entropy_id,
          now: DateTime.add(@first_transition_at, 1, :second)
        )
      end)

    assert_some_backend_blocked_by(lock_backend_pid)
    release_row_lock(lock_holder)

    assert {:error, :not_found} = Task.await(revocation)
    assert Repo.get!(ComparisonSnapshot, fixture.snapshot.id).revoked_at == @first_transition_at
  end

  test "claim moderation cannot overwrite a competing committed decision" do
    fixture = committed_claim_fixture()
    on_exit(fn -> delete_committed_claim_fixture(fixture) end)

    {lock_holder, lock_backend_pid} =
      hold_row_lock(ProductAttributeClaim, fixture.claim.id, fn claim ->
        claim
        |> ProductAttributeClaim.changeset(%{status: :rejected})
        |> Repo.update!()
      end)

    {acceptance, acceptance_backend_pid} =
      start_unboxed_action(fn ->
        Specs.accept_claim(fixture.claim.id, fixture.moderator.id)
      end)

    assert_blocked_by(acceptance_backend_pid, lock_backend_pid)
    release_row_lock(lock_holder)

    assert {:error, :invalid_status_transition} = Task.await(acceptance)
    assert Repo.get!(ProductAttributeClaim, fixture.claim.id).status == :rejected
  end

  test "moderation rechecks operator access after a competing revocation" do
    fixture = committed_moderation_fixture()
    on_exit(fn -> delete_committed_moderation_fixture(fixture) end)

    {lock_holder, lock_backend_pid} =
      hold_row_lock(User, fixture.operator.id, fn operator ->
        operator
        |> User.operator_access_changeset(false)
        |> Repo.update!()
      end)

    {moderation, _moderation_backend_pid} =
      start_unboxed_action(fn ->
        Discussions.moderate(
          fixture.operator.id,
          :review,
          fixture.review.entropy_id,
          :published
        )
      end)

    assert_some_backend_blocked_by(lock_backend_pid)
    release_row_lock(lock_holder)

    assert {:error, :forbidden} = Task.await(moderation)
    assert Repo.get!(ProductReview, fixture.review.id).moderation_status == :pending
  end

  test "concurrent successful email deliveries activate exactly one replacement token" do
    user =
      Sandbox.unboxed_run(Repo, fn ->
        AccountsFixtures.user_fixture()
      end)

    on_exit(fn -> delete_committed_user(user.id) end)
    parent = self()

    deliveries =
      for label <- [:first, :second] do
        Task.async(fn ->
          Sandbox.unboxed_run(Repo, fn ->
            Accounts.deliver_user_reset_password_instructions(user, fn token ->
              send(parent, {:delivery_candidate, label, self(), token})

              receive do
                :finish_delivery -> :ok
              after
                5_000 -> flunk("timed out waiting to finish token delivery")
              end
            end)
          end)
        end)
      end

    assert_receive {:delivery_candidate, first_label, first_pid, first_token}
    assert_receive {:delivery_candidate, second_label, second_pid, second_token}
    assert MapSet.new([first_label, second_label]) == MapSet.new([:first, :second])

    send(first_pid, :finish_delivery)
    send(second_pid, :finish_delivery)
    assert Enum.map(deliveries, &Task.await/1) == [:ok, :ok]

    user_id = user.id

    active_tokens =
      Enum.filter([first_token, second_token], fn token ->
        match?(%User{id: ^user_id}, Accounts.get_user_by_reset_password_token(token))
      end)

    assert length(active_tokens) == 1

    assert Repo.aggregate(
             from(token in UserSessionToken,
               where: token.user_id == ^user.id and token.context == :reset_password
             ),
             :count,
             :id
           ) == 1
  end

  test "concurrent taxon cross-moves cannot both create a hierarchy cycle" do
    fixture = committed_taxonomy_pair_fixture()
    on_exit(fn -> delete_committed_taxonomy_fixture(fixture) end)

    {lock_holder, lock_backend_pid} =
      hold_taxonomy_hierarchy_lock(
        fixture.taxonomy.id,
        [fixture.first.id, fixture.second.id]
      )

    {first_move, first_backend_pid} =
      start_unboxed_action(fn ->
        Taxonomy.move_taxon(fixture.first.id, fixture.second.id)
      end)

    {second_move, second_backend_pid} =
      start_unboxed_action(fn ->
        Taxonomy.move_taxon(fixture.second.id, fixture.first.id)
      end)

    assert_blocked_by(first_backend_pid, lock_backend_pid)
    assert_backend_blocked(second_backend_pid)
    release_taxonomy_hierarchy_lock(lock_holder)

    results = [Task.await(first_move), Task.await(second_move)]

    assert Enum.count(results, &match?({:ok, %Taxon{}}, &1)) == 1
    assert Enum.count(results, &match?({:error, :cycle_detected}, &1)) == 1
  end

  test "provider enrichment cannot overwrite fields curated before its locked reload" do
    fixture = Sandbox.unboxed_run(Repo, fn -> committed_product_fixture() end)
    on_exit(fn -> delete_committed_product_fixture_unboxed(fixture) end)

    {lock_holder, lock_backend_pid} =
      hold_row_lock(Product, fixture.product.id, fn product ->
        product
        |> Product.changeset(%{
          description: "Curated description",
          model_number: "CURATED-1"
        })
        |> Repo.update!()
      end)

    {enrichment, enrichment_backend_pid} =
      start_unboxed_action(fn ->
        run_enrichment(fixture.product, %{
          description: "Provider description",
          manufacturer_category_path: nil,
          model_number: "PROVIDER-1"
        })
      end)

    assert_blocked_by(enrichment_backend_pid, lock_backend_pid)
    release_row_lock(lock_holder)

    assert {:ok, enriched, %{status: :none}} = Task.await(enrichment)
    assert enriched.description == "Curated description"
    assert enriched.model_number == "CURATED-1"
  end

  test "mapped type cannot overwrite a type curated before its locked reload" do
    fixture = committed_mapping_fixture()
    on_exit(fn -> delete_committed_mapping_fixture(fixture) end)

    {lock_holder, lock_backend_pid} =
      hold_row_lock(Product, fixture.product_fixture.product.id, fn product ->
        product
        |> Product.changeset(%{primary_type_taxon_id: fixture.curated_taxon.id})
        |> Repo.update!()
      end)

    {enrichment, enrichment_backend_pid} =
      start_unboxed_action(fn ->
        run_enrichment(fixture.product_fixture.product, %{
          description: nil,
          manufacturer_category_path: fixture.category_path,
          model_number: nil
        })
      end)

    assert_blocked_by(enrichment_backend_pid, lock_backend_pid)
    release_row_lock(lock_holder)

    assert {:ok, enriched, %{status: :mapped_not_applied}} = Task.await(enrichment)
    assert enriched.primary_type_taxon_id == fixture.curated_taxon.id
  end

  test "mapped type uses the alias owner committed before its dependent write" do
    fixture = committed_mapping_fixture()
    on_exit(fn -> delete_committed_mapping_fixture(fixture) end)

    {lock_holder, _lock_backend_pid} = hold_mapping_rows(fixture)

    {enrichment, enrichment_backend_pid} =
      start_unboxed_action(fn ->
        run_enrichment(fixture.product_fixture.product, %{
          description: nil,
          manufacturer_category_path: fixture.category_path,
          model_number: nil
        })
      end)

    assert_backend_blocked(enrichment_backend_pid)
    release_mapping_rows(lock_holder)

    assert {:ok, enriched, %{status: :mapped, taxon_id: mapped_taxon_id}} =
             Task.await(enrichment)

    assert mapped_taxon_id == fixture.reassigned_taxon.id
    assert enriched.primary_type_taxon_id == fixture.reassigned_taxon.id
    refute mapped_taxon_id == fixture.mapped_taxon.id
  end

  test "import completion preserves the terminal transition that wins the row lock" do
    fixture = committed_import_run_fixture()
    on_exit(fn -> delete_committed_import_run_fixture(fixture) end)

    {lock_holder, lock_backend_pid} =
      hold_row_lock(ImportRun, fixture.run.id, fn run ->
        run
        |> ImportRun.changeset(%{
          finished_at: @first_transition_at,
          pages_fetched: 2,
          records_failed: 0,
          records_fetched: 20,
          records_normalized: 20,
          records_persisted: 20,
          status: :succeeded
        })
        |> Repo.update!()
      end)

    {completion, completion_backend_pid} =
      start_unboxed_action(fn ->
        Ingestion.complete_import_run(fixture.run, %{
          finished_at: DateTime.add(@first_transition_at, 1, :second),
          pages_fetched: 1,
          records_failed: 10,
          records_fetched: 10,
          records_normalized: 0,
          records_persisted: 0,
          status: :failed
        })
      end)

    assert_blocked_by(completion_backend_pid, lock_backend_pid)
    release_row_lock(lock_holder)

    assert {:ok, completed} = Task.await(completion)
    assert completed.status == :succeeded
    assert completed.records_persisted == 20
    assert completed.finished_at == @first_transition_at
  end

  defp hold_row_lock(schema, id, transition) do
    parent = self()

    task =
      Task.async(fn ->
        Sandbox.unboxed_run(Repo, fn ->
          Repo.transaction(fn ->
            backend_pid = database_backend_pid()
            record = Repo.one!(from record in schema, where: record.id == ^id, lock: "FOR UPDATE")
            send(parent, {:row_lock_held, self(), backend_pid})

            receive do
              :commit_transition -> transition.(record)
            after
              5_000 -> flunk("timed out waiting to commit the competing transition")
            end
          end)
        end)
      end)

    assert_receive {:row_lock_held, task_pid, backend_pid}
    assert task_pid == task.pid
    {task, backend_pid}
  end

  defp release_row_lock(task) do
    send(task.pid, :commit_transition)
    assert {:ok, _record} = Task.await(task)
  end

  defp hold_taxonomy_hierarchy_lock(taxonomy_id, taxon_ids) do
    parent = self()

    task =
      Task.async(fn ->
        Sandbox.unboxed_run(Repo, fn ->
          Repo.transaction(fn ->
            backend_pid = database_backend_pid()

            Repo.one!(
              from taxonomy in TaxonomySchema,
                where: taxonomy.id == ^taxonomy_id,
                lock: "FOR UPDATE"
            )

            Repo.all(
              from taxon in Taxon,
                where: taxon.id in ^Enum.sort(taxon_ids),
                order_by: [asc: taxon.id],
                lock: "FOR UPDATE"
            )

            send(parent, {:taxonomy_hierarchy_lock_held, self(), backend_pid})

            receive do
              :release_taxonomy_hierarchy -> :ok
            after
              5_000 -> flunk("timed out waiting to release the taxonomy hierarchy lock")
            end
          end)
        end)
      end)

    assert_receive {:taxonomy_hierarchy_lock_held, task_pid, backend_pid}
    assert task_pid == task.pid
    {task, backend_pid}
  end

  defp release_taxonomy_hierarchy_lock(task) do
    send(task.pid, :release_taxonomy_hierarchy)
    assert {:ok, :ok} = Task.await(task)
  end

  defp hold_mapping_rows(fixture) do
    parent = self()

    task =
      Task.async(fn ->
        Sandbox.unboxed_run(Repo, fn ->
          Repo.transaction(fn ->
            backend_pid = database_backend_pid()

            alias_record =
              Repo.one!(
                from taxon_alias in TaxonAlias,
                  where: taxon_alias.id == ^fixture.alias_record.id,
                  lock: "FOR UPDATE"
              )

            Repo.one!(
              from product in Product,
                where: product.id == ^fixture.product_fixture.product.id,
                lock: "FOR UPDATE"
            )

            send(parent, {:mapping_rows_held, self(), backend_pid})

            receive do
              :commit_mapping_reassignment ->
                alias_record
                |> TaxonAlias.changeset(%{taxon_id: fixture.reassigned_taxon.id})
                |> Repo.update!()
            after
              5_000 -> flunk("timed out waiting to commit the mapping reassignment")
            end
          end)
        end)
      end)

    assert_receive {:mapping_rows_held, task_pid, backend_pid}
    assert task_pid == task.pid
    {task, backend_pid}
  end

  defp release_mapping_rows(task) do
    send(task.pid, :commit_mapping_reassignment)
    assert {:ok, %TaxonAlias{}} = Task.await(task)
  end

  defp run_enrichment(product, listing) do
    assert {:ok, result} =
             Repo.transaction(fn ->
               Enrichment.enrich_product(product, %{}, listing)
             end)

    result
  end

  defp start_unboxed_action(action) do
    parent = self()

    task =
      Task.async(fn ->
        Sandbox.unboxed_run(Repo, fn ->
          Repo.checkout(fn ->
            backend_pid = database_backend_pid()
            send(parent, {:action_started, self(), backend_pid})
            action.()
          end)
        end)
      end)

    assert_receive {:action_started, task_pid, backend_pid}
    assert task_pid == task.pid
    {task, backend_pid}
  end

  defp committed_api_token_fixture do
    Sandbox.unboxed_run(Repo, fn ->
      user = AccountsFixtures.user_fixture()
      {:ok, %{api_token: api_token}} = Accounts.create_api_token(user.id, %{})
      %{api_token: api_token, user: user}
    end)
  end

  defp committed_alert_fixture do
    Sandbox.unboxed_run(Repo, fn ->
      user = AccountsFixtures.user_fixture()
      product_fixture = committed_product_fixture()
      product = product_fixture.product

      {:ok, merchant} =
        Pricing.upsert_merchant(%{
          name: "Concurrency merchant #{System.unique_integer([:positive])}",
          domain: "concurrency-#{System.unique_integer([:positive])}.example"
        })

      {:ok, offer} =
        Pricing.upsert_merchant_product(%{
          merchant_id: merchant.id,
          product_id: product.id,
          url: "https://concurrency.example/#{System.unique_integer([:positive])}",
          currency: "USD",
          is_active: true
        })

      {:ok, watch} =
        Alerts.create_watch(user.id, %{
          product_id: product.id,
          rule_type: :target_price,
          currency: "USD",
          target_amount: "50"
        })

      {:ok, point} =
        Pricing.add_price_point(%{
          merchant_product_id: offer.id,
          observed_at: @first_transition_at,
          price: "40",
          shipping: "0",
          in_stock: true
        })

      {:ok, %{events_created: 1}} =
        Alerts.evaluate_price_point(point.id, now: @first_transition_at)

      %{
        event: Repo.get_by!(AlertEvent, watch_rule_id: watch.id),
        merchant: merchant,
        product_fixture: product_fixture,
        user: user
      }
    end)
  end

  defp committed_snapshot_fixture do
    Sandbox.unboxed_run(Repo, fn ->
      user = AccountsFixtures.user_fixture()

      inserted_snapshot =
        %ComparisonSnapshot{}
        |> ComparisonSnapshot.publish_changeset(%{
          public_token: 32 |> :crypto.strong_rand_bytes() |> Base.url_encode64(padding: false),
          user_id: user.id,
          version: 1,
          captured_at: @first_transition_at
        })
        |> Repo.insert!()

      snapshot = Repo.get!(ComparisonSnapshot, inserted_snapshot.id)
      %{snapshot: snapshot, user: user}
    end)
  end

  defp committed_claim_fixture do
    Sandbox.unboxed_run(Repo, fn ->
      moderator = AccountsFixtures.user_fixture()
      product_fixture = committed_product_fixture()
      product = product_fixture.product

      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "concurrency-attribute-#{Ecto.UUID.generate()}"
        })

      {:ok, claim} =
        Specs.propose_claim(product.id, attribute.id, %{value_bool: true}, %{
          source_type: :user,
          created_by: moderator.id
        })

      %{
        attribute: attribute,
        claim: claim,
        moderator: moderator,
        product_fixture: product_fixture
      }
    end)
  end

  defp committed_moderation_fixture do
    Sandbox.unboxed_run(Repo, fn ->
      operator = AccountsFixtures.operator_fixture()
      author = AccountsFixtures.user_fixture()
      product_fixture = committed_product_fixture()
      product = product_fixture.product

      {:ok, review} =
        Discussions.create_review(%{
          user_id: author.id,
          product_id: product.id,
          rating: 4,
          title: "Concurrent moderation"
        })

      %{
        author: author,
        operator: operator,
        product_fixture: product_fixture,
        review: Repo.get!(ProductReview, review.id)
      }
    end)
  end

  defp committed_product_fixture do
    type_taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

    taxon =
      TaxonomyFixtures.taxon_fixture(%{
        taxonomy_id: type_taxonomy.id,
        code: "concurrency-taxon-#{Ecto.UUID.generate()}",
        name: "Concurrency Taxon"
      })

    {:ok, brand} = Catalog.upsert_brand(%{name: "Concurrency Brand #{Ecto.UUID.generate()}"})

    product =
      SpecsFixtures.product_fixture(%{
        primary_type_taxon: taxon,
        brand_id: brand.id,
        slug: "concurrency-product-#{Ecto.UUID.generate()}"
      })

    %{brand: brand, product: product, taxon: taxon}
  end

  defp committed_taxonomy_pair_fixture do
    Sandbox.unboxed_run(Repo, fn ->
      taxonomy =
        TaxonomyFixtures.taxonomy_fixture(
          "concurrency-taxonomy-#{Ecto.UUID.generate()}",
          "Concurrency Taxonomy"
        )

      first =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: taxonomy.id,
          code: "concurrency-first-#{Ecto.UUID.generate()}",
          name: "Concurrency First"
        })

      second =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: taxonomy.id,
          code: "concurrency-second-#{Ecto.UUID.generate()}",
          name: "Concurrency Second"
        })

      %{first: first, second: second, taxonomy: taxonomy}
    end)
  end

  defp committed_mapping_fixture do
    Sandbox.unboxed_run(Repo, fn ->
      product_fixture = committed_product_fixture()
      taxonomy_id = product_fixture.taxon.taxonomy_id

      {placeholder_taxon, placeholder_created?} =
        case Repo.get_by(Taxon, taxonomy_id: taxonomy_id, code: "ingested-product") do
          nil ->
            {:ok, taxon} =
              Taxonomy.create_taxon(%{
                taxonomy_id: taxonomy_id,
                code: "ingested-product",
                name: "Ingested Product"
              })

            {taxon, true}

          taxon ->
            {taxon, false}
        end

      mapped_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: taxonomy_id,
          code: "concurrency-mapped-#{Ecto.UUID.generate()}",
          name: "Concurrency Mapped"
        })

      reassigned_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: taxonomy_id,
          code: "concurrency-reassigned-#{Ecto.UUID.generate()}",
          name: "Concurrency Reassigned"
        })

      curated_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: taxonomy_id,
          code: "concurrency-curated-#{Ecto.UUID.generate()}",
          name: "Concurrency Curated"
        })

      product =
        product_fixture.product
        |> Product.changeset(%{primary_type_taxon_id: placeholder_taxon.id})
        |> Repo.update!()

      category_path = ["Concurrency", Ecto.UUID.generate()]
      {:ok, alias_record} = Taxonomy.upsert_taxon_alias(mapped_taxon.id, category_path)

      %{
        alias_record: alias_record,
        category_path: category_path,
        curated_taxon: curated_taxon,
        mapped_taxon: mapped_taxon,
        placeholder_created?: placeholder_created?,
        placeholder_taxon: placeholder_taxon,
        product_fixture: %{product_fixture | product: product},
        reassigned_taxon: reassigned_taxon
      }
    end)
  end

  defp committed_import_run_fixture do
    Sandbox.unboxed_run(Repo, fn ->
      source =
        %Source{}
        |> Source.changeset(%{
          kind: "affiliate_feed",
          provider: "cj",
          name: "Concurrency source #{Ecto.UUID.generate()}",
          domain: "concurrency-#{Ecto.UUID.generate()}.example"
        })
        |> Repo.insert!()

      {:ok, run} =
        Ingestion.start_import_run(%{
          source_id: source.id,
          provider: "cj",
          surface: "shoppingProducts",
          query: %{"concurrency" => true},
          started_at: DateTime.add(@first_transition_at, -60, :second)
        })

      %{run: run, source: source}
    end)
  end

  defp delete_committed_alert_fixture(fixture) do
    Sandbox.unboxed_run(Repo, fn ->
      Repo.delete_all(from event in AlertEvent, where: event.id == ^fixture.event.id)
      Repo.delete_all(from user in User, where: user.id == ^fixture.user.id)

      Repo.delete_all(
        from merchant in ProductCompareSchemas.Pricing.Merchant,
          where: merchant.id == ^fixture.merchant.id
      )

      delete_committed_product_fixture(fixture.product_fixture)
    end)
  end

  defp delete_committed_claim_fixture(fixture) do
    Sandbox.unboxed_run(Repo, fn ->
      Repo.delete_all(
        from claim in ProductAttributeClaim,
          where: claim.id == ^fixture.claim.id
      )

      Repo.delete_all(from attribute in Attribute, where: attribute.id == ^fixture.attribute.id)
      Repo.delete_all(from user in User, where: user.id == ^fixture.moderator.id)
      delete_committed_product_fixture(fixture.product_fixture)
    end)
  end

  defp delete_committed_moderation_fixture(fixture) do
    Sandbox.unboxed_run(Repo, fn ->
      Repo.delete_all(from review in ProductReview, where: review.id == ^fixture.review.id)

      Repo.delete_all(
        from user in User,
          where: user.id in ^[fixture.author.id, fixture.operator.id]
      )

      delete_committed_product_fixture(fixture.product_fixture)
    end)
  end

  defp delete_committed_product_fixture(fixture) do
    Repo.delete_all(from product in Product, where: product.id == ^fixture.product.id)
    Repo.delete_all(from brand in Brand, where: brand.id == ^fixture.brand.id)
    Repo.delete_all(from taxon in Taxon, where: taxon.id == ^fixture.taxon.id)
  end

  defp delete_committed_product_fixture_unboxed(fixture) do
    Sandbox.unboxed_run(Repo, fn -> delete_committed_product_fixture(fixture) end)
  end

  defp delete_committed_mapping_fixture(fixture) do
    Sandbox.unboxed_run(Repo, fn ->
      delete_committed_product_fixture(fixture.product_fixture)

      Repo.delete_all(
        from taxon in Taxon,
          where:
            taxon.id in ^[
              fixture.curated_taxon.id,
              fixture.mapped_taxon.id,
              fixture.reassigned_taxon.id
            ]
      )

      if fixture.placeholder_created? do
        Repo.delete_all(
          from taxon in Taxon,
            where: taxon.id == ^fixture.placeholder_taxon.id
        )
      end
    end)
  end

  defp delete_committed_import_run_fixture(fixture) do
    Sandbox.unboxed_run(Repo, fn ->
      Repo.delete_all(from source in Source, where: source.id == ^fixture.source.id)
    end)
  end

  defp delete_committed_taxonomy_fixture(fixture) do
    Sandbox.unboxed_run(Repo, fn ->
      Repo.delete_all(
        from taxonomy in TaxonomySchema,
          where: taxonomy.id == ^fixture.taxonomy.id
      )
    end)
  end

  defp delete_committed_user(user_id) do
    Sandbox.unboxed_run(Repo, fn ->
      Repo.delete_all(from user in User, where: user.id == ^user_id)
    end)
  end

  defp database_backend_pid do
    Repo.query!("SELECT pg_backend_pid()").rows |> hd() |> hd()
  end
end
