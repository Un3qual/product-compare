defmodule ProductCompare.Specs do
  @moduledoc """
  Specs context for dimensions, units, attributes, and claim workflows.
  """

  import Ecto.Query

  alias Ecto.Multi
  alias ProductCompare.Repo
  alias ProductCompare.Specs.UnitConversion
  alias ProductCompareSchemas.Specs.Attribute
  alias ProductCompareSchemas.Specs.ClaimEvidence
  alias ProductCompareSchemas.Specs.Dimension
  alias ProductCompareSchemas.Specs.EnumOption
  alias ProductCompareSchemas.Specs.EnumSet
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.SourceArtifact
  alias ProductCompareSchemas.Specs.TaxonAttribute
  alias ProductCompareSchemas.Specs.Unit
  alias ProductCompareSchemas.Catalog.Product

  @max_bigint_id 9_223_372_036_854_775_807

  @spec upsert_dimension(map()) :: {:ok, Dimension.t()} | {:error, Ecto.Changeset.t()}
  def upsert_dimension(attrs) do
    now = DateTime.utc_now()
    changeset = Dimension.changeset(%Dimension{}, attrs)

    update_fields =
      changeset.changes
      |> Map.drop([:code])
      |> Map.to_list()

    Repo.insert(
      changeset,
      on_conflict: [set: update_fields ++ [updated_at: now]],
      conflict_target: [:code],
      returning: true
    )
  end

  @spec upsert_unit(map()) :: {:ok, Unit.t()} | {:error, Ecto.Changeset.t()}
  def upsert_unit(attrs) do
    now = DateTime.utc_now()
    changeset = Unit.changeset(%Unit{}, attrs)

    update_fields =
      changeset.changes
      |> Map.drop([:dimension_id, :code])
      |> Map.to_list()

    Repo.insert(
      changeset,
      on_conflict: [set: update_fields ++ [updated_at: now]],
      conflict_target: [:dimension_id, :code],
      returning: true
    )
  end

  @spec upsert_enum_set(map()) :: {:ok, EnumSet.t()} | {:error, Ecto.Changeset.t()}
  def upsert_enum_set(attrs) do
    now = DateTime.utc_now()
    changeset = EnumSet.changeset(%EnumSet{}, attrs)

    update_fields =
      changeset.changes
      |> Map.drop([:code])
      |> Map.to_list()

    Repo.insert(
      changeset,
      on_conflict: [set: update_fields ++ [updated_at: now]],
      conflict_target: [:code],
      returning: true
    )
  end

  @spec upsert_enum_option(map()) :: {:ok, EnumOption.t()} | {:error, Ecto.Changeset.t()}
  def upsert_enum_option(attrs) do
    now = DateTime.utc_now()
    changeset = EnumOption.changeset(%EnumOption{}, attrs)

    update_fields =
      changeset.changes
      |> Map.drop([:enum_set_id, :code])
      |> Map.to_list()

    Repo.insert(
      changeset,
      on_conflict: [set: update_fields ++ [updated_at: now]],
      conflict_target: [:enum_set_id, :code],
      returning: true
    )
  end

  @spec upsert_attribute(map()) :: {:ok, Attribute.t()} | {:error, Ecto.Changeset.t()}
  def upsert_attribute(attrs) do
    changeset = Attribute.changeset(%Attribute{}, attrs)

    update_fields =
      changeset.changes
      |> Map.drop([:code])
      |> Map.to_list()

    Repo.insert(
      changeset,
      on_conflict: [set: update_fields],
      conflict_target: [:code],
      returning: true
    )
  end

  @spec convert_to_base(Decimal.t() | number(), pos_integer()) ::
          {:ok, Decimal.t()} | {:error, :unit_not_found}
  def convert_to_base(value_num, unit_id) do
    case Repo.get(Unit, unit_id) do
      nil -> {:error, :unit_not_found}
      unit -> {:ok, UnitConversion.to_base(value_num, unit)}
    end
  end

  @spec get_source_artifact(integer()) :: SourceArtifact.t() | nil
  def get_source_artifact(id) when is_integer(id) and id >= 1 and id <= @max_bigint_id do
    SourceArtifact
    |> Repo.get(id)
    |> Repo.preload(:source)
  end

  def get_source_artifact(_id), do: nil

  @spec propose_claim(pos_integer(), pos_integer(), map(), map()) ::
          {:ok, ProductAttributeClaim.t()} | {:error, term()}
  def propose_claim(product_id, attribute_id, typed_value, provenance) do
    with {:ok, attribute} <- fetch_attribute(attribute_id),
         {:ok, normalized_value} <- normalize_typed_value(attribute, typed_value) do
      attrs =
        normalized_value
        |> Map.merge(%{
          product_id: product_id,
          attribute_id: attribute_id,
          source_type: Map.get(provenance, :source_type, :user),
          status: :proposed,
          created_by: Map.get(provenance, :created_by),
          confidence: Map.get(provenance, :confidence)
        })

      Multi.new()
      |> Multi.insert(:claim, ProductAttributeClaim.changeset(%ProductAttributeClaim{}, attrs))
      |> Multi.run(:evidence, fn repo, %{claim: claim} ->
        maybe_insert_evidence(repo, claim, provenance)
      end)
      |> Repo.transaction()
      |> case do
        {:ok, %{claim: claim}} -> {:ok, claim}
        {:error, _step, reason, _changes} -> {:error, reason}
      end
    end
  end

  @spec accept_claim(pos_integer(), pos_integer()) ::
          {:ok, ProductAttributeClaim.t()} | {:error, term()}
  def accept_claim(claim_id, moderator_user_id) do
    update_claim_status(claim_id, moderator_user_id, :accepted)
  end

  @spec reject_claim(pos_integer(), pos_integer()) ::
          {:ok, ProductAttributeClaim.t()} | {:error, term()}
  def reject_claim(claim_id, moderator_user_id) do
    update_claim_status(claim_id, moderator_user_id, :rejected)
  end

  @spec select_current_claim(pos_integer(), pos_integer(), pos_integer(), pos_integer()) ::
          {:ok, ProductAttributeCurrent.t()} | {:error, term()}
  def select_current_claim(product_id, attribute_id, claim_id, selector_user_id) do
    Multi.new()
    |> Multi.run(:claim, fn repo, _changes ->
      case repo.get(ProductAttributeClaim, claim_id) do
        nil ->
          {:error, :claim_not_found}

        %ProductAttributeClaim{
          product_id: ^product_id,
          attribute_id: ^attribute_id,
          status: :accepted
        } = claim ->
          {:ok, claim}

        %ProductAttributeClaim{product_id: ^product_id, attribute_id: ^attribute_id} ->
          {:error, :claim_not_accepted}

        _ ->
          {:error, :claim_product_attribute_mismatch}
      end
    end)
    |> Multi.run(:lock_existing, fn repo, _changes ->
      repo.one(
        from pac in ProductAttributeCurrent,
          where: pac.product_id == ^product_id and pac.attribute_id == ^attribute_id,
          lock: "FOR UPDATE"
      )

      {:ok, :locked}
    end)
    |> Multi.run(:upsert_current, fn repo, _changes ->
      now = DateTime.utc_now()

      attrs = %{
        product_id: product_id,
        attribute_id: attribute_id,
        claim_id: claim_id,
        selected_by: selector_user_id,
        selected_at: now
      }

      %ProductAttributeCurrent{}
      |> ProductAttributeCurrent.changeset(attrs)
      |> repo.insert(
        on_conflict: [set: [claim_id: claim_id, selected_by: selector_user_id, selected_at: now]],
        conflict_target: [:product_id, :attribute_id],
        returning: true
      )
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{upsert_current: current}} -> {:ok, current}
      {:error, _step, reason, _changes} -> {:error, reason}
    end
  end

  @spec list_current_attributes_for_product(pos_integer()) :: [map()]
  def list_current_attributes_for_product(product_id) do
    product = Repo.get(Product, product_id)

    product_id
    |> current_attributes_query()
    |> Repo.all()
    |> with_current_attribute_metadata(product && product.primary_type_taxon_id)
  end

  @spec with_current_attribute_metadata([ProductAttributeCurrent.t()], pos_integer() | nil) :: [
          map()
        ]
  def with_current_attribute_metadata(current_attributes, taxon_id)
      when is_list(current_attributes) do
    taxon_attributes =
      current_attributes
      |> Enum.map(& &1.attribute_id)
      |> taxon_attribute_metadata_by_attribute_id(taxon_id)

    current_attributes
    |> Enum.map(fn current_attribute ->
      %{
        current: current_attribute,
        attribute: current_attribute.attribute,
        claim: current_attribute.claim,
        taxon_attribute: Map.get(taxon_attributes, current_attribute.attribute_id)
      }
    end)
    |> Enum.sort_by(&current_attribute_sort_key/1)
  end

  @spec list_filterable_attributes([atom()]) :: [Attribute.t()]
  def list_filterable_attributes(data_types) when is_list(data_types) do
    Repo.all(
      from attribute in Attribute,
        where: attribute.is_filterable == true,
        where: attribute.data_type in ^data_types,
        order_by: [asc: attribute.display_name, asc: attribute.code, asc: attribute.id]
    )
  end

  @spec get_filterable_attribute(pos_integer(), atom()) :: Attribute.t() | nil
  def get_filterable_attribute(attribute_id, data_type)
      when is_integer(attribute_id) and is_atom(data_type) do
    Repo.one(
      from attribute in Attribute,
        where: attribute.id == ^attribute_id,
        where: attribute.data_type == ^data_type,
        where: attribute.is_filterable == true
    )
  end

  @spec enum_option_belongs_to_attribute?(pos_integer(), pos_integer()) :: boolean()
  def enum_option_belongs_to_attribute?(attribute_id, enum_option_id)
      when is_integer(attribute_id) and is_integer(enum_option_id) do
    Repo.exists?(
      from attribute in Attribute,
        join: enum_option in EnumOption,
        on: enum_option.enum_set_id == attribute.enum_set_id,
        where: attribute.id == ^attribute_id,
        where: attribute.data_type == :enum,
        where: attribute.is_filterable == true,
        where: enum_option.id == ^enum_option_id
    )
  end

  @spec list_enum_options_for_set(pos_integer()) :: [EnumOption.t()]
  def list_enum_options_for_set(enum_set_id) when is_integer(enum_set_id) do
    Repo.all(
      from enum_option in EnumOption,
        where: enum_option.enum_set_id == ^enum_set_id,
        order_by: [asc: enum_option.sort_order, asc: enum_option.label, asc: enum_option.id]
    )
  end

  @spec unit_symbol_for_dimension(pos_integer() | nil) :: String.t() | nil
  def unit_symbol_for_dimension(nil), do: nil

  def unit_symbol_for_dimension(dimension_id) when is_integer(dimension_id) do
    Repo.one(
      from unit in Unit,
        where: unit.dimension_id == ^dimension_id,
        order_by: [asc: unit.id],
        limit: 1,
        select: fragment("NULLIF(COALESCE(?, ?), '')", unit.symbol, unit.code)
    )
  end

  defp fetch_attribute(attribute_id) do
    case Repo.get(Attribute, attribute_id) do
      nil -> {:error, :attribute_not_found}
      attribute -> {:ok, attribute}
    end
  end

  defp current_attributes_query(product_id) do
    ProductAttributeCurrent
    |> where([current], current.product_id == ^product_id)
    |> join(:inner, [current], attribute in assoc(current, :attribute))
    |> order_by([_current, attribute], asc: attribute.display_name, asc: attribute.code)
    |> preload([_current, attribute], attribute: attribute, claim: [:unit, :enum_option])
  end

  defp taxon_attribute_metadata_by_attribute_id(_attribute_ids, nil), do: %{}

  defp taxon_attribute_metadata_by_attribute_id([], _taxon_id), do: %{}

  defp taxon_attribute_metadata_by_attribute_id(attribute_ids, taxon_id)
       when is_integer(taxon_id) do
    TaxonAttribute
    |> where([taxon_attribute], taxon_attribute.taxon_id == ^taxon_id)
    |> where([taxon_attribute], taxon_attribute.attribute_id in ^attribute_ids)
    |> Repo.all()
    |> Map.new(&{&1.attribute_id, &1})
  end

  defp current_attribute_sort_key(%{attribute: attribute, taxon_attribute: taxon_attribute}) do
    sort_order = taxon_attribute && taxon_attribute.sort_order

    {
      if(is_integer(sort_order), do: 0, else: 1),
      sort_order || 0,
      String.downcase(attribute.display_name || ""),
      attribute.code || ""
    }
  end

  defp normalize_typed_value(%Attribute{data_type: :bool}, typed_value) do
    with {:ok, value_bool} <- fetch_typed_value(typed_value, :value_bool) do
      {:ok, %{value_bool: value_bool}}
    end
  end

  defp normalize_typed_value(%Attribute{data_type: :int}, typed_value) do
    with {:ok, value_int} <- fetch_typed_value(typed_value, :value_int) do
      {:ok, %{value_int: value_int}}
    end
  end

  defp normalize_typed_value(
         %Attribute{data_type: :numeric, dimension_id: dimension_id},
         typed_value
       ) do
    with {:ok, value_num} <- fetch_typed_value(typed_value, :value_num),
         {:ok, unit_id} <- fetch_typed_value(typed_value, :unit_id),
         {:ok, unit} <- fetch_unit(unit_id, dimension_id),
         {:ok, value_num_base_min} <-
           normalize_numeric_range_bound(
             typed_value,
             :value_num_base_min,
             :value_num_min,
             unit
           ),
         {:ok, value_num_base_max} <-
           normalize_numeric_range_bound(
             typed_value,
             :value_num_base_max,
             :value_num_max,
             unit
           ),
         :ok <- validate_numeric_range(value_num_base_min, value_num_base_max) do
      value_num_base = UnitConversion.to_base(value_num, unit)

      {:ok,
       %{
         value_num: value_num,
         unit_id: unit_id,
         value_num_base: value_num_base,
         value_num_base_min: value_num_base_min,
         value_num_base_max: value_num_base_max
       }}
    end
  end

  defp normalize_typed_value(%Attribute{data_type: :text}, typed_value) do
    with {:ok, value_text} <- fetch_typed_value(typed_value, :value_text) do
      {:ok, %{value_text: value_text}}
    end
  end

  defp normalize_typed_value(%Attribute{data_type: :enum} = attribute, typed_value) do
    with {:ok, enum_option_id} <- fetch_typed_value(typed_value, :enum_option_id),
         {:ok, validated_enum_option_id} <- validate_enum_option_id(enum_option_id, attribute) do
      {:ok, %{enum_option_id: validated_enum_option_id}}
    end
  end

  defp normalize_typed_value(%Attribute{data_type: :date}, typed_value) do
    with {:ok, value_date} <- fetch_typed_value(typed_value, :value_date) do
      {:ok, %{value_date: value_date}}
    end
  end

  defp normalize_typed_value(%Attribute{data_type: :timestamp}, typed_value) do
    with {:ok, value_ts} <- fetch_typed_value(typed_value, :value_ts) do
      {:ok, %{value_ts: value_ts}}
    end
  end

  defp normalize_typed_value(%Attribute{data_type: :json}, typed_value) do
    with {:ok, value_json} <- fetch_typed_value(typed_value, :value_json) do
      {:ok, %{value_json: value_json}}
    end
  end

  defp validate_enum_option_id(enum_option_id, %Attribute{enum_set_id: enum_set_id})
       when not is_nil(enum_set_id) do
    case Repo.get(EnumOption, enum_option_id) do
      %EnumOption{enum_set_id: ^enum_set_id} -> {:ok, enum_option_id}
      _ -> {:error, :invalid_enum_option}
    end
  end

  defp validate_enum_option_id(_enum_option_id, _attribute), do: {:error, :invalid_enum_option}

  defp fetch_typed_value(typed_value, key) do
    case get_value(typed_value, key) do
      nil -> {:error, {:missing_typed_value, key}}
      value -> {:ok, value}
    end
  end

  defp fetch_unit(unit_id, dimension_id) do
    case Repo.get(Unit, unit_id) do
      nil -> {:error, :unit_not_found}
      %Unit{dimension_id: ^dimension_id} = unit -> {:ok, unit}
      _ -> {:error, :unit_dimension_mismatch}
    end
  end

  defp update_claim_status(claim_id, _moderator_user_id, new_status) do
    case Repo.get(ProductAttributeClaim, claim_id) do
      nil ->
        {:error, :claim_not_found}

      %ProductAttributeClaim{status: ^new_status} = claim ->
        {:ok, claim}

      %ProductAttributeClaim{status: :proposed} = claim ->
        claim
        |> ProductAttributeClaim.changeset(%{status: new_status})
        |> Repo.update()

      %ProductAttributeClaim{} ->
        {:error, :invalid_status_transition}
    end
  end

  defp maybe_insert_evidence(repo, claim, provenance) do
    case Map.get(provenance, :artifact_id) do
      nil ->
        {:ok, :no_evidence}

      artifact_id ->
        evidence_attrs = %{
          claim_id: claim.id,
          artifact_id: artifact_id,
          excerpt: Map.get(provenance, :excerpt)
        }

        %ClaimEvidence{}
        |> ClaimEvidence.changeset(evidence_attrs)
        |> repo.insert(on_conflict: :nothing)
    end
  end

  defp get_value(map, key) when is_map(map) do
    case Map.fetch(map, key) do
      {:ok, value} ->
        value

      :error ->
        Map.get(map, Atom.to_string(key))
    end
  end

  defp normalize_numeric_range_bound(typed_value, base_key, source_unit_key, unit) do
    case {get_value(typed_value, base_key), get_value(typed_value, source_unit_key)} do
      {nil, nil} ->
        {:ok, nil}

      {base_value, nil} ->
        to_decimal(base_value)

      {nil, source_unit_value} ->
        with {:ok, source_decimal} <- to_decimal(source_unit_value) do
          {:ok, UnitConversion.to_base(source_decimal, unit)}
        end

      {_base_value, _source_unit_value} ->
        {:error, {:conflicting_numeric_range_bound, base_key, source_unit_key}}
    end
  end

  defp validate_numeric_range(nil, _max), do: :ok
  defp validate_numeric_range(_min, nil), do: :ok

  defp validate_numeric_range(min, max) do
    if Decimal.compare(min, max) == :gt do
      {:error, :invalid_numeric_range}
    else
      :ok
    end
  end

  defp to_decimal(%Decimal{} = value), do: {:ok, value}
  defp to_decimal(value) when is_integer(value), do: {:ok, Decimal.new(value)}
  defp to_decimal(value) when is_float(value), do: {:ok, Decimal.from_float(value)}

  defp to_decimal(value) when is_binary(value) do
    case Decimal.parse(value) do
      {decimal, ""} -> {:ok, decimal}
      _ -> {:error, :invalid_decimal}
    end
  end

  defp to_decimal(_value), do: {:error, :invalid_decimal_type}
end
