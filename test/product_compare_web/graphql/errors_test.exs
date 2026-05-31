defmodule ProductCompareWeb.GraphQL.ErrorsTest do
  use ExUnit.Case, async: true

  alias ProductCompareWeb.GraphQL.Errors

  describe "unauthenticated_mutation_error/0" do
    test "returns the typed mutation error shape" do
      assert Errors.unauthenticated_mutation_error() == %{
               code: "UNAUTHENTICATED",
               message: "unauthorized",
               field: nil
             }
    end
  end

  describe "mutation_error/3" do
    test "returns a typed mutation error with normalized field names" do
      assert Errors.mutation_error("INVALID_ARGUMENT", "is invalid", :email) == %{
               code: "INVALID_ARGUMENT",
               message: "is invalid",
               field: "email"
             }
    end
  end

  describe "camelized_mutation_error/3" do
    test "returns a typed mutation error with camelCase GraphQL field names" do
      assert Errors.camelized_mutation_error(
               "INVALID_ARGUMENT",
               "is invalid",
               :affiliate_network_id
             ) == %{
               code: "INVALID_ARGUMENT",
               message: "is invalid",
               field: "affiliateNetworkId"
             }

      assert Errors.camelized_mutation_error("INVALID_ARGUMENT", "is invalid", "homepage_url") ==
               %{
                 code: "INVALID_ARGUMENT",
                 message: "is invalid",
                 field: "homepageUrl"
               }
    end

    test "preserves nil field names" do
      assert Errors.camelized_mutation_error("INVALID_ARGUMENT", "is invalid") == %{
               code: "INVALID_ARGUMENT",
               message: "is invalid",
               field: nil
             }
    end
  end

  describe "changeset_mutation_errors/1" do
    test "returns interpolated invalid argument errors from a changeset" do
      changeset =
        {%{}, %{name: :string}}
        |> Ecto.Changeset.cast(%{}, [:name])
        |> Ecto.Changeset.add_error(:name, "must be at least %{count} chars", count: 3)

      assert Errors.changeset_mutation_errors(changeset) == [
               %{
                 code: "INVALID_ARGUMENT",
                 message: "must be at least 3 chars",
                 field: "name"
               }
             ]
    end
  end

  describe "changeset_first_error/1" do
    test "returns the first normalized field and interpolated message from a changeset" do
      changeset =
        {%{}, %{name: :string, description: :string}}
        |> Ecto.Changeset.cast(%{}, [:name, :description])
        |> Ecto.Changeset.add_error(:description, "is invalid")
        |> Ecto.Changeset.add_error(:name, "must be at least %{count} chars", count: 3)

      assert Errors.changeset_first_error(changeset) == {"name", "must be at least 3 chars"}
    end

    test "falls back for changesets without errors" do
      changeset =
        {%{}, %{name: :string}}
        |> Ecto.Changeset.cast(%{}, [:name])

      assert Errors.changeset_first_error(changeset) == {nil, "invalid payload"}
      assert Errors.changeset_first_message(changeset) == "invalid payload"
    end
  end

  describe "changeset_first_message/1" do
    test "returns only the first changeset error message" do
      changeset =
        {%{}, %{label: :string}}
        |> Ecto.Changeset.cast(%{}, [:label])
        |> Ecto.Changeset.add_error(:label, "has already been taken")

      assert Errors.changeset_first_message(changeset) == "has already been taken"
    end
  end
end
