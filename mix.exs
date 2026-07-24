defmodule ProductCompare.MixProject do
  use Mix.Project

  def project do
    [
      app: :product_compare,
      version: "0.1.0",
      elixir: "~> 1.19",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps(),
      test_coverage: [summary: [threshold: 69]],
      dialyzer: [plt_add_apps: [:mix, :ex_unit]],
      listeners: [Phoenix.CodeReloader]
    ]
  end

  # Configuration for the OTP application.
  #
  # Type `mix help compile.app` for more information.
  def application do
    [
      mod: {ProductCompare.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  def cli do
    [
      preferred_envs: [
        ci: :test,
        dialyzer: :test,
        precommit: :test,
        quality: :test,
        typecheck: :test
      ]
    ]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [
      {:phoenix, "~> 1.8.3"},
      {:phoenix_ecto, "~> 4.5"},
      {:ecto_sql, "~> 3.13"},
      {:postgrex, ">= 0.0.0"},
      {:telemetry_metrics, "~> 1.0"},
      {:telemetry_poller, "~> 1.0"},
      {:gettext, "~> 1.0"},
      {:jason, "~> 1.2"},
      {:dns_cluster, "~> 0.2.0"},
      {:bandit, "~> 1.5"},
      {:argon2_elixir, "~> 4.0"},
      {:absinthe, "~> 1.7"},
      {:absinthe_plug, "~> 1.5"},
      {:dataloader, "~> 2.0"},
      {:oban, "~> 2.23"},
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false},
      {:dialyxir, "~> 1.4", only: [:dev, :test], runtime: false},
      {:ex_dna, "~> 1.5", only: [:dev, :test], runtime: false},
      {:ex_slop, "~> 0.4.2", only: [:dev, :test], runtime: false},
      {:reach, "~> 2.7", only: [:dev, :test], runtime: false}
    ]
  end

  # Aliases are shortcuts or tasks specific to the current project.
  # For example, to install project dependencies and perform other setup tasks, run:
  #
  #     $ mix setup
  #
  # See the documentation for `Mix` for more info on aliases.
  defp aliases do
    ecto_setup = ["ecto.create", "ecto.migrate"] ++ seed_tasks()

    [
      setup: ["deps.get"] ++ ecto_setup,
      "ecto.setup": ecto_setup,
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      test: ["ecto.create --quiet", "ecto.migrate --quiet", "test"],
      typecheck: ["compile --warnings-as-errors --all-warnings"],
      quality: [
        "credo --all",
        "ex_dna --max-clones 3",
        "reach.check --smells --strict --baseline .reach-baseline.json",
        "dialyzer"
      ],
      frontend_check: ["cmd --cd assets bun run check"],
      ci: [
        "work_queue.validate",
        "format --check-formatted",
        "typecheck",
        "quality",
        "test --cover",
        "frontend_check"
      ],
      precommit: [
        "work_queue.validate",
        "format",
        "typecheck",
        "quality",
        "test --cover",
        "frontend_check"
      ],
      deps_prune: ["deps.unlock --unused"]
    ]
  end

  defp seed_tasks do
    if Mix.env() == :test do
      []
    else
      ["run priv/repo/seeds.exs"]
    end
  end
end
