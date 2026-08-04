# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :product_compare,
  ecto_repos: [ProductCompare.Repo],
  generators: [
    timestamp_type: :utc_datetime_usec,
    binary_id: false
  ]

config :product_compare, ProductCompare.Repo,
  migration_primary_key: [name: :id, type: :bigserial],
  migration_foreign_key: [type: :bigint],
  # PostgreSQL's generic Ecto type renderer uses `size` for `timestamptz(6)`;
  # its `precision` option alone renders the invalid `timestamptz(6, 0)`.
  migration_timestamps: [type: :timestamptz, precision: 6, size: 6],
  types: ProductCompare.PostgrexTypes

config :product_compare, ProductCompare.Catalog.SearchDocuments, rebuild_timeout: :infinity

config :product_compare, ProductCompare.Accounts, api_token_default_ttl_days: 90

config :product_compare, ProductCompare.Discussions,
  community_write_limits: [review: 5, question: 10, answer: 30, report: 30]

config :product_compare, ProductCompare.ReferenceData.Cldr,
  default_locale: "en",
  locales: ["en"]

config :ex_cldr, default_backend: ProductCompare.ReferenceData.Cldr

config :product_compare, :public_site_url, "http://localhost:5173"

config :product_compare, Oban,
  repo: ProductCompare.Repo,
  queues: [ingestion: 2, alerts: 2],
  plugins: [{Oban.Plugins.Pruner, max_age: 86_400}]

# Configure the endpoint
config :product_compare, ProductCompareWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [json: ProductCompareWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: ProductCompare.PubSub,
  live_view: [signing_salt: "pmAcb1Xa"]

# Configure Elixir's Logger
config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"
