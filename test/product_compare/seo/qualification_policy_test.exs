defmodule ProductCompare.Seo.QualificationPolicyTest do
  use ExUnit.Case, async: true

  alias ProductCompare.Seo.QualificationPolicy

  test "publishes the shared qualification thresholds" do
    assert QualificationPolicy.minimum_description_length() == 80
    assert QualificationPolicy.minimum_specification_count() == 2
    assert QualificationPolicy.minimum_category_products() == 3
  end

  test "measures adequate text after trimming at the shared boundary" do
    refute QualificationPolicy.adequate_text?(" " <> String.duplicate("x", 79) <> " ")
    assert QualificationPolicy.adequate_text?(" " <> String.duplicate("x", 80) <> " ")
    refute QualificationPolicy.adequate_text?(nil)
  end
end
