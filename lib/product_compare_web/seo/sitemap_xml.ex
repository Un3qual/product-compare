defmodule ProductCompareWeb.Seo.SitemapXml do
  @moduledoc false

  import Saxy.XML, only: [characters: 1, element: 3]

  @namespace "http://www.sitemaps.org/schemas/sitemap/0.9"
  @prolog [version: "1.0", encoding: "UTF-8"]

  def sitemap_index(locations) do
    locations
    |> Enum.map(&element("sitemap", [], element("loc", [], characters(&1))))
    |> then(&element("sitemapindex", [xmlns: @namespace], &1))
    |> Saxy.encode!(@prolog)
  end

  def url_set(entries) do
    entries
    |> Enum.map(fn {location, last_modified} ->
      element("url", [], [
        element("loc", [], characters(location)),
        element("lastmod", [], characters(last_modified))
      ])
    end)
    |> then(&element("urlset", [xmlns: @namespace], &1))
    |> Saxy.encode!(@prolog)
  end
end
