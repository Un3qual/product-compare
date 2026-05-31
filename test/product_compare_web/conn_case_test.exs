defmodule ProductCompareWeb.ConnCaseTest do
  use ProductCompareWeb.ConnCase, async: true

  alias ProductCompareWeb.GraphQL.GlobalId

  test "relay_id encodes integer-backed GraphQL global IDs through the schema helper" do
    assert relay_id(:product, 123) == GlobalId.encode(:product, "123")
  end

  test "relay_id encodes entropy-backed GraphQL global IDs through the schema helper" do
    entropy_id = Ecto.UUID.generate()

    assert relay_id(:api_token, entropy_id) == GlobalId.encode(:api_token, entropy_id)
  end
end
