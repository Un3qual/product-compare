defmodule ProductCompare.Discussions.ThreadPostValidationTest do
  use ProductCompare.DataCase, async: false

  import ProductCompare.DatabaseTestHelpers,
    only: [assert_blocked_by: 2, capture_select_queries: 1]

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
    test "thread creation rejects a 201-code-point decomposed title" do
      user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture()
      title = String.duplicate("e\u0301", 100) <> "x"

      assert_codepoint_length(title, 201)
      assert String.length(title) == 101

      assert {:error, changeset} =
               Discussions.create_thread(%{
                 product_id: product.id,
                 created_by: user.id,
                 title: title
               })

      assert "should be at most 200 character(s)" in errors_on(changeset).title
    end

    test "thread creation rejects a 5,001-code-point emoji ZWJ body" do
      user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture()
      body = emoji_zwj_text(5_001)

      assert_codepoint_length(body, 5_001)
      assert String.length(body) < 5_001

      assert {:error, changeset} =
               Discussions.create_thread(%{
                 product_id: product.id,
                 created_by: user.id,
                 title: "Thread",
                 body_md: body
               })

      assert "should be at most 5000 character(s)" in errors_on(changeset).body_md
    end

    test "thread post creation rejects a 5,001-code-point decomposed body" do
      user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture()
      body = String.duplicate("e\u0301", 2_500) <> "x"

      assert {:ok, thread} =
               Discussions.create_thread(%{
                 product_id: product.id,
                 created_by: user.id,
                 title: "Thread"
               })

      assert_codepoint_length(body, 5_001)
      assert String.length(body) == 2_501

      assert {:error, changeset} =
               Discussions.create_post(%{thread_id: thread.id, user_id: user.id, body_md: body})

      assert "should be at most 5000 character(s)" in errors_on(changeset).body_md
    end

    test "thread and post creation accept their code-point boundaries" do
      user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture()
      title = String.duplicate("e\u0301", 100)
      thread_body = emoji_zwj_text(5_000)
      post_body = String.duplicate("e\u0301", 2_500)

      assert_codepoint_length(title, 200)
      assert_codepoint_length(thread_body, 5_000)
      assert_codepoint_length(post_body, 5_000)

      assert {:ok, _one_code_point_thread} =
               Discussions.create_thread(%{
                 product_id: product.id,
                 created_by: user.id,
                 title: "x"
               })

      assert {:ok, thread} =
               Discussions.create_thread(%{
                 product_id: product.id,
                 created_by: user.id,
                 title: title,
                 body_md: thread_body
               })

      assert {:ok, _post} =
               Discussions.create_post(%{
                 thread_id: thread.id,
                 user_id: user.id,
                 body_md: post_body
               })
    end

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

  defp create_committed_cycle_fixture do
    Ecto.Adapters.SQL.Sandbox.unboxed_run(Repo, fn ->
      user = AccountsFixtures.user_fixture()

      product =
        SpecsFixtures.product_fixture(%{
          slug: "concurrent-cycle-#{System.unique_integer([:positive])}"
        })

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

  defp emoji_zwj_text(code_point_count) do
    family = "👩‍👩‍👧‍👦"
    family_code_point_count = Enum.count(String.codepoints(family))
    family_count = div(code_point_count, family_code_point_count)
    remainder = rem(code_point_count, family_code_point_count)

    String.duplicate(family, family_count) <> String.duplicate("x", remainder)
  end

  defp assert_codepoint_length(text, expected) do
    assert Enum.count_until(String.codepoints(text), expected + 1) == expected
  end
end
