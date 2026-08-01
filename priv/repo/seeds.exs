unless Code.ensure_loaded?(Mix) and Mix.env() in [:dev, :test] do
  raise "Development feature seeds may run in development and test environments only."
end

alias ProductCompare.DevSeeds.Accounts, as: DevSeedAccounts
alias ProductCompare.DevSeeds.Catalog, as: DevSeedCatalog
alias ProductCompare.DevSeeds.CorrectionSafety, as: DevSeedCorrectionSafety
alias ProductCompare.DevSeeds.Engagement, as: DevSeedEngagement
alias ProductCompare.DevSeeds.Guide, as: DevSeedGuide
alias ProductCompare.DevSeeds.Marketplace, as: DevSeedMarketplace
alias ProductCompare.DevSeeds.Operations, as: DevSeedOperations
alias ProductCompare.DevSeeds.Support, as: DevSeedSupport

Code.require_file("seeds/support.exs", __DIR__)
Code.require_file("seeds/accounts.exs", __DIR__)
Code.require_file("seeds/correction_safety.exs", __DIR__)
Code.require_file("seeds/catalog.exs", __DIR__)
Code.require_file("seeds/marketplace.exs", __DIR__)
Code.require_file("seeds/community_writes.exs", __DIR__)
Code.require_file("seeds/engagement.exs", __DIR__)
Code.require_file("seeds/operations.exs", __DIR__)
Code.require_file("seeds/guide.exs", __DIR__)

seed_user_password =
  case System.get_env("SEED_USER_PASSWORD") do
    password when is_binary(password) ->
      if String.trim(password) == "", do: "supersecretpass123", else: password

    _ ->
      "supersecretpass123"
  end

seed_anchor = DateTime.utc_now() |> DateTime.truncate(:microsecond)

seed_result =
  DevSeedSupport.serializable_transaction(fn ->
    DevSeedCorrectionSafety.lock_correction_submissions!()

    accounts = DevSeedAccounts.seed!(seed_user_password, seed_anchor)
    catalog = DevSeedCatalog.seed!(accounts, seed_anchor)
    marketplace = DevSeedMarketplace.seed!(catalog, seed_anchor)
    engagement = DevSeedEngagement.seed!(accounts, catalog, marketplace, seed_anchor)
    operations = DevSeedOperations.seed!(accounts, catalog, marketplace, seed_anchor)

    %{
      accounts: accounts,
      catalog: catalog,
      marketplace: marketplace,
      engagement: engagement,
      operations: operations,
      anchor: seed_anchor
    }
  end)
  |> DevSeedSupport.expect!("transaction")

seed_result
|> Map.put(:password, seed_user_password)
|> DevSeedGuide.print()
