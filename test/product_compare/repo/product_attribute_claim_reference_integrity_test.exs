defmodule ProductCompare.Repo.ProductAttributeClaimReferenceIntegrityTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.ProductAttributeClaim

  @companions "product_attribute_claims_numeric_companions_check"
  @range "product_attribute_claims_numeric_range_order_check"
  @unit_fk "product_attribute_claims_unit_id_fkey"

  test "numeric claims reject a missing Unit through the named companion constraint" do
    parents = claim_parents()

    assert_check_violation(
      insert_claim(parents, %{value_num: 1, value_num_base: 1}),
      @companions
    )
  end

  test "numeric claims reject a missing base value through the named companion constraint" do
    parents = claim_parents()

    assert_check_violation(
      insert_claim(parents, %{value_num: 1, unit_id: parents.unit.id}),
      @companions
    )
  end

  for field <- [:unit_id, :value_num_base, :value_num_base_min, :value_num_base_max] do
    test "non-numeric claims reject the #{field} numeric companion" do
      parents = claim_parents()
      field = unquote(field)
      value = numeric_companion_value(field, parents.unit.id)

      assert_check_violation(
        insert_claim(parents, Map.merge(%{value_bool: true}, %{field => value})),
        @companions
      )
    end
  end

  test "numeric claims reject an inverted paired range through the named range constraint" do
    parents = claim_parents()

    assert_check_violation(
      insert_claim(parents, %{
        value_num: 1,
        unit_id: parents.unit.id,
        value_num_base: 1,
        value_num_base_min: 2,
        value_num_base_max: 1
      }),
      @range
    )
  end

  test "deleting a referenced Unit is rejected through the named foreign key" do
    parents = claim_parents()

    assert {:ok, _result} =
             insert_claim(parents, %{
               value_num: 1,
               unit_id: parents.unit.id,
               value_num_base: 1
             })

    assert_restrict_violation(
      Repo.query("DELETE FROM units WHERE id = $1", [parents.unit.id]),
      @unit_fk
    )
  end

  test "changesets map an unknown Unit to the owning field" do
    parents = claim_parents()

    changeset =
      ProductAttributeClaim.changeset(%ProductAttributeClaim{}, %{
        product_id: parents.product.id,
        attribute_id: parents.attribute.id,
        source_type: :user,
        status: :proposed,
        value_num: Decimal.new("1"),
        unit_id: -1,
        value_num_base: Decimal.new("1")
      })

    assert {:error, changeset} = Repo.insert(changeset)
    assert "does not exist" in errors_on(changeset).unit_id
  end

  test "storage accepts valid numeric companion and range combinations" do
    parents = claim_parents()

    for numeric_fields <- [
          %{value_num: 1, unit_id: parents.unit.id, value_num_base: 1},
          %{
            value_num: 1,
            unit_id: parents.unit.id,
            value_num_base: 1,
            value_num_base_min: 0
          },
          %{
            value_num: 1,
            unit_id: parents.unit.id,
            value_num_base: 1,
            value_num_base_max: 2
          },
          %{
            value_num: 1,
            unit_id: parents.unit.id,
            value_num_base: 1,
            value_num_base_min: 0,
            value_num_base_max: 2
          }
        ] do
      assert {:ok, _result} = insert_claim(parents, numeric_fields)
    end
  end

  test "storage accepts a non-numeric claim without companions" do
    assert {:ok, _result} = insert_claim(claim_parents(), %{value_text: "valid"})
  end

  test "an unreferenced Unit remains deletable" do
    unit = SpecsFixtures.unit_fixture()
    assert {:ok, %{num_rows: 1}} = Repo.query("DELETE FROM units WHERE id = $1", [unit.id])
  end

  defp claim_parents do
    %{
      product: SpecsFixtures.product_fixture(),
      attribute: SpecsFixtures.attribute_fixture(),
      unit: SpecsFixtures.unit_fixture()
    }
  end

  defp insert_claim(parents, attrs) do
    Repo.query(
      """
      INSERT INTO product_attribute_claims (
        product_id,
        attribute_id,
        source_type,
        status,
        value_bool,
        value_num,
        unit_id,
        value_num_base,
        value_num_base_min,
        value_num_base_max,
        value_text,
        inserted_at
      )
      VALUES ($1, $2, 'user', 'proposed', $3, $4, $5, $6, $7, $8, $9, now())
      """,
      [
        parents.product.id,
        parents.attribute.id,
        Map.get(attrs, :value_bool),
        Map.get(attrs, :value_num),
        Map.get(attrs, :unit_id),
        Map.get(attrs, :value_num_base),
        Map.get(attrs, :value_num_base_min),
        Map.get(attrs, :value_num_base_max),
        Map.get(attrs, :value_text)
      ]
    )
  end

  defp numeric_companion_value(:unit_id, unit_id), do: unit_id

  defp numeric_companion_value(field, _unit_id)
       when field in [:value_num_base, :value_num_base_min, :value_num_base_max],
       do: Decimal.new("1")

  defp assert_check_violation(result, constraint) do
    assert {:error, %Postgrex.Error{postgres: %{code: :check_violation, constraint: ^constraint}}} =
             result
  end

  defp assert_restrict_violation(result, constraint) do
    assert {:error,
            %Postgrex.Error{postgres: %{code: :restrict_violation, constraint: ^constraint}}} =
             result
  end
end
