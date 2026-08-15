unless Code.ensure_loaded?(Mix) and Mix.env() in [:dev, :test] do
  raise "Development feature seeds may run in development and test environments only."
end

Code.require_file("seeds/profile.exs", __DIR__)
Code.require_file("seeds/dictionary.exs", __DIR__)
Code.require_file("seeds/support.exs", __DIR__)
Code.require_file("seeds/accounts.exs", __DIR__)
Code.require_file("seeds/correction_safety.exs", __DIR__)
Code.require_file("seeds/catalog.exs", __DIR__)
Code.require_file("seeds/generated_marketplace.exs", __DIR__)
Code.require_file("seeds/marketplace.exs", __DIR__)
Code.require_file("seeds/community_writes.exs", __DIR__)
Code.require_file("seeds/generated_engagement.exs", __DIR__)
Code.require_file("seeds/engagement.exs", __DIR__)
Code.require_file("seeds/generated_operations.exs", __DIR__)
Code.require_file("seeds/operations.exs", __DIR__)
Code.require_file("seeds/guide.exs", __DIR__)
Code.require_file("seeds/runner.exs", __DIR__)

seed_argv = if Process.whereis(ExUnit.Server), do: [], else: System.argv()
ProductCompare.DevSeeds.run!(seed_argv)
