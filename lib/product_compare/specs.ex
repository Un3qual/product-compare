defmodule ProductCompare.Specs do
  @moduledoc """
  Specs context for dimensions, units, attributes, and claim workflows.
  """

  import Ecto.Query

  alias Ecto.Multi
  alias ProductCompare.Repo
  alias ProductCompare.Specs.UnitConversion
  alias ProductCompareSchemas.DecimalInput
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
  defguardp valid_id_guard(id) when is_integer(id) and id > 0 and id <= @max_bigint_id

  @spec upsert_dimension(map()) :: {:ok, Dimension.t()} | {:error, Ecto.Changeset.t()}
  def upsert_dimension(attrs) do
    upsert_by_conflict(Dimension, attrs, [:code])
  end

  @spec upsert_unit(map()) :: {:ok, Unit.t()} | {:error, Ecto.Changeset.t()}
  def upsert_unit(attrs) do
    upsert_by_conflict(Unit, attrs, [:dimension_id, :code])
  end

  @spec upsert_enum_set(map()) :: {:ok, EnumSet.t()} | {:error, Ecto.Changeset.t()}
  def upsert_enum_set(attrs) do
    upsert_by_conflict(EnumSet, attrs, [:code])
  end

  @spec upsert_enum_option(map()) :: {:ok, EnumOption.t()} | {:error, Ecto.Changeset.t()}
  def upsert_enum_option(attrs) do
    upsert_by_conflict(EnumOption, attrs, [:enum_set_id, :code])
  end

  defp upsert_by_conflict(schema_module, attrs, conflict_fields) do
    now = DateTime.utc_now()
    changeset = schema_module.changeset(struct(schema_module), attrs)

    update_fields =
      changeset.changes
      |> Map.drop(conflict_fields)
      |> Map.to_list()

    Repo.insert(
      changeset,
      on_conflict: [set: update_fields ++ [updated_at: now]],
      conflict_target: conflict_fields,
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

  @spec convert_to_base(Decimal.t() | number() | binary(), term()) ::
          {:ok, Decimal.t()} | {:error, :unit_not_found | :invalid_decimal}
  def convert_to_base(value_num, unit_id) when valid_id_guard(unit_id) do
    case Repo.get(Unit, unit_id) do
      nil -> {:error, :unit_not_found}
      unit -> to_base(value_num, unit)
    end
  end

  def convert_to_base(_value_num, _unit_id), do: {:error, :unit_not_found}

  @spec get_source_artifact(term()) :: SourceArtifact.t() | nil
  def get_source_artifact(id) when valid_id_guard(id) do
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
      claim =
        repo.one(
          from claim in ProductAttributeClaim,
            where: claim.id == ^claim_id,
            lock: "FOR UPDATE"
        )

      case claim do
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

  @spec list_current_attributes_for_product(term()) :: [map()]
  def list_current_attributes_for_product(product_id) when valid_id_guard(product_id) do
    product = Repo.get(Product, product_id)

    product_id
    |> current_attributes_query()
    |> Repo.all()
    |> with_current_attribute_metadata(product && product.primary_type_taxon_id)
  end

  def list_current_attributes_for_product(_product_id), do: []

  @spec with_current_attribute_metadata([ProductAttributeCurrent.t()], pos_integer() | nil) :: [
          map()
        ]
  def with_current_attribute_metadata(current_attributes, taxon_id)
      when is_list(current_attributes) do
    taxon_attributes =
      current_attributes
      |> Enum.map(& &1.attribute_id)
      |> taxon_attribute_metadata_by_attribute_id(taxon_id)
      |> Map.values()

    with_current_attribute_metadata_from_taxon_attributes(current_attributes, taxon_attributes)
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

  @spec filterable_attribute_types(term()) :: %{pos_integer() => atom()}
  def filterable_attribute_types(attribute_ids) when is_list(attribute_ids) do
    attribute_ids
    |> normalize_ids()
    |> case do
      [] ->
        %{}

      ids ->
        Repo.all(
          from attribute in Attribute,
            where: attribute.id in ^ids,
            where: attribute.is_filterable == true,
            select: {attribute.id, attribute.data_type}
        )
        |> Map.new()
    end
  end

  def filterable_attribute_types(_attribute_ids), do: %{}

  @spec get_filterable_attribute(term(), term()) :: Attribute.t() | nil
  def get_filterable_attribute(attribute_id, data_type)
      when valid_id_guard(attribute_id) and is_atom(data_type) do
    Repo.one(
      from attribute in Attribute,
        where: attribute.id == ^attribute_id,
        where: attribute.data_type == ^data_type,
        where: attribute.is_filterable == true
    )
  end

  def get_filterable_attribute(_attribute_id, _data_type), do: nil

  @spec filterable_enum_option_pairs(term(), term()) :: MapSet.t()
  def filterable_enum_option_pairs(attribute_ids, enum_option_ids)
      when is_list(attribute_ids) and is_list(enum_option_ids) do
    attribute_ids = normalize_ids(attribute_ids)
    enum_option_ids = normalize_ids(enum_option_ids)

    if attribute_ids == [] or enum_option_ids == [] do
      MapSet.new()
    else
      Repo.all(
        from attribute in Attribute,
          join: enum_option in EnumOption,
          on: enum_option.enum_set_id == attribute.enum_set_id,
          where: attribute.id in ^attribute_ids,
          where: attribute.data_type == :enum,
          where: attribute.is_filterable == true,
          where: enum_option.id in ^enum_option_ids,
          select: {attribute.id, enum_option.id}
      )
      |> MapSet.new()
    end
  end

  def filterable_enum_option_pairs(_attribute_ids, _enum_option_ids), do: MapSet.new()

  @spec enum_option_belongs_to_attribute?(term(), term()) :: boolean()
  def enum_option_belongs_to_attribute?(attribute_id, enum_option_id)
      when valid_id_guard(attribute_id) and valid_id_guard(enum_option_id) do
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

  def enum_option_belongs_to_attribute?(_attribute_id, _enum_option_id), do: false

  @spec list_enum_options_for_set(term()) :: [EnumOption.t()]
  def list_enum_options_for_set(enum_set_id) when valid_id_guard(enum_set_id) do
    Repo.all(
      from enum_option in EnumOption,
        where: enum_option.enum_set_id == ^enum_set_id,
        order_by: [asc: enum_option.sort_order, asc: enum_option.label, asc: enum_option.id]
    )
  end

  def list_enum_options_for_set(_enum_set_id), do: []

  @spec list_enum_options_for_sets(term()) :: %{pos_integer() => [EnumOption.t()]}
  def list_enum_options_for_sets(enum_set_ids) when is_list(enum_set_ids) do
    enum_set_ids
    |> normalize_ids()
    |> case do
      [] ->
        %{}

      ids ->
        Repo.all(
          from enum_option in EnumOption,
            where: enum_option.enum_set_id in ^ids,
            order_by: [
              asc: enum_option.enum_set_id,
              asc: enum_option.sort_order,
              asc: enum_option.label,
              asc: enum_option.id
            ]
        )
        |> Enum.group_by(& &1.enum_set_id)
    end
  end

  def list_enum_options_for_sets(_enum_set_ids), do: %{}

  @spec unit_symbol_for_dimension(term()) :: String.t() | nil
  def unit_symbol_for_dimension(nil), do: nil

  def unit_symbol_for_dimension(dimension_id) when valid_id_guard(dimension_id) do
    dimension_id
    |> List.wrap()
    |> unit_symbols_for_dimensions()
    |> Map.get(dimension_id)
  end

  def unit_symbol_for_dimension(_dimension_id), do: nil

  @spec unit_symbols_for_dimensions(term()) :: %{pos_integer() => String.t()}
  def unit_symbols_for_dimensions(dimension_ids) when is_list(dimension_ids) do
    dimension_ids
    |> normalize_ids()
    |> case do
      [] ->
        %{}

      ids ->
        Repo.all(
          from unit in Unit,
            where: unit.dimension_id in ^ids,
            order_by: [
              asc: unit.dimension_id,
              asc:
                fragment(
                  "CASE WHEN ? = 1 AND ? = 0 THEN 0 ELSE 1 END",
                  unit.multiplier_to_base,
                  unit.offset_to_base
                ),
              asc: unit.id
            ],
            select: {
              unit.dimension_id,
              fragment("COALESCE(NULLIF(?, ''), NULLIF(?, ''))", unit.symbol, unit.code)
            }
        )
        |> Enum.reduce(%{}, fn {dimension_id, symbol}, acc ->
          Map.put_new(acc, dimension_id, symbol)
        end)
    end
  end

  def unit_symbols_for_dimensions(_dimension_ids), do: %{}

  @spec with_current_attribute_metadata_from_taxon_attributes(
          [ProductAttributeCurrent.t()],
          [TaxonAttribute.t()] | nil
        ) :: [map()]
  def with_current_attribute_metadata_from_taxon_attributes(current_attributes, taxon_attributes)
      when is_list(current_attributes) do
    attribute_ids = MapSet.new(current_attributes, & &1.attribute_id)

    taxon_attributes =
      taxon_attributes
      |> List.wrap()
      |> Enum.filter(&MapSet.member?(attribute_ids, &1.attribute_id))
      |> Map.new(&{&1.attribute_id, &1})

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
       when valid_id_guard(taxon_id) do
    TaxonAttribute
    |> where([taxon_attribute], taxon_attribute.taxon_id == ^taxon_id)
    |> where([taxon_attribute], taxon_attribute.attribute_id in ^attribute_ids)
    |> Repo.all()
    |> Map.new(&{&1.attribute_id, &1})
  end

  defp taxon_attribute_metadata_by_attribute_id(_attribute_ids, _taxon_id), do: %{}

  defp normalize_ids(ids) do
    ids
    |> Enum.filter(&valid_id?/1)
    |> Enum.uniq()
  end

  defp valid_id?(id), do: is_integer(id) and id > 0 and id <= @max_bigint_id

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
         {:ok, value_num} <- to_decimal(value_num),
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
         {:ok, value_num_base} <- to_base(value_num, unit),
         :ok <- validate_numeric_range(value_num_base_min, value_num_base_max) do
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
          to_base(source_decimal, unit)
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

  defp to_decimal(%Decimal{} = value), do: {:ok, DecimalInput.to_decimal(value)}

  defp to_decimal(value) when is_integer(value) or is_float(value) or is_binary(value) do
    case DecimalInput.to_decimal(value) do
      %Decimal{} = decimal -> {:ok, decimal}
      nil -> {:error, :invalid_decimal}
    end
  end

  defp to_decimal(_value), do: {:error, :invalid_decimal_type}

  defp to_base(value, unit) do
    case UnitConversion.to_base(value, unit) do
      %Decimal{} = decimal -> {:ok, decimal}
      nil -> {:error, :invalid_decimal}
    end
  end
end
