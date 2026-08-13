defmodule ProductCompareWeb.SeoController do
  use ProductCompareWeb, :controller

  alias ProductCompare.Seo
  alias ProductCompareWeb.Seo.SitemapXml

  @sitemap_kinds ~w(products merchants categories comparisons)a
  @cache_control "public, max-age=300, stale-while-revalidate=600"

  def robots(conn, _params) do
    body = """
    User-agent: *
    Allow: /
    Disallow: /account/
    Disallow: /affiliate/
    Disallow: /auth/
    Disallow: /commerce/
    Disallow: /ingestion/
    Sitemap: #{public_base_url()}/sitemap.xml
    """

    text_response(conn, body, "text/plain; charset=utf-8")
  end

  def sitemap_index(conn, _params) do
    locations =
      Enum.map(@sitemap_kinds, &"#{public_base_url()}/sitemaps/#{&1}.xml")

    xml_response(conn, SitemapXml.sitemap_index(locations))
  end

  for kind <- @sitemap_kinds do
    def unquote(kind)(conn, _params), do: sitemap(conn, unquote(kind))
  end

  defp sitemap(conn, kind) do
    entries =
      kind
      |> Seo.sitemap_entries()
      |> Enum.map(fn entry ->
        {public_base_url() <> entry.path, iso8601(entry.last_modified)}
      end)

    xml_response(conn, SitemapXml.url_set(entries))
  end

  defp public_base_url do
    :product_compare
    |> Application.get_env(:public_site_url, ProductCompareWeb.Endpoint.url())
    |> String.trim_trailing("/")
  end

  defp xml_response(conn, body), do: text_response(conn, body, "application/xml; charset=utf-8")

  defp text_response(conn, body, content_type) do
    conn
    |> put_resp_header("cache-control", @cache_control)
    |> put_resp_header("content-type", content_type)
    |> send_resp(:ok, body)
  end

  defp iso8601(%DateTime{} = value), do: DateTime.to_iso8601(value)
  defp iso8601(%NaiveDateTime{} = value), do: NaiveDateTime.to_iso8601(value) <> "Z"
end
