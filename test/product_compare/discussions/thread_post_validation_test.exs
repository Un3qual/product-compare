defmodule ProductCompare.Discussions.ThreadPostValidationTest do
  use ProductCompare.DataCase, async: false

  alias ProductCompare.Discussions
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures

  describe "thread post validations without SQL triggers" do
    test "rejects changing thread_id for an existing post" do
      user = AccountsFixtures.user_fixture()
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

      assert {:error, changeset} = Discussions.update_post(post, %{thread_id: thread_b.id})
      assert "cannot be changed once a post is created" in errors_on(changeset).thread_id
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
  end
end
