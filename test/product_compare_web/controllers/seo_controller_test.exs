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
    index = conn |> recycle() |> get("/sitemap.xml") |> response(200)
    assert index =~ "http://localhost:5173/sitemaps/products.xml"
    assert index =~ "http://localhost:5173/sitemaps/comparisons.xml"

    products = conn |> recycle() |> get("/sitemaps/products.xml") |> response(200)
    assert products =~ "<urlset"
    refute products =~ "/account/"
  end
end
