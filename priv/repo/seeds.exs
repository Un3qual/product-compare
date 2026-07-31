alias ProductCompare.DevSeeds.Accounts, as: DevSeedAccounts
alias ProductCompare.DevSeeds.Catalog, as: DevSeedCatalog
alias ProductCompare.DevSeeds.Engagement, as: DevSeedEngagement
alias ProductCompare.DevSeeds.Marketplace, as: DevSeedMarketplace
alias ProductCompare.DevSeeds.Support, as: DevSeedSupport
alias ProductCompare.Repo

Code.require_file("seeds/support.exs", __DIR__)
Code.require_file("seeds/accounts.exs", __DIR__)
Code.require_file("seeds/catalog.exs", __DIR__)
Code.require_file("seeds/marketplace.exs", __DIR__)
Code.require_file("seeds/engagement.exs", __DIR__)

seed_user_password =
  case System.get_env("SEED_USER_PASSWORD") do
    password when is_binary(password) and password != "" ->
      password

    _ ->
      if Code.ensure_loaded?(Mix) and Mix.env() in [:dev, :test] do
        "supersecretpass123"
      else
        raise """
        SEED_USER_PASSWORD must be set when seeding outside development and test environments.
        """
      end
  end

seed_anchor = DateTime.utc_now() |> DateTime.truncate(:microsecond)
already_in_transaction? = Repo.in_transaction?()

seed_result =
  Repo.transaction(fn ->
    unless already_in_transaction? do
      Repo.query!("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ")
    end

    accounts = DevSeedAccounts.seed!(seed_user_password, seed_anchor)
    catalog = DevSeedCatalog.seed!(accounts, seed_anchor)
    marketplace = DevSeedMarketplace.seed!(catalog, seed_anchor)
    engagement = DevSeedEngagement.seed!(accounts, catalog, marketplace, seed_anchor)

    %{
      accounts: accounts,
      catalog: catalog,
      marketplace: marketplace,
      engagement: engagement,
      anchor: seed_anchor
    }
  end)
  |> DevSeedSupport.expect!("transaction")

IO.puts(
  "Seed completed: #{map_size(seed_result.catalog.products)} products, " <>
    "#{map_size(seed_result.marketplace.offers)} offer scenarios, and local account tokens."
)
