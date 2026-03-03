defmodule ProductCompare.Taxonomy do
  @moduledoc """
  Taxonomy context for hard type taxonomy and soft use-case tags.
  """

  import Ecto.Query

  alias Ecto.Multi
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Taxonomy.{ProductTaxon, Taxon, TaxonAlias, TaxonClosure, Taxonomy}

  @type closure_result :: %{taxon: Taxon.t(), depth: non_neg_integer()}

  @spec seed_default_taxonomies() :: {:ok, [Taxonomy.t()]} | {:error, Ecto.Changeset.t()}
  def seed_default_taxonomies do
    with {:ok, type} <- upsert_taxonomy(%{code: "type", name: "Type"}),
         {:ok, use_case} <- upsert_taxonomy(%{code: "use_case", name: "Use Case"}) do
      {:ok, [type, use_case]}
    end
  end

  @spec upsert_taxonomy(map()) :: {:ok, Taxonomy.t()} | {:error, Ecto.Changeset.t()}
  def upsert_taxonomy(attrs) do
    code = Map.get(attrs, :code) || Map.get(attrs, "code")

    case Repo.get_by(Taxonomy, code: code) do
      nil ->
        %Taxonomy{}
        |> Taxonomy.changeset(attrs)
        |> Repo.insert()

      taxonomy ->
        taxonomy
        |> Taxonomy.changeset(attrs)
        |> Repo.update()
    end
  end

  @spec create_taxon(map()) :: {:ok, Taxon.t()} | {:error, term()}
  def create_taxon(attrs) do
    parent_id = Map.get(attrs, :parent_id) || Map.get(attrs, "parent_id")
    taxonomy_id = Map.get(attrs, :taxonomy_id) || Map.get(attrs, "taxonomy_id")

    with :ok <- validate_parent_taxonomy(parent_id, taxonomy_id) do
      now = DateTime.utc_now()

      Multi.new()
      |> Multi.insert(:taxon, Taxon.changeset(%Taxon{}, attrs))
      |> Multi.run(:closure_rows, fn repo, %{taxon: taxon} ->
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

        rows = [self_row | parent_rows]
        {count, _} = repo.insert_all(TaxonClosure, rows)

        if count >= 1 do
          {:ok, rows}
        else
          {:error, :closure_insert_failed}
        end
      end)
      |> Repo.transaction()
      |> case do
        {:ok, %{taxon: taxon}} -> {:ok, taxon}
        {:error, _step, reason, _changes} -> {:error, reason}
      end
    end
  end

  @spec move_taxon(pos_integer(), pos_integer() | nil) :: {:ok, Taxon.t()} | {:error, term()}
  def move_taxon(taxon_id, new_parent_id) do
    with {:ok, taxon} <- fetch_taxon(taxon_id),
         :ok <- validate_move_target(taxon, new_parent_id),
         :ok <- ensure_not_cycle(taxon_id, new_parent_id) do
      now = DateTime.utc_now()

      Multi.new()
      |> Multi.update(:taxon, Taxon.changeset(taxon, %{parent_id: new_parent_id}))
      |> Multi.run(:subtree, fn repo, _changes ->
        subtree =
          repo.all(
            from c in TaxonClosure,
              where: c.ancestor_id == ^taxon_id,
              select: %{descendant_id: c.descendant_id, depth: c.depth}
          )

        {:ok, subtree}
      end)
      |> Multi.run(:old_ancestors, fn repo, %{subtree: subtree} ->
        subtree_ids = Enum.map(subtree, & &1.descendant_id)

        old_ancestor_ids =
          repo.all(
            from c in TaxonClosure,
              where: c.descendant_id == ^taxon_id and c.ancestor_id not in ^subtree_ids,
              select: c.ancestor_id
          )

        {:ok, old_ancestor_ids}
      end)
      |> Multi.run(:remove_old_paths, fn repo,
                                         %{subtree: subtree, old_ancestors: old_ancestor_ids} ->
        subtree_ids = Enum.map(subtree, & &1.descendant_id)

        repo.delete_all(
          from c in TaxonClosure,
            where: c.descendant_id in ^subtree_ids and c.ancestor_id in ^old_ancestor_ids
        )

        {:ok, :deleted}
      end)
      |> Multi.run(:insert_new_paths, fn repo, %{subtree: subtree} ->
        if is_nil(new_parent_id) do
          {:ok, []}
        else
          new_ancestors =
            repo.all(
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

          repo.insert_all(TaxonClosure, rows, on_conflict: :nothing)
          {:ok, rows}
        end
      end)
      |> Repo.transaction()
      |> case do
        {:ok, %{taxon: moved_taxon}} -> {:ok, moved_taxon}
        {:error, _step, reason, _changes} -> {:error, reason}
      end
    end
  end

  @spec list_descendants(pos_integer()) :: [closure_result()]
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

  @spec list_ancestors(pos_integer()) :: [closure_result()]
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

  @spec assign_use_case(
          pos_integer(),
          pos_integer(),
          pos_integer() | nil,
          ProductTaxon.source_type(),
          Decimal.t() | float() | nil
        ) ::
          {:ok, ProductTaxon.t()} | {:error, term()}
  def assign_use_case(product_id, use_case_taxon_id, created_by, source_type, confidence \\ nil) do
    with {:ok, :use_case} <- ensure_taxon_in_taxonomy(use_case_taxon_id, "use_case") do
      %ProductTaxon{}
      |> ProductTaxon.changeset(%{
        product_id: product_id,
        taxon_id: use_case_taxon_id,
        created_by: created_by,
        source_type: source_type,
        confidence: confidence
      })
      |> Repo.insert(
        on_conflict: {:replace, [:source_type, :confidence, :created_by, :inserted_at]},
        conflict_target: [:product_id, :taxon_id],
        returning: true
      )
    end
  end

  @spec unassign_use_case(pos_integer(), pos_integer()) :: {:ok, non_neg_integer()}
  def unassign_use_case(product_id, use_case_taxon_id) do
    {count, _} =
      Repo.delete_all(
        from pt in ProductTaxon,
          where: pt.product_id == ^product_id and pt.taxon_id == ^use_case_taxon_id
      )

    {:ok, count}
  end

  @spec ensure_taxon_in_taxonomy(pos_integer(), String.t()) ::
          {:ok, :use_case | :type} | {:error, :invalid_taxon}
  def ensure_taxon_in_taxonomy(taxon_id, taxonomy_code) do
    query =
      from t in Taxon,
        join: tx in Taxonomy,
        on: tx.id == t.taxonomy_id,
        where: t.id == ^taxon_id and tx.code == ^taxonomy_code,
        select: tx.code

    case Repo.one(query) do
      nil -> {:error, :invalid_taxon}
      "use_case" -> {:ok, :use_case}
      "type" -> {:ok, :type}
      _ -> {:error, :invalid_taxon}
    end
  end

  @spec list_taxon_aliases(pos_integer()) :: [TaxonAlias.t()]
  def list_taxon_aliases(taxon_id) do
    Repo.all(from ta in TaxonAlias, where: ta.taxon_id == ^taxon_id, order_by: [asc: ta.alias])
  end

  defp fetch_taxon(taxon_id) do
    case Repo.get(Taxon, taxon_id) do
      nil -> {:error, :taxon_not_found}
      taxon -> {:ok, taxon}
    end
  end

  defp validate_parent_taxonomy(nil, _taxonomy_id), do: :ok

  defp validate_parent_taxonomy(parent_id, taxonomy_id) do
    with {:ok, normalized_taxonomy_id} <- normalize_integer_id(taxonomy_id) do
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

  defp normalize_integer_id(value) when is_integer(value), do: {:ok, value}

  defp normalize_integer_id(value) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} -> {:ok, parsed}
      _ -> :error
    end
  end

  defp normalize_integer_id(_value), do: :error
end
