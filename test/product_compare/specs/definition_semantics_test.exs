defmodule ProductCompare.Specs.DefinitionSemanticsTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompareSchemas.Specs.Attribute
  alias ProductCompareSchemas.Specs.Unit

  test "unit conversion semantics cannot be changed by an upsert" do
    suffix = System.unique_integer([:positive])

    {:ok, dimension} =
      Specs.upsert_dimension(%{code: "immutable-unit-dimension-#{suffix}"})

    attrs = %{
      dimension_id: dimension.id,
      code: "immutable-unit-#{suffix}",
      symbol: "u",
      multiplier_to_base: Decimal.new("2"),
      offset_to_base: Decimal.new("3")
    }

    assert {:ok, unit} = Specs.upsert_unit(attrs)

    assert {:error, changeset} =
             Specs.upsert_unit(%{
               attrs
               | symbol: "updated",
                 multiplier_to_base: Decimal.new("4"),
                 offset_to_base: Decimal.new("5")
             })

    assert {"does not match the existing unit", _metadata} =
             changeset.errors[:multiplier_to_base]

    assert {"does not match the existing unit", _metadata} =
             changeset.errors[:offset_to_base]

    persisted = Repo.get!(Unit, unit.id)
    assert persisted.symbol == "u"
    assert Decimal.equal?(persisted.multiplier_to_base, Decimal.new("2"))
    assert Decimal.equal?(persisted.offset_to_base, Decimal.new("3"))

    assert {:error, direct_changeset} =
             persisted
             |> Unit.changeset(%{multiplier_to_base: Decimal.new("6")})
             |> Repo.update()

    assert {"unit conversion semantics are immutable", _metadata} =
             direct_changeset.errors[:base]
  end

  test "attribute value semantics cannot be changed by an upsert" do
    suffix = System.unique_integer([:positive])

    assert {:ok, attribute} =
             Specs.upsert_attribute(%{
               code: "immutable-attribute-#{suffix}",
               display_name: "Original",
               data_type: :bool,
               is_multivalued: false,
               is_derived: false
             })

    assert {:error, changeset} =
             Specs.upsert_attribute(%{
               code: attribute.code,
               display_name: "Changed",
               data_type: :text,
               is_multivalued: true,
               is_derived: true
             })

    assert {"does not match the existing attribute", _metadata} =
             changeset.errors[:data_type]

    assert {"does not match the existing attribute", _metadata} =
             changeset.errors[:is_multivalued]

    assert {"does not match the existing attribute", _metadata} =
             changeset.errors[:is_derived]

    persisted = Repo.get!(Attribute, attribute.id)
    assert persisted.display_name == "Original"
    assert persisted.data_type == :bool
    refute persisted.is_multivalued
    refute persisted.is_derived

    assert {:error, direct_changeset} =
             persisted
             |> Attribute.changeset(%{data_type: :text})
             |> Repo.update()

    assert {"attribute value semantics are immutable", _metadata} =
             direct_changeset.errors[:base]
  end

  test "definition presentation metadata remains editable" do
    suffix = System.unique_integer([:positive])

    {:ok, dimension} =
      Specs.upsert_dimension(%{code: "presentation-unit-dimension-#{suffix}"})

    unit_attrs = %{
      dimension_id: dimension.id,
      code: "presentation-unit-#{suffix}",
      symbol: "before",
      multiplier_to_base: Decimal.new("10"),
      offset_to_base: Decimal.new("1")
    }

    assert {:ok, unit} = Specs.upsert_unit(unit_attrs)
    assert {:ok, updated_unit} = Specs.upsert_unit(%{unit_attrs | symbol: "after"})
    assert updated_unit.id == unit.id
    assert updated_unit.symbol == "after"

    attribute_attrs = %{
      code: "presentation-attribute-#{suffix}",
      display_name: "Before",
      data_type: :bool,
      description: "Before description"
    }

    assert {:ok, attribute} = Specs.upsert_attribute(attribute_attrs)

    assert {:ok, updated_attribute} =
             Specs.upsert_attribute(%{
               attribute_attrs
               | display_name: "After",
                 description: "After description"
             })

    assert updated_attribute.id == attribute.id
    assert updated_attribute.display_name == "After"
    assert updated_attribute.description == "After description"
  end
end
