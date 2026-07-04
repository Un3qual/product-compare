defmodule ProductCompare.InputTest do
  use ExUnit.Case, async: true

  alias ProductCompare.Input

  @max_signed_bigint 9_223_372_036_854_775_807

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
end
