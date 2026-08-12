defmodule ProductCompareWeb.Seo.SitemapXmlTest do
  use ExUnit.Case, async: true

  alias ProductCompareWeb.Seo.SitemapXml

  @namespace "http://www.sitemaps.org/schemas/sitemap/0.9"

  test "sitemap_index encodes namespaced locations as XML data" do
    locations = [
      "https://example.test/sitemaps/products.xml?region=us&currency=USD",
      "https://example.test/sitemaps/comparisons.xml"
    ]

    assert {:ok, {"sitemapindex", [{"xmlns", @namespace}], sitemap_nodes}} =
             locations
             |> SitemapXml.sitemap_index()
             |> Saxy.SimpleForm.parse_string()

    assert Enum.map(sitemap_nodes, &element_text(&1, "sitemap", "loc")) == locations
  end

  test "url_set encodes locations and ISO-8601 timestamps without manual escaping" do
    location = "https://example.test/products/camera?merchant=A&B"
    entries = [{location, "2026-08-12T20:15:30Z"}]

    assert {:ok, {"urlset", [{"xmlns", @namespace}], [url_node]}} =
             entries
             |> SitemapXml.url_set()
             |> Saxy.SimpleForm.parse_string()

    assert element_text(url_node, "url", "loc") == location
    assert element_text(url_node, "url", "lastmod") == "2026-08-12T20:15:30Z"
  end

  test "url_set emits a valid empty sitemap" do
    assert {:ok, {"urlset", [{"xmlns", @namespace}], []}} =
             []
             |> SitemapXml.url_set()
             |> Saxy.SimpleForm.parse_string()
  end

  defp element_text({parent_name, _attributes, children}, parent_name, child_name) do
    {^child_name, _attributes, [text]} = Enum.find(children, &(elem(&1, 0) == child_name))
    text
  end
end
