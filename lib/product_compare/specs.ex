defmodule ProductCompare.Specs do
  @moduledoc """
  Specs context for dimensions, units, attributes, and claim workflows.
  """

  alias ProductCompare.Ingestion.SpecificationObservation
  alias ProductCompare.Specs.Claims
  alias ProductCompare.Specs.Corrections
  alias ProductCompare.Specs.Definitions
  alias ProductCompare.Specs.Reads
  alias ProductCompareSchemas.Specs.Attribute
  alias ProductCompareSchemas.Specs.Dimension
  alias ProductCompareSchemas.Specs.EnumOption
  alias ProductCompareSchemas.Specs.EnumSet
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.SourceArtifact
  alias ProductCompareSchemas.Specs.SpecificationCorrection
  alias ProductCompareSchemas.Specs.TaxonAttribute
  alias ProductCompareSchemas.Specs.Unit

  @max_bigint_id 9_223_372_036_854_775_807
  defguardp valid_id_guard(id) when is_integer(id) and id > 0 and id <= @max_bigint_id

  @spec upsert_dimension(map()) :: {:ok, Dimension.t()} | {:error, Ecto.Changeset.t()}
  def upsert_dimension(attrs), do: Definitions.upsert_dimension(attrs)

  @spec upsert_unit(map()) :: {:ok, Unit.t()} | {:error, Ecto.Changeset.t()}
  def upsert_unit(attrs), do: Definitions.upsert_unit(attrs)

  @spec upsert_enum_set(map()) :: {:ok, EnumSet.t()} | {:error, Ecto.Changeset.t()}
  def upsert_enum_set(attrs), do: Definitions.upsert_enum_set(attrs)

  @spec upsert_enum_option(map()) :: {:ok, EnumOption.t()} | {:error, Ecto.Changeset.t()}
  def upsert_enum_option(attrs), do: Definitions.upsert_enum_option(attrs)

  @spec upsert_attribute(map()) :: {:ok, Attribute.t()} | {:error, Ecto.Changeset.t()}
  def upsert_attribute(attrs), do: Definitions.upsert_attribute(attrs)

  @spec convert_to_base(Decimal.t() | number() | binary(), term()) ::
          {:ok, Decimal.t()} | {:error, :unit_not_found | :invalid_decimal}
  def convert_to_base(value_num, unit_id) when valid_id_guard(unit_id) do
    Definitions.convert_to_base(value_num, unit_id)
  end

  def convert_to_base(_value_num, _unit_id), do: {:error, :unit_not_found}

  @spec get_source_artifact(term()) :: SourceArtifact.t() | nil
  def get_source_artifact(id) when valid_id_guard(id) do
    Reads.get_source_artifact(id)
  end

  def get_source_artifact(_id), do: nil

  @spec get_source_artifacts([term()]) :: %{optional(pos_integer()) => SourceArtifact.t() | nil}
  def get_source_artifacts(ids) do
    Reads.get_source_artifacts(ids)
  end

  @spec propose_claim(pos_integer(), pos_integer(), map(), map()) ::
          {:ok, ProductAttributeClaim.t()} | {:error, term()}
  def propose_claim(product_id, attribute_id, typed_value, provenance) do
    Claims.propose_claim(product_id, attribute_id, typed_value, provenance)
  end

  @spec propose_correction(pos_integer(), pos_integer(), pos_integer(), map(), map()) ::
          {:ok, SpecificationCorrection.t()} | {:error, term()}
  def propose_correction(product_id, attribute_id, user_id, typed_value, attrs)
      when valid_id_guard(product_id) and valid_id_guard(attribute_id) and
             valid_id_guard(user_id) and is_map(attrs) do
    Corrections.propose_correction(product_id, attribute_id, user_id, typed_value, attrs)
  end

  def propose_correction(_product_id, _attribute_id, _user_id, _typed_value, _attrs),
    do: {:error, :invalid_id}

  @spec list_user_corrections_query(pos_integer(), keyword()) :: Ecto.Query.t()
  def list_user_corrections_query(user_id, opts \\ []) do
    Corrections.list_user_corrections_query(user_id, opts)
  end

  @spec list_correction_moderation_query(keyword()) :: Ecto.Query.t()
  def list_correction_moderation_query(opts \\ []) do
    Corrections.list_correction_moderation_query(opts)
  end

  @spec correction_counts_for_product(pos_integer()) ::
          %{optional(pos_integer()) => %{pending: non_neg_integer(), accepted: non_neg_integer()}}
  def correction_counts_for_product(product_id) when valid_id_guard(product_id) do
    Corrections.correction_counts_for_product(product_id)
  end

  def correction_counts_for_product(_product_id), do: %{}

  @spec correction_counts([SpecificationCorrection.t()]) ::
          %{optional(pos_integer()) => %{pending: non_neg_integer(), accepted: non_neg_integer()}}
  def correction_counts(corrections) when is_list(corrections) do
    Corrections.correction_counts(corrections)
  end

  def correction_counts(_corrections), do: %{}

  @spec moderate_correction(pos_integer(), pos_integer(), :accepted | :rejected, map()) ::
          {:ok, SpecificationCorrection.t()} | {:error, term()}
  def moderate_correction(correction_id, moderator_id, decision, attrs)
      when valid_id_guard(correction_id) and valid_id_guard(moderator_id) and
             decision in [:accepted, :rejected] and is_map(attrs) do
    Corrections.moderate_correction(correction_id, moderator_id, decision, attrs)
  end

  def moderate_correction(_correction_id, _moderator_id, _decision, _attrs),
    do: {:error, :invalid_argument}

  @spec import_observation(
          pos_integer(),
          pos_integer(),
          String.t(),
          SpecificationObservation.t()
        ) ::
          {:ok, %{claim: ProductAttributeClaim.t(), accepted: boolean(), replayed: boolean()}}
          | {:error, term()}
  def import_observation(
        product_id,
        artifact_id,
        provider,
        %SpecificationObservation{} = observation
      ) do
    Claims.import_observation(product_id, artifact_id, provider, observation)
  end

  @spec accept_claim(pos_integer(), pos_integer()) ::
          {:ok, ProductAttributeClaim.t()} | {:error, term()}
  def accept_claim(claim_id, moderator_user_id) do
    Claims.accept_claim(claim_id, moderator_user_id)
  end

  @spec reject_claim(pos_integer(), pos_integer()) ::
          {:ok, ProductAttributeClaim.t()} | {:error, term()}
  def reject_claim(claim_id, moderator_user_id) do
    Claims.reject_claim(claim_id, moderator_user_id)
  end

  @spec select_current_claim(pos_integer(), pos_integer(), pos_integer(), pos_integer() | nil) ::
          {:ok, ProductAttributeCurrent.t()} | {:error, term()}
  def select_current_claim(product_id, attribute_id, claim_id, selector_user_id) do
    Claims.select_current_claim(product_id, attribute_id, claim_id, selector_user_id)
  end

  @spec list_current_attributes_for_products([pos_integer()]) :: %{
          optional(pos_integer()) => [map()]
        }
  def list_current_attributes_for_products(product_ids) do
    Reads.list_current_attributes_for_products(product_ids)
  end

  @spec home_specification_highlights([term()], keyword()) :: %{
          optional(pos_integer()) => [map()]
        }
  def home_specification_highlights(product_ids, opts \\ []) do
    limit =
      case Keyword.get(opts, :limit, 3) do
        value when is_integer(value) and value > 0 -> min(value, 3)
        _ -> 3
      end

    Reads.list_current_attributes_for_products(product_ids, limit: limit)
  end

  @spec list_current_attributes_for_product(term()) :: [map()]
  def list_current_attributes_for_product(product_id) when valid_id_guard(product_id) do
    Reads.list_current_attributes_for_product(product_id)
  end

  def list_current_attributes_for_product(_product_id), do: []

  @spec with_current_attribute_metadata([ProductAttributeCurrent.t()], pos_integer() | nil) :: [
          map()
        ]
  def with_current_attribute_metadata(current_attributes, taxon_id) do
    Reads.with_current_attribute_metadata(current_attributes, taxon_id)
  end

  @spec list_filterable_attributes([atom()]) :: [Attribute.t()]
  def list_filterable_attributes(data_types) do
    Reads.list_filterable_attributes(data_types)
  end

  @spec filterable_attribute_types(term()) :: %{pos_integer() => atom()}
  def filterable_attribute_types(attribute_ids) when is_list(attribute_ids) do
    Reads.filterable_attribute_types(attribute_ids)
  end

  def filterable_attribute_types(_attribute_ids), do: %{}

  @spec get_filterable_attribute(term(), term()) :: Attribute.t() | nil
  def get_filterable_attribute(attribute_id, data_type)
      when valid_id_guard(attribute_id) and is_atom(data_type) do
    Reads.get_filterable_attribute(attribute_id, data_type)
  end

  def get_filterable_attribute(_attribute_id, _data_type), do: nil

  @spec filterable_enum_option_pairs(term(), term()) :: MapSet.t()
  def filterable_enum_option_pairs(attribute_ids, enum_option_ids)
      when is_list(attribute_ids) and is_list(enum_option_ids) do
    Reads.filterable_enum_option_pairs(attribute_ids, enum_option_ids)
  end

  def filterable_enum_option_pairs(_attribute_ids, _enum_option_ids) do
    Reads.filterable_enum_option_pairs([], [])
  end

  @spec enum_option_belongs_to_attribute?(term(), term()) :: boolean()
  def enum_option_belongs_to_attribute?(attribute_id, enum_option_id)
      when valid_id_guard(attribute_id) and valid_id_guard(enum_option_id) do
    Reads.enum_option_belongs_to_attribute?(attribute_id, enum_option_id)
  end

  def enum_option_belongs_to_attribute?(_attribute_id, _enum_option_id), do: false

  @spec list_enum_options_for_set(term()) :: [EnumOption.t()]
  def list_enum_options_for_set(enum_set_id) when valid_id_guard(enum_set_id) do
    Reads.list_enum_options_for_set(enum_set_id)
  end

  def list_enum_options_for_set(_enum_set_id), do: []

  @spec list_enum_options_for_sets(term()) :: %{pos_integer() => [EnumOption.t()]}
  def list_enum_options_for_sets(enum_set_ids) when is_list(enum_set_ids) do
    Reads.list_enum_options_for_sets(enum_set_ids)
  end

  def list_enum_options_for_sets(_enum_set_ids), do: %{}

  @spec unit_symbol_for_dimension(term()) :: String.t() | nil
  def unit_symbol_for_dimension(nil), do: nil

  def unit_symbol_for_dimension(dimension_id) when valid_id_guard(dimension_id) do
    Reads.unit_symbol_for_dimension(dimension_id)
  end

  def unit_symbol_for_dimension(_dimension_id), do: nil

  @spec unit_symbols_for_dimensions(term()) :: %{pos_integer() => String.t()}
  def unit_symbols_for_dimensions(dimension_ids) when is_list(dimension_ids) do
    Reads.unit_symbols_for_dimensions(dimension_ids)
  end

  def unit_symbols_for_dimensions(_dimension_ids), do: %{}

  @spec with_current_attribute_metadata_from_taxon_attributes(
          [ProductAttributeCurrent.t()],
          [TaxonAttribute.t()] | nil
        ) :: [map()]
  def with_current_attribute_metadata_from_taxon_attributes(current_attributes, taxon_attributes) do
    Reads.with_current_attribute_metadata_from_taxon_attributes(
      current_attributes,
      taxon_attributes
    )
  end
end
