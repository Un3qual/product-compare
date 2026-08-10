defmodule ProductCompare.Repo.Migrations.EnforceSpecificationDefinitionCreationValidity do
  use Ecto.Migration

  def up do
    create constraint(:attributes, :attributes_enum_set_consistency,
             check: """
             (data_type = 'enum' AND enum_set_id IS NOT NULL) OR
               (data_type <> 'enum' AND enum_set_id IS NULL)
             """
           )

    create constraint(:units, :units_multiplier_to_base_nonzero,
             check: """
             multiplier_to_base <> 0 AND
               multiplier_to_base NOT IN (
                 'NaN'::numeric,
                 'Infinity'::numeric,
                 '-Infinity'::numeric
               )
             """
           )
  end

  def down do
    drop constraint(:units, :units_multiplier_to_base_nonzero)
    drop constraint(:attributes, :attributes_enum_set_consistency)
  end
end
