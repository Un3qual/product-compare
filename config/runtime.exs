import Config

# config/runtime.exs is executed for all environments, including
# during releases. It is executed after compilation and before the
# system starts, so it is typically used to load production configuration
# and secrets from environment variables or elsewhere. Do not define
# any compile-time configuration in here, as it won't be applied.
# The block below contains prod specific runtime configuration.

# ## Using releases
#
# If you use `mix release`, you need to explicitly enable the server
# by passing the PHX_SERVER=true when you start it:
#
#     PHX_SERVER=true bin/product_compare start
#
# Alternatively, you can use `mix phx.gen.release` to generate a `bin/server`
# script that automatically sets the env var above.
if System.get_env("PHX_SERVER") do
  config :product_compare, ProductCompareWeb.Endpoint, server: true
end

phx_host = System.get_env("PHX_HOST")

default_trusted_origins =
  ProductCompareWeb.RuntimeConfig.default_trusted_origins(config_env(), phx_host)

trusted_origins =
  case System.get_env("TRUSTED_FRONTEND_ORIGINS") do
    nil ->
      default_trusted_origins

    value ->
      value
      |> String.split(",", trim: true)
      |> Enum.map(&String.trim/1)
  end

config :product_compare, ProductCompareWeb.Endpoint,
  http: [port: String.to_integer(System.get_env("PORT", "4000"))],
  trusted_origins: trusted_origins

truthy_env? = fn name ->
  name
  |> System.get_env("")
  |> String.trim()
  |> String.downcase()
  |> then(&(&1 in ["1", "true", "yes", "on"]))
end

positive_integer_env = fn name, default ->
  case Integer.parse(System.get_env(name, "")) do
    {value, ""} when value > 0 -> value
    _invalid -> default
  end
end

non_negative_integer_env = fn name, default ->
  case Integer.parse(System.get_env(name, "")) do
    {value, ""} when value >= 0 -> value
    _invalid -> default
  end
end

string_env = fn name, default ->
  name
  |> System.get_env("")
  |> String.trim()
  |> case do
    "" -> default
    value -> value
  end
end

config :product_compare, :cj_feed_discovery_scheduler,
  enabled: truthy_env?.("CJ_FEED_DISCOVERY_SCHEDULE_ENABLED"),
  interval_minutes: positive_integer_env.("CJ_FEED_DISCOVERY_INTERVAL_MINUTES", 1440),
  initial_delay_ms: non_negative_integer_env.("CJ_FEED_DISCOVERY_INITIAL_DELAY_MS", 60_000),
  advertiser_country: string_env.("CJ_FEED_DISCOVERY_ADVERTISER_COUNTRY", "US"),
  limit: positive_integer_env.("CJ_FEED_DISCOVERY_LIMIT", 25),
  pages: positive_integer_env.("CJ_FEED_DISCOVERY_PAGES", 1)

config :product_compare, :cj_product_import_scheduler,
  enabled: truthy_env?.("CJ_PRODUCT_IMPORT_SCHEDULE_ENABLED"),
  complete_scope: truthy_env?.("CJ_PRODUCT_IMPORT_COMPLETE_SCOPE"),
  interval_minutes: positive_integer_env.("CJ_PRODUCT_IMPORT_INTERVAL_MINUTES", 1440),
  initial_delay_ms: non_negative_integer_env.("CJ_PRODUCT_IMPORT_INITIAL_DELAY_MS", 60_000),
  keywords: string_env.("CJ_PRODUCT_IMPORT_KEYWORDS", "shoe"),
  currency: string_env.("CJ_PRODUCT_IMPORT_CURRENCY", "USD"),
  serviceable_areas: string_env.("CJ_PRODUCT_IMPORT_SERVICEABLE_AREAS", "US"),
  limit: positive_integer_env.("CJ_PRODUCT_IMPORT_LIMIT", 25),
  pages: positive_integer_env.("CJ_PRODUCT_IMPORT_PAGES", 1)

if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      For example: ecto://USER:PASS@HOST/DATABASE
      """

  maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

  config :product_compare, ProductCompare.Repo,
    # ssl: true,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    # For machines with several cores, consider starting multiple pools of `pool_size`
    # pool_count: 4,
    socket_options: maybe_ipv6

  # The secret key base is used to sign/encrypt cookies and other secrets.
  # A default value is used in config/dev.exs and config/test.exs but you
  # want to use a different value for prod and you most likely don't want
  # to check this value into version control, so we use an environment
  # variable instead.
  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      You can generate one by calling: mix phx.gen.secret
      """

  host = ProductCompareWeb.RuntimeConfig.endpoint_host(phx_host)

  session_cookie_domain =
    case System.get_env("SESSION_COOKIE_DOMAIN") do
      nil ->
        if String.starts_with?(host, "api.") do
          "." <> String.trim_leading(host, "api.")
        else
          "." <> host
        end

      value ->
        value
    end

  config :product_compare, :dns_cluster_query, System.get_env("DNS_CLUSTER_QUERY")

  config :product_compare, ProductCompareWeb.Endpoint,
    url: [host: host, port: 443, scheme: "https"],
    session_options: [domain: session_cookie_domain, secure: true],
    http: [
      # Enable IPv6 and bind on all interfaces.
      # Set it to  {0, 0, 0, 0, 0, 0, 0, 1} for local network only access.
      # See the documentation on https://hexdocs.pm/bandit/Bandit.html#t:options/0
      # for details about using IPv6 vs IPv4 and loopback vs public addresses.
      ip: {0, 0, 0, 0, 0, 0, 0, 0}
    ],
    secret_key_base: secret_key_base

  # ## SSL Support
  #
  # To get SSL working, you will need to add the `https` key
  # to your endpoint configuration:
  #
  #     config :product_compare, ProductCompareWeb.Endpoint,
  #       https: [
  #         ...,
  #         port: 443,
  #         cipher_suite: :strong,
  #         keyfile: System.get_env("SOME_APP_SSL_KEY_PATH"),
  #         certfile: System.get_env("SOME_APP_SSL_CERT_PATH")
  #       ]
  #
  # The `cipher_suite` is set to `:strong` to support only the
  # latest and more secure SSL ciphers. This means old browsers
  # and clients may not be supported. You can set it to
  # `:compatible` for wider support.
  #
  # `:keyfile` and `:certfile` expect an absolute path to the key
  # and cert in disk or a relative path inside priv, for example
  # "priv/ssl/server.key". For all supported SSL configuration
  # options, see https://hexdocs.pm/plug/Plug.SSL.html#configure/1
  #
  # We also recommend setting `force_ssl` in your config/prod.exs,
  # ensuring no data is ever sent via http, always redirecting to https:
  #
  #     config :product_compare, ProductCompareWeb.Endpoint,
  #       force_ssl: [hsts: true]
  #
  # Check `Plug.SSL` for all available options in `force_ssl`.
end
