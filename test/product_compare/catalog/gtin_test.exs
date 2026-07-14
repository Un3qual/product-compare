defmodule ProductCompare.Catalog.GTINTest do
  use ExUnit.Case, async: true

  alias ProductCompare.Catalog.GTIN

  describe "normalize/1" do
    test "accepts GTIN-8, UPC-A, EAN-13, and GTIN-14 check digits" do
      assert {:ok, "96385074"} = GTIN.normalize("96385074")
      assert {:ok, "036000291452"} = GTIN.normalize("036000291452")
      assert {:ok, "4006381333931"} = GTIN.normalize("4006381333931")
      assert {:ok, "00012345600012"} = GTIN.normalize("00012345600012")
    end

    test "strips common display separators without losing leading zeroes" do
      assert {:ok, "036000291452"} = GTIN.normalize("0 36000-29145 2")
    end

    test "rejects blanks, unsupported lengths, non-display characters, and bad checksums" do
      assert {:error, :invalid_gtin} = GTIN.normalize(nil)
      assert {:error, :invalid_gtin} = GTIN.normalize("")
      assert {:error, :invalid_gtin} = GTIN.normalize("123456")
      assert {:error, :invalid_gtin} = GTIN.normalize("03600029A452")
      assert {:error, :invalid_gtin} = GTIN.normalize("036000291453")
    end
  end
end
