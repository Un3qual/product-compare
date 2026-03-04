defmodule ProductCompare.Discussions.ThreadCrudTest do
  use ProductCompare.DataCase, async: false

  alias ProductCompare.Discussions
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Discussions.ProductThread

  describe "thread CRUD" do
    test "update_thread/2 updates a thread title" do
      user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture(%{slug: "thread-update-product"})

      {:ok, thread} =
        Discussions.create_thread(%{
          product_id: product.id,
          title: "Original title",
          created_by: user.id
        })

      assert {:ok, updated_thread} = Discussions.update_thread(thread, %{title: "Updated title"})
      assert updated_thread.title == "Updated title"
      assert updated_thread.product_id == thread.product_id
      assert updated_thread.created_by == thread.created_by
    end

    test "update_thread/2 returns errors for invalid attrs" do
      user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture(%{slug: "thread-update-invalid-product"})

      {:ok, thread} =
        Discussions.create_thread(%{
          product_id: product.id,
          title: "Original title",
          created_by: user.id
        })

      assert {:error, changeset} = Discussions.update_thread(thread, %{title: nil})
      assert "can't be blank" in errors_on(changeset).title
    end

    test "update_thread/2 does not allow changing product or creator ownership fields" do
      user = AccountsFixtures.user_fixture()
      other_user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture(%{slug: "thread-update-ownership-product"})
      other_product = SpecsFixtures.product_fixture(%{slug: "thread-update-ownership-other-product"})

      {:ok, thread} =
        Discussions.create_thread(%{
          product_id: product.id,
          title: "Original title",
          created_by: user.id
        })

      assert {:ok, updated_thread} =
               Discussions.update_thread(thread, %{
                 title: "Updated title",
                 product_id: other_product.id,
                 created_by: other_user.id
               })

      assert updated_thread.title == "Updated title"
      assert updated_thread.product_id == thread.product_id
      assert updated_thread.created_by == thread.created_by
    end

    test "delete_thread/1 deletes an existing thread" do
      user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture(%{slug: "thread-delete-product"})

      {:ok, thread} =
        Discussions.create_thread(%{
          product_id: product.id,
          title: "Delete me",
          created_by: user.id
        })

      assert {:ok, %ProductThread{id: id}} = Discussions.delete_thread(thread)
      assert Repo.get(ProductThread, id) == nil
    end
  end

  describe "list_threads_for_product/2" do
    test "returns deterministic ordering when inserted_at timestamps tie" do
      user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture(%{slug: "thread-listing-product"})
      other_product = SpecsFixtures.product_fixture(%{slug: "thread-listing-other-product"})

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

      {:ok, thread_c} =
        Discussions.create_thread(%{
          product_id: product.id,
          title: "Thread C",
          created_by: user.id
        })

      {:ok, other_thread} =
        Discussions.create_thread(%{
          product_id: other_product.id,
          title: "Other Product Thread",
          created_by: user.id
        })

      same_inserted_at = DateTime.utc_now() |> DateTime.truncate(:microsecond)
      thread_ids = [thread_a.id, thread_b.id, thread_c.id]

      assert {3, _} =
               Repo.update_all(
                 from(t in ProductThread, where: t.id in ^thread_ids),
                 set: [inserted_at: same_inserted_at]
               )

      listed_threads = Discussions.list_threads_for_product(product.id)
      listed_ids = Enum.map(listed_threads, & &1.id)

      assert listed_ids == [thread_c.id, thread_b.id, thread_a.id]
      refute other_thread.id in listed_ids
    end
  end
end
