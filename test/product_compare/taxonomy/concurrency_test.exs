defmodule ProductCompare.Taxonomy.ConcurrencyTest do
  use ProductCompare.DataCase, async: false

  import ProductCompare.DatabaseTestHelpers,
    only: [
      assert_backend_blocked: 1,
      assert_blocked_by: 2,
      database_backend_pid: 0,
      start_unboxed_action: 1
    ]

  alias Ecto.Adapters.SQL.Sandbox
  alias ProductCompare.Fixtures.TaxonomyFixtures
  alias ProductCompare.Repo
  alias ProductCompare.Taxonomy
  alias ProductCompareSchemas.Taxonomy.Taxon
  alias ProductCompareSchemas.Taxonomy.Taxonomy, as: TaxonomySchema

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

    assert_receive {:taxonomy_hierarchy_lock_held, task_pid, backend_pid}, 2_000
    assert task_pid == task.pid
    {task, backend_pid}
  end

  defp release_taxonomy_hierarchy_lock(task) do
    send(task.pid, :release_taxonomy_hierarchy)
    assert {:ok, :ok} = Task.await(task)
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

  defp delete_committed_taxonomy_fixture(fixture) do
    Sandbox.unboxed_run(Repo, fn ->
      Repo.delete_all(from taxonomy in TaxonomySchema, where: taxonomy.id == ^fixture.taxonomy.id)
    end)
  end
end
