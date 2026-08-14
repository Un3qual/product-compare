defmodule ProductCompare.DevSeeds.Guide do
  @moduledoc false

  @spec print(map()) :: :ok
  def print(seed) do
    accounts = seed.accounts
    catalog = seed.catalog
    marketplace = seed.marketplace
    engagement = seed.engagement
    operations = seed.operations

    IO.puts("""

    Development testing guide
    =========================

    Density: #{seed.profile.density}

    Inventory
    ---------
    Products: #{length(catalog.all_products)}
    Merchants: #{length(marketplace.all_merchants)}
    Offers: #{length(marketplace.all_offers)}
    Price observations: #{length(marketplace.all_price_points)}
    Saved comparisons: #{length(engagement.all_saved_sets)}
    Watches / alerts: #{length(engagement.all_watches)} / #{length(engagement.all_alerts)}
    Reviews / questions / corrections: #{length(engagement.all_reviews)} / #{length(engagement.all_questions)} / #{length(engagement.all_corrections)}
    CJ feeds / import runs: #{length(operations.all_cj_feeds)} / #{length(operations.all_import_runs)}
    Clicks / conversions / purchase facts: #{length(operations.all_clicks)} / #{length(operations.all_conversions)} / #{length(operations.all_purchase_facts)}

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
    Product (price history + community): /products/#{catalog.products.monitor_16_9.slug}
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
    CAD revenue filter: /commerce/revenue?currency=CAD

    Synthetic data
    --------------
    CJ programs, feeds, import runs, clicks, conversions, commissions, and purchase-price facts
    are synthetic local examples. Seeding does not contact CJ or another external provider.
    """)

    :ok
  end
end
