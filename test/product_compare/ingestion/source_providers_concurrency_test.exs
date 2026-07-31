defmodule ProductCompare.Ingestion.SourceProvidersConcurrencyTest do
  use ProductCompare.DataCase, async: false

  import ProductCompare.DatabaseTestHelpers,
    only: [
      assert_backend_blocked: 1,
      assert_not_blocked_by: 2,
      hold_row_lock: 3,
      release_row_lock: 1,
      start_unboxed_action: 1
    ]

  alias Ecto.Adapters.SQL.Sandbox
  alias ProductCompare.Ingestion.SourceProviders
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.Source

  test "an established matching provider does not wait for an unrelated row lock" do
    source = committed_source_fixture("cj")
    on_exit(fn -> delete_committed_source(source.id) end)

    {lock_holder, lock_backend_pid} = hold_row_lock(Source, source.id, & &1)
    parent = self()

    {validation, validation_backend_pid} =
      start_unboxed_action(fn ->
        result =
          Repo.transaction(fn ->
            result = SourceProviders.ensure_in_transaction(source.id, "cj")
            send(parent, {:provider_validation_finished, self(), result})

            receive do
              :finish_provider_validation -> result
            after
              5_000 -> flunk("timed out waiting to finish provider validation")
            end
          end)

        result
      end)

    assert_not_blocked_by(validation_backend_pid, lock_backend_pid)
    assert_receive {:provider_validation_finished, validation_pid, {:ok, "cj"}}, 2_000
    assert validation_pid == validation.pid

    send(validation.pid, :finish_provider_validation)
    assert {:ok, {:ok, "cj"}} = Task.await(validation)
    release_row_lock(lock_holder)
  end

  test "two first providers elect one winner and return one deterministic mismatch" do
    source = committed_source_fixture(nil)
    on_exit(fn -> delete_committed_source(source.id) end)

    {lock_holder, _lock_backend_pid} = hold_row_lock(Source, source.id, & &1)

    attempts =
      Enum.map(["cj", "awin"], fn requested_provider ->
        {task, backend_pid} =
          start_unboxed_action(fn ->
            Repo.transaction(fn ->
              case SourceProviders.ensure_in_transaction(source.id, requested_provider) do
                {:ok, provider} -> provider
                {:error, reason} -> Repo.rollback(reason)
              end
            end)
          end)

        %{backend_pid: backend_pid, provider: requested_provider, task: task}
      end)

    Enum.each(attempts, &assert_backend_blocked(&1.backend_pid))
    release_row_lock(lock_holder)

    results = Enum.map(attempts, &{&1.provider, Task.await(&1.task)})

    assert [{winner, {:ok, winner}}] = Enum.filter(results, &match?({_provider, {:ok, _}}, &1))

    assert [{requested, {:error, mismatch}}] =
             Enum.filter(results, &match?({_provider, {:error, _}}, &1))

    assert requested != winner
    assert Repo.get!(Source, source.id).provider == winner

    assert {"does not match the source provider", metadata} =
             Keyword.fetch!(mismatch.errors, :provider)

    assert metadata[:source_provider] == winner
    assert metadata[:requested_provider] == requested
  end

  defp committed_source_fixture(provider) do
    Sandbox.unboxed_run(Repo, fn ->
      %Source{}
      |> Source.changeset(%{
        kind: "affiliate_feed",
        name: "Provider concurrency #{Ecto.UUID.generate()}",
        provider: provider
      })
      |> Repo.insert!()
    end)
  end

  defp delete_committed_source(source_id) do
    Sandbox.unboxed_run(Repo, fn ->
      Repo.delete_all(from source in Source, where: source.id == ^source_id)
    end)
  end
end
