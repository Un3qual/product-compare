defmodule ProductCompare.CommerceAttribution.AnonymousVisitorsTest do
  use ProductCompare.DataCase, async: false

  alias ProductCompare.CommerceAttribution.Visitors
  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.AnonymousVisitor
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession

  test "creates one persisted visitor for one entropy id" do
    entropy_id = Ecto.UUID.generate()

    assert {:ok, first} = Visitors.get_or_create(entropy_id)
    assert {:ok, second} = Visitors.get_or_create(entropy_id)

    assert first.id == second.id
    assert first.entropy_id == entropy_id
    assert Repo.aggregate(AnonymousVisitor, :count, :id) == 1
  end

  test "concurrent first clicks converge on one visitor row" do
    entropy_id = Ecto.UUID.generate()

    visitor_ids =
      1..8
      |> Task.async_stream(fn _ -> Visitors.get_or_create(entropy_id) end,
        max_concurrency: 8,
        ordered: false
      )
      |> Enum.map(fn {:ok, {:ok, visitor}} -> visitor.id end)

    assert Enum.uniq(visitor_ids) == [hd(visitor_ids)]
    assert Repo.aggregate(AnonymousVisitor, :count, :id) == 1
  end

  test "rejects invalid entropy ids" do
    assert {:error, changeset} = Visitors.get_or_create("not-a-uuid")
    assert %{entropy_id: ["is invalid"]} = errors_on(changeset)
  end

  test "click changeset rejects a user and visitor on the same row" do
    changeset =
      CommerceClickSession.changeset(%CommerceClickSession{}, %{
        commerce_link_id: 1,
        user_id: 1,
        anonymous_visitor_id: 2
      })

    refute changeset.valid?
    assert %{anonymous_visitor_id: ["cannot be set with user_id"]} = errors_on(changeset)
  end
end
