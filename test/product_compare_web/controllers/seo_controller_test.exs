defmodule ProductCompareWeb.SeoControllerTest do
  use ProductCompareWeb.ConnCase, async: true

  test "robots identifies the sitemap and excludes private application surfaces", %{conn: conn} do
    conn = get(conn, "/robots.txt")

    assert response(conn, 200) =~ "Sitemap: http://localhost:5173/sitemap.xml"
    assert response(conn, 200) =~ "Disallow: /account/"

    assert get_resp_header(conn, "cache-control") == [
             "public, max-age=300, stale-while-revalidate=600"
           ]
  end

  test "sitemap index is partitioned and empty partitions remain valid XML", %{conn: conn} do
    index_conn = conn |> recycle() |> get("/sitemap.xml")
    index = response(index_conn, 200)

    assert get_resp_header(index_conn, "content-type") == ["application/xml; charset=utf-8"]

    assert get_resp_header(index_conn, "cache-control") == [
             "public, max-age=300, stale-while-revalidate=600"
           ]

    assert {:ok, {"sitemapindex", [{"xmlns", sitemap_namespace}], sitemap_nodes}} =
             Saxy.SimpleForm.parse_string(index)

    assert sitemap_namespace == "http://www.sitemaps.org/schemas/sitemap/0.9"

    locations = Enum.map(sitemap_nodes, &element_text(&1, "sitemap", "loc"))

    assert "http://localhost:5173/sitemaps/products.xml" in locations
    assert "http://localhost:5173/sitemaps/comparisons.xml" in locations

    products_conn = conn |> recycle() |> get("/sitemaps/products.xml")
    products = response(products_conn, 200)

    assert {:ok, {"urlset", [{"xmlns", ^sitemap_namespace}], []}} =
             Saxy.SimpleForm.parse_string(products)

    refute products =~ "/account/"
  end

  defp element_text({parent_name, _attributes, children}, parent_name, child_name) do
    {^child_name, _attributes, [text]} = Enum.find(children, &(elem(&1, 0) == child_name))
    text
  end
end
