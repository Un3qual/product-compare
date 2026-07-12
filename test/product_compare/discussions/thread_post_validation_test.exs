defmodule ProductCompare.Discussions.ThreadPostValidationTest do
  use ProductCompare.DataCase, async: false

  alias ProductCompare.Discussions
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Catalog.Brand
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost
  alias ProductCompareSchemas.Taxonomy.Taxon
  alias ProductCompareSchemas.Taxonomy.Taxonomy

  describe "thread post validations without SQL triggers" do
    test "ignores thread and author identity changes for an existing post" do
      user = AccountsFixtures.user_fixture()
      other_user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture(%{slug: "thread-immutability-product"})

      {:ok, thread_a} =
        Discussions.create_thread(%{
          product_id: product.id,
          title: "Thread A",
          created_by: user.id
        })

      {:ok, thread_b} =
        Discussions.create_thread(%{
          product_id: product.id,
          title: "Thread B",
          created_by: user.id
        })

      {:ok, post} =
        Discussions.create_post(%{thread_id: thread_a.id, user_id: user.id, body_md: "Root post"})

      assert {:ok, updated_post} =
               Discussions.update_post(post, %{
                 thread_id: thread_b.id,
                 user_id: other_user.id,
                 body_md: "Updated body"
               })

      assert updated_post.thread_id == thread_a.id
      assert updated_post.user_id == user.id
      assert updated_post.body_md == "Updated body"
    end

    test "rejects updates that would create a parent cycle" do
      user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture(%{slug: "thread-cycle-product"})

      {:ok, thread} =
        Discussions.create_thread(%{product_id: product.id, title: "Thread", created_by: user.id})

      {:ok, root_post} =
        Discussions.create_post(%{thread_id: thread.id, user_id: user.id, body_md: "Root post"})

      {:ok, child_post} =
        Discussions.create_post(%{
          thread_id: thread.id,
          parent_post_id: root_post.id,
          user_id: user.id,
          body_md: "Child post"
        })

      assert {:error, changeset} =
               Discussions.update_post(root_post, %{
                 parent_post_id: child_post.id,
                 body_md: "Updated root"
               })

      assert "cannot create a cycle" in errors_on(changeset).parent_post_id
    end

    test "the schema changeset performs no repository query for parent validation" do
      post = %ThreadPost{id: 10, thread_id: 20, user_id: 30, body_md: "Original"}

      {changeset, queries} =
        capture_select_queries(fn ->
          ThreadPost.changeset(post, %{parent_post_id: 40, body_md: "Updated"})
        end)

      assert changeset.valid?
      assert queries == []
    end

    test "rejects a parent from another thread" do
      user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture(%{slug: "thread-parent-scope-product"})

      {:ok, thread_a} =
        Discussions.create_thread(%{product_id: product.id, title: "A", created_by: user.id})

      {:ok, thread_b} =
        Discussions.create_thread(%{product_id: product.id, title: "B", created_by: user.id})

      {:ok, post_a} =
        Discussions.create_post(%{thread_id: thread_a.id, user_id: user.id, body_md: "A"})

      {:ok, post_b} =
        Discussions.create_post(%{thread_id: thread_b.id, user_id: user.id, body_md: "B"})

      assert {:error, changeset} =
               Discussions.update_post(post_a, %{parent_post_id: post_b.id})

      assert "must belong to the same thread" in errors_on(changeset).parent_post_id
    end

    test "serializes inverse parent updates so both cannot commit" do
      fixture = create_committed_cycle_fixture()
      on_exit(fn -> cleanup_committed_cycle_fixture(fixture) end)

      parent = self()

      lock_holder =
        Task.async(fn ->
          Ecto.Adapters.SQL.Sandbox.unboxed_run(Repo, fn ->
            Repo.transaction(fn ->
              backend_pid = Repo.query!("SELECT pg_backend_pid()").rows |> hd() |> hd()

              Repo.one!(
                from thread in ProductThread,
                  where: thread.id == ^fixture.thread.id,
                  lock: "FOR UPDATE"
              )

              send(parent, {:thread_lock_held, backend_pid})

              receive do
                :release_thread_lock -> :ok
              after
                5_000 -> flunk("timed out waiting to release the held thread lock")
              end
            end)
          end)
        end)

      assert_receive {:thread_lock_held, lock_backend_pid}

      update_a =
        start_unboxed_update(parent, :a, fixture.post_a, %{parent_post_id: fixture.post_b.id})

      assert_receive {:update_started, :a, update_a_backend_pid}
      assert_blocked_by(update_a_backend_pid, lock_backend_pid)

      update_b =
        start_unboxed_update(parent, :b, fixture.post_b, %{parent_post_id: fixture.post_a.id})

      assert_receive {:update_started, :b, update_b_backend_pid}
      assert_blocked_by(update_b_backend_pid, update_a_backend_pid)

      send(lock_holder.pid, :release_thread_lock)
      assert {:ok, :ok} = Task.await(lock_holder)
      assert {:ok, %ThreadPost{}} = Task.await(update_a)

      assert {:error, changeset} = Task.await(update_b)
      assert "cannot create a cycle" in errors_on(changeset).parent_post_id

      persisted_a = Repo.get!(ThreadPost, fixture.post_a.id)
      persisted_b = Repo.get!(ThreadPost, fixture.post_b.id)

      assert persisted_a.parent_post_id == fixture.post_b.id
      assert persisted_b.parent_post_id == nil
    end
  end

  defp start_unboxed_update(parent, label, post, attrs) do
    Task.async(fn ->
      Ecto.Adapters.SQL.Sandbox.unboxed_run(Repo, fn ->
        backend_pid = Repo.query!("SELECT pg_backend_pid()").rows |> hd() |> hd()
        send(parent, {:update_started, label, backend_pid})
        Discussions.update_post(post, attrs)
      end)
    end)
  end

  defp assert_blocked_by(waiting_backend_pid, blocking_backend_pid) do
    deadline = System.monotonic_time(:millisecond) + 2_000
    wait_until_blocked(waiting_backend_pid, blocking_backend_pid, deadline)
  end

  defp wait_until_blocked(waiting_backend_pid, blocking_backend_pid, deadline) do
    blocked? =
      Ecto.Adapters.SQL.Sandbox.unboxed_run(Repo, fn ->
        Repo.query!("SELECT $1 = ANY(pg_blocking_pids($2))", [
          blocking_backend_pid,
          waiting_backend_pid
        ])
        |> then(&(&1.rows == [[true]]))
      end)

    cond do
      blocked? ->
        :ok

      System.monotonic_time(:millisecond) < deadline ->
        wait_until_blocked(waiting_backend_pid, blocking_backend_pid, deadline)

      true ->
        flunk(
          "expected database backend #{waiting_backend_pid} to wait for #{blocking_backend_pid}"
        )
    end
  end

  defp create_committed_cycle_fixture do
    Ecto.Adapters.SQL.Sandbox.unboxed_run(Repo, fn ->
      user = AccountsFixtures.user_fixture()

      product =
        SpecsFixtures.product_fixture(%{slug: "concurrent-cycle-#{System.unique_integer()}"})

      taxon = Repo.get!(Taxon, product.primary_type_taxon_id)

      {:ok, thread} =
        Discussions.create_thread(%{product_id: product.id, title: "Thread", created_by: user.id})

      {:ok, post_a} =
        Discussions.create_post(%{thread_id: thread.id, user_id: user.id, body_md: "A"})

      {:ok, post_b} =
        Discussions.create_post(%{thread_id: thread.id, user_id: user.id, body_md: "B"})

      %{
        brand_id: product.brand_id,
        post_a: post_a,
        post_b: post_b,
        product: product,
        taxon_id: taxon.id,
        taxonomy_id: taxon.taxonomy_id,
        thread: thread,
        user: user
      }
    end)
  end

  defp cleanup_committed_cycle_fixture(fixture) do
    Ecto.Adapters.SQL.Sandbox.unboxed_run(Repo, fn ->
      Repo.delete_all(from product in Product, where: product.id == ^fixture.product.id)
      Repo.delete_all(from brand in Brand, where: brand.id == ^fixture.brand_id)
      Repo.delete_all(from taxon in Taxon, where: taxon.id == ^fixture.taxon_id)
      Repo.delete_all(from taxonomy in Taxonomy, where: taxonomy.id == ^fixture.taxonomy_id)
      Repo.delete_all(from user in User, where: user.id == ^fixture.user.id)
    end)
  end

  defp capture_select_queries(fun) do
    handler_id = {__MODULE__, System.unique_integer([:positive])}
    ref = make_ref()
    test_pid = self()

    :ok =
      :telemetry.attach(
        handler_id,
        [:product_compare, :repo, :query],
        fn _event, _measurements, metadata, {pid, message_ref} ->
          if select_query?(metadata.query) do
            send(pid, {message_ref, metadata.query})
          end
        end,
        {test_pid, ref}
      )

    try do
      result = fun.()
      {result, drain_queries(ref, [])}
    after
      :telemetry.detach(handler_id)
    end
  end

  defp drain_queries(ref, acc) do
    receive do
      {^ref, query} -> drain_queries(ref, [query | acc])
    after
      0 -> Enum.reverse(acc)
    end
  end

  defp select_query?(query) when is_binary(query) do
    query
    |> String.trim_leading()
    |> String.upcase()
    |> String.starts_with?("SELECT")
  end
end
