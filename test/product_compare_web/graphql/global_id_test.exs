defmodule ProductCompareWeb.GraphQL.GlobalIdTest do
  use ExUnit.Case, async: true

  alias ProductCompareWeb.GraphQL.GlobalId

  describe "encode/2" do
    test "encodes integer local IDs without caller-side string conversion" do
      assert GlobalId.encode(:product, 123) == GlobalId.encode(:product, "123")
    end
  end

  describe "encode_required/2" do
    test "wraps integer and binary local IDs for field resolvers" do
      entropy_id = Ecto.UUID.generate()

      assert GlobalId.encode_required(:product, 123) ==
               {:ok, GlobalId.encode(:product, 123)}

      assert GlobalId.encode_required(:api_token, entropy_id) ==
               {:ok, GlobalId.encode(:api_token, entropy_id)}
    end

    test "rejects unsupported local ID values" do
      assert GlobalId.encode_required(:product, nil) == {:error, "invalid id"}
      assert GlobalId.encode_required(:product, %{id: 123}) == {:error, "invalid id"}
    end
  end

  describe "encode_optional/2" do
    test "preserves nil and wraps present local IDs" do
      assert GlobalId.encode_optional(:product, nil) == {:ok, nil}

      assert GlobalId.encode_optional(:product, 123) ==
               {:ok, GlobalId.encode(:product, 123)}
    end
  end

  describe "encode_optional_value/2" do
    test "returns nil or an encoded Relay ID without an Absinthe resolver tuple" do
      entropy_id = Ecto.UUID.generate()

      assert GlobalId.encode_optional_value(:product, nil) == nil
      assert GlobalId.encode_optional_value(:product, 123) == GlobalId.encode(:product, 123)

      assert GlobalId.encode_optional_value(:api_token, entropy_id) ==
               GlobalId.encode(:api_token, entropy_id)
    end
  end

  describe "decode_integer/2" do
    test "decodes positive integer-backed IDs for the expected type" do
      id = GlobalId.encode(:product, "123")

      assert GlobalId.decode_integer(id, :product) == {:ok, 123}
    end

    test "rejects wrong type, non-positive, non-integer, and out-of-range IDs" do
      assert GlobalId.decode_integer(GlobalId.encode(:brand, "123"), :product) == :error
      assert GlobalId.decode_integer(GlobalId.encode(:product, "0"), :product) == :error
      assert GlobalId.decode_integer(GlobalId.encode(:product, "-1"), :product) == :error
      assert GlobalId.decode_integer(GlobalId.encode(:product, "abc"), :product) == :error

      assert GlobalId.decode_integer(GlobalId.encode(:product, "9223372036854775808"), :product) ==
               :error
    end
  end

  describe "decode_uuid/2" do
    test "decodes UUID-backed IDs for the expected type" do
      entropy_id = Ecto.UUID.generate()
      id = GlobalId.encode(:api_token, entropy_id)

      assert GlobalId.decode_uuid(id, :api_token) == {:ok, entropy_id}
    end

    test "rejects wrong type and invalid UUID local IDs" do
      entropy_id = Ecto.UUID.generate()

      assert GlobalId.decode_uuid(GlobalId.encode(:saved_comparison_set, entropy_id), :api_token) ==
               :error

      assert GlobalId.decode_uuid(GlobalId.encode(:api_token, "not-a-uuid"), :api_token) ==
               :error
    end
  end

  describe "decode_typed_local_id/3" do
    test "decodes integer-backed and UUID-backed IDs by allowed type groups" do
      entropy_id = Ecto.UUID.generate()

      assert GlobalId.decode_typed_local_id(
               GlobalId.encode(:product, 123),
               [:product, :brand],
               [:api_token]
             ) == {:ok, {:product, 123}}

      assert GlobalId.decode_typed_local_id(
               GlobalId.encode(:api_token, entropy_id),
               [:product, :brand],
               [:api_token]
             ) == {:ok, {:api_token, entropy_id}}
    end

    test "classifies unsupported types separately from malformed local IDs" do
      assert GlobalId.decode_typed_local_id(
               GlobalId.encode(:source_artifact, 123),
               [:product],
               [:api_token]
             ) == {:error, :unsupported_type}

      assert GlobalId.decode_typed_local_id(
               GlobalId.encode(:product, "not-an-integer"),
               [:product],
               [:api_token]
             ) == {:error, :invalid_id}

      assert GlobalId.decode_typed_local_id(
               GlobalId.encode(:api_token, "not-a-uuid"),
               [:product],
               [:api_token]
             ) == {:error, :invalid_id}

      assert GlobalId.decode_typed_local_id("not-a-global-id", [:product], [:api_token]) ==
               {:error, :invalid_id}
    end
  end
end
