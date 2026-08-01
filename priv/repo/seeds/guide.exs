defmodule ProductCompare.DevSeeds.Guide do
  @moduledoc false

  @spec print(map()) :: :ok
  def print(seed) do
    accounts = seed.accounts
    catalog = seed.catalog
    marketplace = seed.marketplace
    engagement = seed.engagement

    IO.puts("""

    Development testing guide
    =========================

    Accounts
    --------
    Password: #{seed.password} (SEED_USER_PASSWORD or the development default)
    admin@example.com       operator; affiliate, CJ, correction, and revenue workflows
    moderator@example.com   operator; claims and community moderation
    shopper@example.com     saved comparisons, alerts, reviews, corrections, and commerce
    participant@example.com answers, reviews, and reports
    unverified@example.com  unconfirmed account for verification flow
    reset@example.com       confirmed account for password-reset flow

    Login: /auth/login
    Verify email: /auth/verify-email?token=#{accounts.confirmation_token}
    Reset password: /auth/reset-password?token=#{accounts.reset_token}
    Development API token: #{accounts.active_plain_text_token}

    Shopper routes
    --------------
    Catalog: /products
    Product: /products/#{catalog.products.monitor_16_9.slug}
    Category: /categories/#{catalog.taxons.monitor.seo_slug}
    Offers: /offers
    Merchant: /merchants/#{marketplace.merchants.example_mart.slug}
    Compare: /compare
    Saved comparisons: /compare/saved
    Shared comparison: /compare/shared/#{engagement.snapshot.public_token}
    Alerts: /account/alerts
    API tokens: /account/api-tokens

    Operator routes
    ---------------
    Affiliate setup: /affiliate/setup
    CJ programs: /ingestion/cj-programs
    Revenue preview: /commerce/revenue

    Synthetic data
    --------------
    CJ programs, feeds, import runs, clicks, conversions, commissions, and purchase-price facts
    are synthetic local examples. Seeding does not contact CJ or another external provider.
    """)

    :ok
  end
end
