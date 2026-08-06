defmodule ProductCompare.Repo.Migrations.EnforceTaxonAttributeStorageBounds do
  use Ecto.Migration

  def up do
    execute("""
    DO $$
    DECLARE
      invalid_ids bigint[];
    BEGIN
      SELECT array_agg(id ORDER BY id)
      INTO invalid_ids
      FROM taxon_attributes
      WHERE sort_order < 0 OR min_rep_to_edit < 0;

      IF invalid_ids IS NOT NULL THEN
        RAISE EXCEPTION 'cannot enforce taxon attribute storage bounds: negative values on rows %',
          invalid_ids;
      END IF;
    END
    $$;
    """)

    create constraint(
             :taxon_attributes,
             :taxon_attributes_sort_order_non_negative,
             check: "sort_order >= 0"
           )

    create constraint(
             :taxon_attributes,
             :taxon_attributes_min_rep_to_edit_non_negative,
             check: "min_rep_to_edit >= 0"
           )
  end

  def down do
    drop constraint(
           :taxon_attributes,
           :taxon_attributes_min_rep_to_edit_non_negative
         )

    drop constraint(:taxon_attributes, :taxon_attributes_sort_order_non_negative)
  end
end
