defmodule ProductCompare.Repo.Migrations.EnforceSpecDefinitionSemantics do
  use Ecto.Migration

  def up do
    execute("""
    CREATE FUNCTION enforce_unit_semantics()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF NEW.dimension_id IS DISTINCT FROM OLD.dimension_id
         OR NEW.multiplier_to_base IS DISTINCT FROM OLD.multiplier_to_base
         OR NEW.offset_to_base IS DISTINCT FROM OLD.offset_to_base
      THEN
        RAISE EXCEPTION 'unit conversion semantics are immutable'
          USING ERRCODE = '23514',
                CONSTRAINT = 'units_semantics_immutable';
      END IF;

      RETURN NEW;
    END;
    $$
    """)

    execute("""
    CREATE TRIGGER units_enforce_semantics
    BEFORE UPDATE ON units
    FOR EACH ROW
    EXECUTE FUNCTION enforce_unit_semantics()
    """)

    execute("""
    CREATE FUNCTION enforce_attribute_semantics()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF NEW.data_type IS DISTINCT FROM OLD.data_type
         OR NEW.dimension_id IS DISTINCT FROM OLD.dimension_id
         OR NEW.enum_set_id IS DISTINCT FROM OLD.enum_set_id
         OR NEW.is_multivalued IS DISTINCT FROM OLD.is_multivalued
         OR NEW.is_derived IS DISTINCT FROM OLD.is_derived
      THEN
        RAISE EXCEPTION 'attribute value semantics are immutable'
          USING ERRCODE = '23514',
                CONSTRAINT = 'attributes_semantics_immutable';
      END IF;

      RETURN NEW;
    END;
    $$
    """)

    execute("""
    CREATE TRIGGER attributes_enforce_semantics
    BEFORE UPDATE ON attributes
    FOR EACH ROW
    EXECUTE FUNCTION enforce_attribute_semantics()
    """)
  end

  def down do
    execute("DROP TRIGGER IF EXISTS attributes_enforce_semantics ON attributes")
    execute("DROP FUNCTION IF EXISTS enforce_attribute_semantics()")
    execute("DROP TRIGGER IF EXISTS units_enforce_semantics ON units")
    execute("DROP FUNCTION IF EXISTS enforce_unit_semantics()")
  end
end
