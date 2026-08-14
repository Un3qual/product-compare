defmodule ProductCompare.DevSeeds do
  @moduledoc false

  alias ProductCompare.DevSeeds.Accounts
  alias ProductCompare.DevSeeds.Catalog
  alias ProductCompare.DevSeeds.CorrectionSafety
  alias ProductCompare.DevSeeds.Engagement
  alias ProductCompare.DevSeeds.Guide
  alias ProductCompare.DevSeeds.Marketplace
  alias ProductCompare.DevSeeds.Operations
  alias ProductCompare.DevSeeds.Profile
  alias ProductCompare.DevSeeds.Support

  @spec run!([String.t()]) :: map()
  def run!(argv \\ []) when is_list(argv) do
    password = seed_user_password()
    argv = if match?(["--" | _], argv), do: tl(argv), else: argv
    profile = Profile.parse!(argv)
    anchor = DateTime.utc_now() |> Profile.utc_hour()

    seed_result =
      Support.serializable_transaction(fn ->
        CorrectionSafety.lock_correction_submissions!()

        accounts = Accounts.seed!(password, anchor)
        catalog = Catalog.seed!(accounts, anchor, profile)
        marketplace = Marketplace.seed!(catalog, anchor, profile)
        engagement = Engagement.seed!(accounts, catalog, marketplace, anchor, profile)
        operations = Operations.seed!(accounts, catalog, marketplace, anchor, profile)

        %{
          accounts: accounts,
          catalog: catalog,
          marketplace: marketplace,
          engagement: engagement,
          operations: operations,
          anchor: anchor,
          profile: profile
        }
      end)
      |> Support.expect!("transaction")

    seed_result
    |> Map.put(:password, password)
    |> Guide.print()

    seed_result
  end

  defp seed_user_password do
    case System.get_env("SEED_USER_PASSWORD") do
      password when is_binary(password) ->
        if String.trim(password) == "", do: "supersecretpass123", else: password

      _ ->
        "supersecretpass123"
    end
  end
end
