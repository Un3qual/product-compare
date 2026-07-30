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

  test "frontend metadata pins pnpm, Node, Rolldown-backed Vite, and Oxc checks" do
    package = "assets/package.json" |> path() |> File.read!() |> Jason.decode!()
    mise = ".mise.toml" |> path() |> File.read!()

    assert package["packageManager"] == "pnpm@11.18.0"
    assert package["engines"] == %{"node" => "24.18.1", "pnpm" => "11.18.0"}
    assert package["devDependencies"]["vite"] == "8.2.0"
    assert package["devDependencies"]["@vitejs/plugin-react"] == "6.0.5"
    assert package["devDependencies"]["@rolldown/plugin-babel"] == "0.2.3"
    assert package["devDependencies"]["@stylexjs/babel-plugin"] == "0.18.1"
    assert package["devDependencies"]["oxlint"] == "1.76.0"
    assert package["devDependencies"]["oxfmt"] == "0.61.0"

    assert package["scripts"]["check"] =~ "pnpm run lint"
    assert package["scripts"]["check"] =~ "pnpm run format:check"

    for tool <- ~w(erlang elixir node pnpm postgres) do
      assert Regex.match?(~r/^#{tool}\s*=\s*"[^"]+"$/m, mise),
             ".mise.toml must pin #{tool}"
    end

    assert mise =~ "disable_tools = [\"ruby\"]"
  end

  defp path(relative_path), do: Path.join(@repo_root, relative_path)
end
