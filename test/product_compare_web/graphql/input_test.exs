defmodule ProductCompareWeb.GraphQL.InputTest do
  use ExUnit.Case, async: true

  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.GraphQL.Input

  describe "fetch_value/3" do
    test "reads atom keys before string keys" do
      input = %{"product_id" => "string-id", product_id: "atom-id"}

      assert Input.fetch_value(input, :product_id) == "atom-id"
    end

    test "reads string keys and defaults missing keys" do
      input = %{"product_id" => "string-id"}

      assert Input.fetch_value(input, :product_id) == "string-id"
      assert Input.fetch_value(input, :missing, "fallback") == "fallback"
    end
  end

  describe "fetch_list_value/2" do
    test "reads present list values and converts nil to an empty list" do
      assert Input.fetch_list_value(%{product_ids: ["one"]}, :product_ids) == ["one"]
      assert Input.fetch_list_value(%{product_ids: nil}, :product_ids) == []
      assert Input.fetch_list_value(%{}, :product_ids) == []
    end
  end

  describe "drop_key/2" do
    test "removes atom and string forms of an input key" do
      input = %{
        :status => :active,
        "status" => :all,
        :first => 10,
        "after" => "cursor"
      }

      assert Input.drop_key(input, :status) == %{:first => 10, "after" => "cursor"}
    end
  end

  describe "take_present/2" do
    test "extracts requested non-nil input values into atom-key attrs" do
      input = %{
        "label" => "CLI",
        :expires_at => nil,
        "expires_at" => ~U[2026-01-01 00:00:00Z],
        "ignored" => "ignored"
      }

      assert Input.take_present(input, [:label, :expires_at]) == %{label: "CLI"}
    end
  end

  describe "take/2" do
    test "extracts requested input values including explicit nils into atom-key attrs" do
      input = %{
        "label" => "CLI",
        :expires_at => nil,
        "ignored" => "ignored"
      }

      assert Input.take(input, [:label, :expires_at, :missing]) == %{
               label: "CLI",
               expires_at: nil
             }
    end
  end

  describe "put_present/3" do
    test "puts non-nil values and skips nil values" do
      input = %{existing: true}

      assert Input.put_present(input, :new_value, "value") == %{
               existing: true,
               new_value: "value"
             }

      assert Input.put_present(input, :new_value, nil) == %{existing: true}
    end
  end

  describe "connection_args/1" do
    test "extracts pagination args through shared atom and string lookup semantics" do
      input = %{
        "first" => 25,
        :after => "cursor-1",
        "ignored" => "ignored"
      }

      assert Input.connection_args(input) == %{first: 25, after: "cursor-1"}
    end
  end

  describe "decode_required_integer_id/3" do
    test "decodes an integer-backed Relay ID for the expected type" do
      id = GlobalId.encode(:product, 123)

      assert Input.decode_required_integer_id(id, :product, "product") == {:ok, 123}
    end

    test "returns field-specific errors for wrong type and non-string IDs" do
      assert Input.decode_required_integer_id(GlobalId.encode(:brand, 123), :product, "product") ==
               {:error, "invalid product id"}

      assert Input.decode_required_integer_id(123, :product, "product") ==
               {:error, "invalid product id"}
    end
  end

  describe "decode_optional_integer_id/3" do
    test "allows nil and decodes present integer-backed Relay IDs" do
      id = GlobalId.encode(:merchant, 456)

      assert Input.decode_optional_integer_id(nil, :merchant, "merchant") == {:ok, nil}
      assert Input.decode_optional_integer_id(id, :merchant, "merchant") == {:ok, 456}
    end
  end

  describe "decode_optional_integer_id_field/4" do
    test "decodes present integer-backed Relay ID fields into the target map" do
      id = GlobalId.encode(:affiliate_network, 123)

      assert Input.decode_optional_integer_id_field(
               %{affiliate_network_id: id, status: "active"},
               :affiliate_network_id,
               :affiliate_network,
               "affiliate network"
             ) == {:ok, %{affiliate_network_id: 123, status: "active"}}
    end

    test "decodes string-key Relay ID fields into normalized atom-key attrs" do
      id = GlobalId.encode(:affiliate_network, 123)

      assert Input.decode_optional_integer_id_field(
               %{"affiliate_network_id" => id, status: "active"},
               :affiliate_network_id,
               :affiliate_network,
               "affiliate network"
             ) == {:ok, %{affiliate_network_id: 123, status: "active"}}
    end

    test "preserves missing and nil optional ID fields" do
      assert Input.decode_optional_integer_id_field(
               %{status: "active"},
               :affiliate_network_id,
               :affiliate_network,
               "affiliate network"
             ) == {:ok, %{status: "active"}}

      assert Input.decode_optional_integer_id_field(
               %{affiliate_network_id: nil},
               :affiliate_network_id,
               :affiliate_network,
               "affiliate network"
             ) == {:ok, %{affiliate_network_id: nil}}
    end

    test "returns field-specific errors for invalid optional ID fields" do
      assert Input.decode_optional_integer_id_field(
               %{affiliate_network_id: 123},
               :affiliate_network_id,
               :affiliate_network,
               "affiliate network"
             ) == {:error, "invalid affiliate network id"}

      assert Input.decode_optional_integer_id_field(
               %{affiliate_network_id: GlobalId.encode(:merchant, 123)},
               :affiliate_network_id,
               :affiliate_network,
               "affiliate network"
             ) == {:error, "invalid affiliate network id"}
    end
  end

  describe "decode_integer_id_list/4" do
    test "decodes integer-backed Relay ID lists in input order" do
      first_id = GlobalId.encode(:product, 123)
      second_id = GlobalId.encode(:product, 456)

      assert Input.decode_integer_id_list([first_id, second_id], :product, "product") ==
               {:ok, [123, 456]}
    end

    test "allows nil lists and returns custom errors for non-list values" do
      assert Input.decode_integer_id_list(nil, :product, "product") == {:ok, []}

      assert Input.decode_integer_id_list("not-a-list", :product, "product", "invalid filter ids") ==
               {:error, "invalid filter ids"}
    end
  end

  describe "decode_required_uuid_id/3" do
    test "decodes UUID-backed Relay IDs and rejects wrong types" do
      entropy_id = Ecto.UUID.generate()

      assert Input.decode_required_uuid_id(
               GlobalId.encode(:saved_comparison_set, entropy_id),
               :saved_comparison_set,
               "saved comparison set"
             ) == {:ok, entropy_id}

      assert Input.decode_required_uuid_id(
               GlobalId.encode(:api_token, entropy_id),
               :saved_comparison_set,
               "saved comparison set"
             ) == {:error, "invalid saved comparison set id"}
    end
  end

  describe "normalize_decimal_value/1" do
    test "preserves nil, Decimal, integer, and float values" do
      decimal = Decimal.new("12.34")

      assert Input.normalize_decimal_value(nil) == {:ok, nil}
      assert Input.normalize_decimal_value(decimal) == {:ok, decimal}
      assert Input.normalize_decimal_value(12) == {:ok, 12}
      assert Input.normalize_decimal_value(12.5) == {:ok, 12.5}
    end

    test "parses decimal strings and rejects invalid numeric values" do
      assert Input.normalize_decimal_value("12.34") == {:ok, Decimal.new("12.34")}
      assert Input.normalize_decimal_value("12.34abc") == {:error, "invalid numeric value"}
      assert Input.normalize_decimal_value(%{value: "12.34"}) == {:error, "invalid numeric value"}
    end
  end

  describe "normalize_boolean_value/1" do
    test "preserves boolean values and normalizes non-boolean values to false" do
      assert Input.normalize_boolean_value(true) == {:ok, true}
      assert Input.normalize_boolean_value(false) == {:ok, false}
      assert Input.normalize_boolean_value(nil) == {:ok, false}
      assert Input.normalize_boolean_value("true") == {:ok, false}
    end
  end
end
