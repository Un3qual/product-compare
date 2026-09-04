defmodule ProductCompare.ToolchainContractTest do
  use ExUnit.Case, async: true

  @repo_root Path.expand("../..", __DIR__)
  @removed_metadata ~w(assets/bun.lock assets/bunfig.toml flake.nix flake.lock)
  @active_command_files ~w(
    ARCHITECTURE.md
    README.md
    mix.exs
    assets/package.json
    assets/playwright.config.ts
    assets/scripts/check-client-bundle.ts
  )

  test "mise and pnpm are the only active repository toolchain contracts" do
    assert File.regular?(path(".mise.toml"))
    assert File.regular?(path("assets/pnpm-lock.yaml"))

    Enum.each(@removed_metadata, fn relative_path ->
      refute File.exists?(path(relative_path)),
             "#{relative_path} belongs to the retired Bun/Nix toolchain"
    end)

    Enum.each(@active_command_files, fn relative_path ->
      contents = relative_path |> path() |> File.read!()

      refute Regex.match?(~r/\b(?:bun|bunx|nix)\b/i, contents),
             "#{relative_path} still executes or documents the retired Bun/Nix toolchain"

      refute String.contains?(contents, "import.meta.dir"),
             "#{relative_path} still depends on Bun-specific import.meta.dir"
    end)
  end

  test "frontend metadata agrees with the repository toolchain" do
    package = "assets/package.json" |> path() |> File.read!() |> Jason.decode!()
    mise = ".mise.toml" |> path() |> File.read!()

    assert_frontend_toolchain_matches!(mise, package)
    assert package["scripts"]["check"] =~ "pnpm run lint"
    assert package["scripts"]["check"] =~ "pnpm run format:check"

    for tool <- ~w(erlang elixir) do
      assert Regex.match?(~r/^#{tool}\s*=\s*"[^"]+"$/m, mise),
             ".mise.toml must pin #{tool}"
    end

    refute Regex.match?(~r/^postgres\s*=/m, mise),
           "Docker Compose owns the PostgreSQL runtime; mise install must not require a plugin"

    assert mise =~ "disable_tools = [\"ruby\"]"
  end

  test "setup installs frozen frontend dependencies" do
    aliases = Mix.Project.config() |> Keyword.fetch!(:aliases)

    assert "cmd --cd assets pnpm install --frozen-lockfile" in aliases[:setup]
  end

  test "Phoenix owns the development Framework Mode watcher" do
    config = Config.Reader.read!(path("config/dev.exs"))

    endpoint =
      config |> Keyword.fetch!(:product_compare) |> Keyword.fetch!(ProductCompareWeb.Endpoint)

    assert endpoint[:watchers] == [
             node: [
               "node_modules/@react-router/dev/bin.cjs",
               "dev",
               "--host",
               "127.0.0.1",
               cd: path("assets")
             ]
           ]
  end

  test "README documents one complete development command" do
    readme = "README.md" |> path() |> File.read!()

    assert readme =~ "mix setup"
    assert readme =~ "mix phx.server"
    assert readme =~ "http://localhost:4000"
    assert readme =~ "http://localhost:5173"
    refute readme =~ "pnpm run dev"
  end

  defp assert_frontend_toolchain_matches!(mise, package) do
    mise_node = mise_tool_version!(mise, "node")
    package_node = get_in(package, ["engines", "node"])

    assert mise_node == package_node,
           "Node pin mismatch: .mise.toml node=#{inspect(mise_node)}; " <>
             "package.json engines.node=#{inspect(package_node)}"

    mise_pnpm = mise_tool_version!(mise, "pnpm")
    package_pnpm = get_in(package, ["engines", "pnpm"])

    assert mise_pnpm == package_pnpm,
           "pnpm pin mismatch: .mise.toml pnpm=#{inspect(mise_pnpm)}; " <>
             "package.json engines.pnpm=#{inspect(package_pnpm)}"

    assert package["packageManager"] == "pnpm@#{mise_pnpm}",
           "pnpm packageManager mismatch: .mise.toml pnpm=#{inspect(mise_pnpm)}; " <>
             "package.json packageManager=#{inspect(package["packageManager"])}"
  end

  defp mise_tool_version!(mise, tool) do
    pattern =
      Regex.compile!(
        "^#{Regex.escape(tool)}\\s*=\\s*\"(?<version>[^\"]+)\"\\s*$",
        "m"
      )

    case Regex.named_captures(pattern, mise) do
      %{"version" => version} -> version
      nil -> flunk(".mise.toml must pin #{tool}")
    end
  end

  defp path(relative_path), do: Path.join(@repo_root, relative_path)
end
