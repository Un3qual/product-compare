defmodule ProductCompare.Repo.DomainEnumStorageTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.TestSupport.CategoricalStoragePolicy

  defmodule PersistedEnumFixture do
    use Ecto.Schema

    @primary_key false
    schema "enum_policy_fixtures" do
      field :state, Ecto.Enum, values: [:draft, :published], source: :state_code
      field :temporary_state, Ecto.Enum, values: [:draft, :published], virtual: true
    end
  end

  defmodule EmbeddedEnumFixture do
    use Ecto.Schema

    embedded_schema do
      field :state, Ecto.Enum, values: [:draft, :published]
    end
  end

  test "discovers persisted Ecto enums without a table and column registry" do
    assert [
             %{
               schema: PersistedEnumFixture,
               table: "enum_policy_fixtures",
               field: :state,
               column: "state_code"
             }
           ] =
             CategoricalStoragePolicy.enum_fields_from_modules([
               EmbeddedEnumFixture,
               PersistedEnumFixture
             ])
  end

  test "reports actionable storage violations for non-native enum columns" do
    fields = CategoricalStoragePolicy.enum_fields_from_modules([PersistedEnumFixture])

    assert [
             "Elixir.ProductCompare.Repo.DomainEnumStorageTest.PersistedEnumFixture " <>
               "enum_policy_fixtures.state_code (:state) uses character varying/varchar " <>
               "with PostgreSQL type kind b, expected a native enum"
           ] =
             CategoricalStoragePolicy.enum_storage_violations(fields, %{
               {"enum_policy_fixtures", "state_code"} => %{
                 data_type: "character varying",
                 udt_name: "varchar",
                 type_kind: "b"
               }
             })
  end

  test "detects equivalent text-backed closed sets without flagging free-form checks" do
    assert [
             "enum_policy_fixtures.state_code uses text-backed closed-domain " <>
               "constraint enum_policy_fixtures_state_check",
             "enum_policy_fixtures.visibility uses text-backed closed-domain " <>
               "constraint enum_policy_fixtures_visibility_check"
           ] =
             CategoricalStoragePolicy.closed_domain_constraint_violations([
               %{
                 table: "enum_policy_fixtures",
                 column: "state_code",
                 constraint: "enum_policy_fixtures_state_check",
                 definition:
                   "CHECK ((state_code = ANY (ARRAY['draft'::text, 'published'::text])))"
               },
               %{
                 table: "enum_policy_fixtures",
                 column: "visibility",
                 constraint: "enum_policy_fixtures_visibility_check",
                 definition:
                   "CHECK (((visibility = 'private'::text) OR " <>
                     "(visibility = 'public'::text)))"
               },
               %{
                 table: "enum_policy_fixtures",
                 column: "description",
                 constraint: "enum_policy_fixtures_description_check",
                 definition: "CHECK ((char_length(description) > 0))"
               }
             ])
  end

  test "all compiled persisted Ecto enums use native PostgreSQL enum columns" do
    assert {:ok, fields} = CategoricalStoragePolicy.validate(Repo)
    assert fields != []
    assert fields == Enum.sort_by(fields, &{&1.table, &1.column, &1.schema})
  end
end
