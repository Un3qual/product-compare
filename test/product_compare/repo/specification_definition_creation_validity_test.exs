defmodule ProductCompare.Repo.SpecificationDefinitionCreationValidityTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Repo

  test "attributes reject enum data types without an enum set through the named storage constraint" do
    %{dimension_id: dimension_id} = valid_definition_parents!()

    assert_check_violation(
      insert_attribute(dimension_id, nil, "enum"),
      "attributes_enum_set_consistency"
    )
  end

  test "attributes reject non-enum data types with an enum set through the named storage constraint" do
    %{dimension_id: dimension_id, enum_set_id: enum_set_id} = valid_definition_parents!()

    assert_check_violation(
      insert_attribute(dimension_id, enum_set_id, "text"),
      "attributes_enum_set_consistency"
    )
  end

  test "units reject a zero multiplier through the named storage constraint" do
    %{dimension_id: dimension_id} = valid_definition_parents!()

    assert_check_violation(
      insert_unit(dimension_id, 0),
      "units_multiplier_to_base_nonzero"
    )
  end

  test "specification definitions accept valid enum ownership and nonzero unit multipliers" do
    %{dimension_id: dimension_id, enum_set_id: enum_set_id} = valid_definition_parents!()

    assert {:ok, _result} = insert_attribute(dimension_id, enum_set_id, "enum")
    assert {:ok, _result} = insert_attribute(dimension_id, nil, "text")
    assert {:ok, _result} = insert_unit(dimension_id, 1)
    assert {:ok, _result} = insert_unit(dimension_id, -1)
  end

  defp valid_definition_parents! do
    suffix = System.unique_integer([:positive])

    {:ok, %{rows: [[dimension_id]]}} =
      Repo.query(
        """
        INSERT INTO dimensions (code, inserted_at, updated_at)
        VALUES ($1, now(), now())
        RETURNING id
        """,
        ["definition-validity-dimension-#{suffix}"]
      )

    {:ok, %{rows: [[enum_set_id]]}} =
      Repo.query(
        """
        INSERT INTO enum_sets (code, inserted_at, updated_at)
        VALUES ($1, now(), now())
        RETURNING id
        """,
        ["definition-validity-enum-set-#{suffix}"]
      )

    %{dimension_id: dimension_id, enum_set_id: enum_set_id}
  end

  defp insert_attribute(dimension_id, enum_set_id, data_type) do
    suffix = System.unique_integer([:positive])

    Repo.query(
      """
      INSERT INTO attributes (code, display_name, data_type, dimension_id, enum_set_id, inserted_at)
      VALUES ($1, $2, $3, $4, $5, now())
      """,
      [
        "definition-validity-attribute-#{suffix}",
        "Definition validity attribute #{suffix}",
        data_type,
        dimension_id,
        enum_set_id
      ]
    )
  end

  defp insert_unit(dimension_id, multiplier_to_base) do
    suffix = System.unique_integer([:positive])

    Repo.query(
      """
      INSERT INTO units (
        dimension_id, code, multiplier_to_base, offset_to_base, inserted_at, updated_at
      )
      VALUES ($1, $2, $3, 0, now(), now())
      """,
      [dimension_id, "definition-validity-unit-#{suffix}", multiplier_to_base]
    )
  end

  defp assert_check_violation(result, constraint) do
    assert {:error, %Postgrex.Error{postgres: %{code: :check_violation, constraint: ^constraint}}} =
             result
  end
end
