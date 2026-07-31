defmodule ProductCompare.Taxonomy.Hierarchy do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Taxonomy.{Taxon, TaxonClosure, Taxonomy}

  def create_taxon(attrs) do
    changeset = Taxon.changeset(%Taxon{}, attrs)

    if changeset.valid? do
      parent_id = Ecto.Changeset.get_field(changeset, :parent_id)
      taxonomy_id = Ecto.Changeset.get_field(changeset, :taxonomy_id)
      now = DateTime.utc_now()

      Repo.transaction(fn ->
        with {:ok, _taxonomy} <- lock_taxonomy(taxonomy_id),
             :ok <- validate_parent_taxonomy(parent_id, taxonomy_id),
             {:ok, taxon} <- Repo.insert(changeset) do
          insert_closure_rows(taxon, parent_id, now)
          taxon
        else
          {:error, reason} -> Repo.rollback(reason)
        end
      end)
      |> case do
        {:ok, taxon} -> {:ok, taxon}
        {:error, reason} -> {:error, reason}
      end
    else
      {:error, changeset}
    end
  end

  def update_taxon(%Taxon{} = taxon, attrs) when is_map(attrs) do
    taxon
    |> Taxon.changeset(attrs)
    |> Repo.update()
  end

  def move_taxon(taxon_id, new_parent_id) do
    Repo.transaction(fn ->
      with {:ok, initial_taxon} <- fetch_taxon(taxon_id),
           {:ok, _taxonomy} <- lock_taxonomy(initial_taxon.taxonomy_id),
           {:ok, taxon} <- fetch_taxon_for_update(taxon_id),
           :ok <- validate_move_target(taxon, new_parent_id),
           :ok <- ensure_not_cycle(taxon_id, new_parent_id) do
        move_taxon_transaction(taxon, taxon_id, new_parent_id, DateTime.utc_now())
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
    |> case do
      {:ok, moved_taxon} -> {:ok, moved_taxon}
      {:error, reason} -> {:error, reason}
    end
  end

  defp insert_closure_rows(taxon, parent_id, now) do
    self_row = %{ancestor_id: taxon.id, descendant_id: taxon.id, depth: 0, inserted_at: now}

    parent_rows =
      if parent_id do
        Repo.all(
          from c in TaxonClosure,
            where: c.descendant_id == ^parent_id,
            select: {c.ancestor_id, c.depth}
        )
        |> Enum.map(fn {ancestor_id, depth} ->
          %{
            ancestor_id: ancestor_id,
            descendant_id: taxon.id,
            depth: depth + 1,
            inserted_at: now
          }
        end)
      else
        []
      end

    {count, _} = Repo.insert_all(TaxonClosure, [self_row | parent_rows])

    if count < 1, do: Repo.rollback(:closure_insert_failed)
  end

  defp move_taxon_transaction(taxon, taxon_id, new_parent_id, now) do
    case Repo.update(Taxon.move_changeset(taxon, new_parent_id)) do
      {:ok, moved_taxon} ->
        subtree = subtree(taxon_id)
        remove_old_paths(taxon_id, subtree)
        insert_new_paths(new_parent_id, subtree, now)
        moved_taxon

      {:error, changeset} ->
        Repo.rollback(changeset)
    end
  end

  defp subtree(taxon_id) do
    Repo.all(
      from c in TaxonClosure,
        where: c.ancestor_id == ^taxon_id,
        select: %{descendant_id: c.descendant_id, depth: c.depth}
    )
  end

  defp remove_old_paths(taxon_id, subtree) do
    subtree_ids = Enum.map(subtree, & &1.descendant_id)

    old_ancestor_ids =
      Repo.all(
        from c in TaxonClosure,
          where: c.descendant_id == ^taxon_id and c.ancestor_id not in ^subtree_ids,
          select: c.ancestor_id
      )

    Repo.delete_all(
      from c in TaxonClosure,
        where: c.descendant_id in ^subtree_ids and c.ancestor_id in ^old_ancestor_ids
    )
  end

  defp insert_new_paths(nil, _subtree, _now), do: :ok

  defp insert_new_paths(new_parent_id, subtree, now) do
    new_ancestors =
      Repo.all(
        from c in TaxonClosure,
          where: c.descendant_id == ^new_parent_id,
          select: %{ancestor_id: c.ancestor_id, depth: c.depth}
      )

    rows =
      for ancestor <- new_ancestors,
          subtree_item <- subtree do
        %{
          ancestor_id: ancestor.ancestor_id,
          descendant_id: subtree_item.descendant_id,
          depth: ancestor.depth + subtree_item.depth + 1,
          inserted_at: now
        }
      end

    Repo.insert_all(TaxonClosure, rows, on_conflict: :nothing)
  end

  def list_descendants(taxon_id) do
    Repo.all(
      from c in TaxonClosure,
        join: t in Taxon,
        on: t.id == c.descendant_id,
        where: c.ancestor_id == ^taxon_id and c.depth > 0,
        order_by: [asc: c.depth, asc: t.name],
        select: %{taxon: t, depth: c.depth}
    )
  end

  def list_ancestors(taxon_id) do
    Repo.all(
      from c in TaxonClosure,
        join: t in Taxon,
        on: t.id == c.ancestor_id,
        where: c.descendant_id == ^taxon_id and c.depth > 0,
        order_by: [asc: c.depth, asc: t.name],
        select: %{taxon: t, depth: c.depth}
    )
  end

  defp fetch_taxon(taxon_id) do
    case Repo.get(Taxon, taxon_id) do
      nil -> {:error, :taxon_not_found}
      taxon -> {:ok, taxon}
    end
  end

  defp fetch_taxon_for_update(taxon_id) do
    case Repo.one(from taxon in Taxon, where: taxon.id == ^taxon_id, lock: "FOR UPDATE") do
      nil -> {:error, :taxon_not_found}
      taxon -> {:ok, taxon}
    end
  end

  defp lock_taxonomy(taxonomy_id) do
    case Repo.one(
           from taxonomy in Taxonomy,
             where: taxonomy.id == ^taxonomy_id,
             lock: "FOR UPDATE"
         ) do
      nil -> {:error, :taxonomy_not_found}
      taxonomy -> {:ok, taxonomy}
    end
  end

  defp validate_parent_taxonomy(nil, _taxonomy_id), do: :ok

  defp validate_parent_taxonomy(parent_id, taxonomy_id) do
    with {:ok, normalized_taxonomy_id} <- Input.normalize_integer_id(taxonomy_id) do
      case Repo.get(Taxon, parent_id) do
        nil -> {:error, :parent_not_found}
        %Taxon{taxonomy_id: ^normalized_taxonomy_id} -> :ok
        _ -> {:error, :parent_taxonomy_mismatch}
      end
    else
      :error -> {:error, :parent_taxonomy_mismatch}
    end
  end

  defp validate_move_target(_taxon, nil), do: :ok

  defp validate_move_target(%Taxon{taxonomy_id: taxonomy_id}, new_parent_id) do
    case Repo.get(Taxon, new_parent_id) do
      nil -> {:error, :new_parent_not_found}
      %Taxon{taxonomy_id: ^taxonomy_id} -> :ok
      _ -> {:error, :parent_taxonomy_mismatch}
    end
  end

  defp ensure_not_cycle(_taxon_id, nil), do: :ok

  defp ensure_not_cycle(taxon_id, taxon_id), do: {:error, :cycle_detected}

  defp ensure_not_cycle(taxon_id, new_parent_id) do
    query =
      from c in TaxonClosure,
        where: c.ancestor_id == ^taxon_id and c.descendant_id == ^new_parent_id and c.depth > 0,
        select: c.id

    if Repo.exists?(query), do: {:error, :cycle_detected}, else: :ok
  end
end
