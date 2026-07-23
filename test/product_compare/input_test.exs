defmodule ProductCompare.InputTest do
  use ExUnit.Case, async: true

  alias ProductCompare.Input

  @max_signed_bigint 9_223_372_036_854_775_807

  describe "fetch_attr/2" do
    test "returns values from atom or string attribute keys" do
      assert Input.fetch_attr(%{name: "atom-keyed"}, :name) == "atom-keyed"
      assert Input.fetch_attr(%{"name" => "string-keyed"}, :name) == "string-keyed"
    end

    test "prefers atom keys and returns nil for missing or invalid inputs" do
      attrs = %{:name => "atom-keyed", "name" => "string-keyed"}

      assert Input.fetch_attr(attrs, :name) == "atom-keyed"
      assert Input.fetch_attr(%{}, :name) == nil
      assert Input.fetch_attr(nil, :name) == nil
      assert Input.fetch_attr(%{"name" => "string-keyed"}, "name") == nil
    end
  end

  describe "attr_key_present?/2" do
    test "recognizes atom and string attribute keys" do
      assert Input.attr_key_present?(%{name: "atom-keyed"}, :name)
      assert Input.attr_key_present?(%{"name" => "string-keyed"}, :name)
    end

    test "checks key presence rather than truthiness and rejects invalid inputs" do
      assert Input.attr_key_present?(%{name: nil}, :name)
      assert Input.attr_key_present?(%{"name" => nil}, :name)

      refute Input.attr_key_present?(%{}, :name)
      refute Input.attr_key_present?(nil, :name)
      refute Input.attr_key_present?(%{"name" => "string-keyed"}, "name")
    end
  end

  describe "present_upsert_fields/3" do
    test "returns only explicitly supplied atom or string keyed fields with cast values" do
      changeset =
        {%{}, %{campaign_params: :map, is_active: :boolean, network: :string}}
        |> Ecto.Changeset.cast(
          %{
            "campaign_params" => %{"source" => "review"},
            "is_active" => false,
            "network" => "impact"
          },
          [:campaign_params, :is_active, :network]
        )

      assert Input.present_upsert_fields(
               %{"campaign_params" => %{"source" => "review"}, is_active: false},
               changeset,
               [:network, :campaign_params, :is_active]
             ) == [campaign_params: %{"source" => "review"}, is_active: false]
    end
  end

  describe "pagination_value/3" do
    test "reads integer and string values from keyword options" do
      assert Input.pagination_value([limit: 25], :limit, 10) == 25
      assert Input.pagination_value([limit: "30"], :limit, 10) == 30
    end

    test "reads integer and string values from atom or string map keys" do
      assert Input.pagination_value(%{limit: 25}, :limit, 10) == 25
      assert Input.pagination_value(%{"limit" => "30"}, :limit, 10) == 30
    end

    test "returns the default for missing, invalid, or non-option inputs" do
      assert Input.pagination_value([], :limit, 10) == 10
      assert Input.pagination_value(%{}, :limit, 10) == 10
      assert Input.pagination_value(%{limit: "30px"}, :limit, 10) == 10
      assert Input.pagination_value(nil, :limit, 10) == 10
      assert Input.pagination_value(%{"limit" => "30"}, "limit", 10) == 10
    end

    test "returns parsed boundary values before clamping" do
      assert Input.pagination_value(%{offset: 0}, :offset, 10) == 0
      assert Input.pagination_value(%{"offset" => "-1"}, :offset, 10) == -1
    end
  end

  describe "clamp_limit/3" do
    test "keeps positive limits up to the maximum" do
      assert Input.clamp_limit(1, 20, 50) == 1
      assert Input.clamp_limit(50, 20, 50) == 50
    end

    test "clamps positive limits above the maximum" do
      assert Input.clamp_limit(51, 20, 50) == 50
    end

    test "returns the default for non-positive or invalid limits" do
      assert Input.clamp_limit(0, 20, 50) == 20
      assert Input.clamp_limit(-1, 20, 50) == 20
      assert Input.clamp_limit("25", 20, 50) == 20
      assert Input.clamp_limit(nil, 20, 50) == 20
    end
  end

  describe "clamp_non_negative/2" do
    test "keeps zero and positive integer values" do
      assert Input.clamp_non_negative(0, 10) == 0
      assert Input.clamp_non_negative(25, 10) == 25
    end

    test "returns the default for negative or invalid values" do
      assert Input.clamp_non_negative(-1, 10) == 10
      assert Input.clamp_non_negative("25", 10) == 10
      assert Input.clamp_non_negative(nil, 10) == 10
    end
  end

  describe "normalize_integer_id/1" do
    test "accepts positive integers in the signed bigint range" do
      assert Input.normalize_integer_id(1) == {:ok, 1}
      assert Input.normalize_integer_id(@max_signed_bigint) == {:ok, @max_signed_bigint}
    end

    test "rejects integer ids outside the positive signed bigint range" do
      assert Input.normalize_integer_id(0) == :error
      assert Input.normalize_integer_id(-1) == :error
      assert Input.normalize_integer_id(@max_signed_bigint + 1) == :error
    end

    test "accepts parsed binary ids in the positive signed bigint range" do
      assert Input.normalize_integer_id("1") == {:ok, 1}

      assert Input.normalize_integer_id(to_string(@max_signed_bigint)) ==
               {:ok, @max_signed_bigint}
    end

    test "rejects parsed binary ids outside the positive signed bigint range" do
      assert Input.normalize_integer_id("0") == :error
      assert Input.normalize_integer_id("-1") == :error
      assert Input.normalize_integer_id(to_string(@max_signed_bigint + 1)) == :error
    end

    test "keeps invalid binary strings as errors" do
      assert Input.normalize_integer_id("not-an-id") == :error
      assert Input.normalize_integer_id("1.0") == :error
      assert Input.normalize_integer_id("1abc") == :error
    end
  end

  describe "uuid_lookup_results/2" do
    test "deduplicates valid lookups and projects missing or invalid requested ids to nil" do
      first_id = Ecto.UUID.generate()
      second_id = Ecto.UUID.generate()

      results =
        Input.uuid_lookup_results(
          [first_id, first_id, "not-a-uuid", second_id],
          fn validated_ids ->
            send(self(), {:validated_ids, validated_ids})
            [%{entropy_id: first_id, value: :first}]
          end
        )

      assert_receive {:validated_ids, validated_ids}
      assert Enum.sort(validated_ids) == Enum.sort([first_id, second_id])

      assert results == %{
               first_id => %{entropy_id: first_id, value: :first},
               second_id => nil,
               "not-a-uuid" => nil
             }
    end

    test "does not invoke the loader when no valid UUID was requested" do
      assert Input.uuid_lookup_results(["not-a-uuid"], fn _validated_ids ->
               flunk("loader must not run without a valid UUID")
             end) == %{"not-a-uuid" => nil}

      assert Input.uuid_lookup_results([], fn _validated_ids ->
               flunk("loader must not run for an empty request")
             end) == %{}
    end
  end
end
