defmodule ProductCompareWeb.SeoController do
  use ProductCompareWeb, :controller

  alias ProductCompare.Seo

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
    body =
      [
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
        "<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">"
      ] ++
        Enum.map(@sitemap_kinds, fn kind ->
          "<sitemap><loc>#{xml_escape("#{public_base_url()}/sitemaps/#{kind}.xml")}</loc></sitemap>"
        end) ++ ["</sitemapindex>"]

    xml_response(conn, Enum.join(body))
  end

  for kind <- @sitemap_kinds do
    def unquote(kind)(conn, _params), do: sitemap(conn, unquote(kind))
  end

  defp sitemap(conn, kind) do
    urls =
      kind
      |> Seo.sitemap_entries()
      |> Enum.map(fn entry ->
        "<url><loc>#{xml_escape(public_base_url() <> entry.path)}</loc><lastmod>#{xml_escape(iso8601(entry.last_modified))}</lastmod></url>"
      end)

    body =
      ([
         "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
         "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">"
       ] ++ urls ++ ["</urlset>"])
      |> Enum.join()

    xml_response(conn, body)
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

  defp xml_escape(value) do
    value
    |> String.replace("&", "&amp;")
    |> String.replace("<", "&lt;")
    |> String.replace(">", "&gt;")
    |> String.replace("\"", "&quot;")
    |> String.replace("'", "&apos;")
  end
end
