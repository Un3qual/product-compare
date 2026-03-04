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
  migration_foreign_key: [type: :bigint]

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
