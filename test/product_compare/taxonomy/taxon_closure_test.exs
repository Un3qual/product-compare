defmodule ProductCompare.Taxonomy.TaxonClosureTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Taxonomy
  alias ProductCompare.Fixtures.TaxonomyFixtures

  describe "taxon closure maintenance" do
    test "list_descendants/1 returns full subtree with depths" do
      taxonomy =
        TaxonomyFixtures.taxonomy_fixture("type-#{System.unique_integer([:positive])}", "Type")

      {:ok, root} = Taxonomy.create_taxon(%{taxonomy_id: taxonomy.id, code: "root", name: "Root"})

      {:ok, child} =
        Taxonomy.create_taxon(%{
          taxonomy_id: taxonomy.id,
          parent_id: root.id,
          code: "child",
          name: "Child"
        })

      {:ok, grandchild} =
        Taxonomy.create_taxon(%{
          taxonomy_id: taxonomy.id,
          parent_id: child.id,
          code: "grandchild",
          name: "Grandchild"
        })

      descendants = Taxonomy.list_descendants(root.id)

      assert Enum.any?(descendants, fn item -> item.taxon.id == child.id and item.depth == 1 end)

      assert Enum.any?(descendants, fn item ->
               item.taxon.id == grandchild.id and item.depth == 2
             end)
    end

    test "move_taxon/2 re-parents subtree and updates closure paths" do
      taxonomy =
        TaxonomyFixtures.taxonomy_fixture("type-#{System.unique_integer([:positive])}", "Type")

      {:ok, root_a} =
        Taxonomy.create_taxon(%{taxonomy_id: taxonomy.id, code: "root_a", name: "Root A"})

      {:ok, root_b} =
        Taxonomy.create_taxon(%{taxonomy_id: taxonomy.id, code: "root_b", name: "Root B"})

      {:ok, child} =
        Taxonomy.create_taxon(%{
          taxonomy_id: taxonomy.id,
          parent_id: root_a.id,
          code: "child2",
          name: "Child"
        })

      {:ok, grandchild} =
        Taxonomy.create_taxon(%{
          taxonomy_id: taxonomy.id,
          parent_id: child.id,
          code: "grandchild2",
          name: "Grandchild"
        })

      assert {:ok, _} = Taxonomy.move_taxon(child.id, root_b.id)

      descendants_a = Taxonomy.list_descendants(root_a.id)
      descendants_b = Taxonomy.list_descendants(root_b.id)

      refute Enum.any?(descendants_a, fn item -> item.taxon.id == child.id end)

      assert Enum.any?(descendants_b, fn item -> item.taxon.id == child.id and item.depth == 1 end)

      assert Enum.any?(descendants_b, fn item ->
               item.taxon.id == grandchild.id and item.depth == 2
             end)
    end

    test "move_taxon/2 rejects cycles" do
      taxonomy =
        TaxonomyFixtures.taxonomy_fixture("type-#{System.unique_integer([:positive])}", "Type")

      {:ok, root} =
        Taxonomy.create_taxon(%{taxonomy_id: taxonomy.id, code: "cycle_root", name: "Root"})

      {:ok, child} =
        Taxonomy.create_taxon(%{
          taxonomy_id: taxonomy.id,
          parent_id: root.id,
          code: "cycle_child",
          name: "Child"
        })

      assert {:error, :cycle_detected} = Taxonomy.move_taxon(root.id, child.id)
    end
  end
end
