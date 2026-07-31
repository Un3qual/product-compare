defmodule ProductCompare.Ingestion.ImportRunConcurrencyTest do
  use ProductCompare.DataCase, async: false

  import ProductCompare.DatabaseTestHelpers,
    only: [
      assert_blocked_by: 2,
      hold_row_lock: 3,
      release_row_lock: 1,
      start_unboxed_action: 1
    ]

  alias Ecto.Adapters.SQL.Sandbox
  alias ProductCompare.Ingestion
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Specs.Source

  @first_transition_at ~U[2026-07-30 12:00:00.000000Z]

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

  defp delete_committed_import_run_fixture(fixture) do
    Sandbox.unboxed_run(Repo, fn ->
      Repo.delete_all(from source in Source, where: source.id == ^fixture.source.id)
    end)
  end
end
