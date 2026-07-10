# Continuously Replenished Ready Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce an uncapped implementation-ready queue with a minimum floor of three rows, seed the current empty queue with validated product work, and make queue drain detectable by repository verification.

**Architecture:** Keep `docs/work/index.md` as the only dispatcher and `docs/plans/INDEX.md` as a coordinator-only catalog. Add a pure Elixir validator plus a Mix task that parses the `Ready Work` section, requires at least three complete row contracts, and rejects empty-state language; then align the repository guidance and seed four source-backed frontend plans whose gaps were verified in current route code. Four is the smallest initial slate that can dispatch one row while preserving three ready successors.

**Tech Stack:** Elixir 1.19, Mix tasks, ExUnit, Markdown workflow documents, React/TypeScript plan contracts, Bun/Vitest/Relay verification commands.

## Global Constraints

- The live queue has at least three `ready` implementation rows at every stable dispatch boundary.
- Three is the replenishment floor, not a target size or maximum.
- A coordinator promotes every useful, currently validated candidate whose prerequisites and ownership boundaries make it executable. There is no fixed upper limit.
- `ready` rows must name lane, next action, owned paths, prerequisites, verification, and exit condition.
- Deferred, rejected, blocked, dependent, speculative, stale, and unverified work does not count toward the ready-work floor.
- Do not turn `docs/plans/INDEX.md` into a second dispatch queue.
- Browser auth remains GraphQL-only over `/api/graphql`; this workflow batch does not add REST auth endpoints.
- This workflow implementation does not implement the seeded product rows; it makes them ready for subsequent workers.

---

### Task 1: Add a queue-contract validator with fixture-driven tests

**Files:**
- Create: `lib/product_compare/work_queue/validator.ex`
- Create: `lib/mix/tasks/work_queue.validate.ex`
- Create: `test/product_compare/work_queue/validator_test.exs`

**Interfaces:**
- Consumes: a Markdown string or path containing one `## Ready Work` section and `###` row headings.
- Produces: `ProductCompare.WorkQueue.Validator.validate/1`, returning `{:ok, %{ready_count: pos_integer()}}` or `{:error, [String.t()]}`; `validate_file/1` reads a path and delegates to `validate/1`; `mix work_queue.validate [path]` raises on invalid queue state.

- [ ] **Step 1: Write failing validator tests**

Create `test/product_compare/work_queue/validator_test.exs` with this fixture-focused coverage:

```elixir
defmodule ProductCompare.WorkQueue.ValidatorTest do
  use ExUnit.Case, async: true

  alias ProductCompare.WorkQueue.Validator

  test "accepts three or more complete ready implementation rows" do
    assert {:ok, %{ready_count: 4}} = Validator.validate(queue_with_rows(4))
  end

  test "rejects fewer than three ready rows" do
    assert {:error, errors} = Validator.validate(queue_with_rows(2))
    assert "Ready Work requires at least 3 complete rows; found 2" in errors
  end

  test "rejects incomplete dispatch contracts" do
    markdown =
      queue_with_rows(3)
      |> String.replace("Prerequisites:\n- None.\n", "", global: false)

    assert {:error, errors} = Validator.validate(markdown)
    assert Enum.any?(errors, &String.contains?(&1, "missing Prerequisites:"))
  end

  test "rejects empty-queue shortage language" do
    markdown = """
    # Work Dispatch Index

    ## Ready Work

    None. The plan catalog contains no additional validated candidate.

    ## Active Work
    """

    assert {:error, errors} = Validator.validate(markdown)
    assert Enum.any?(errors, &String.contains?(&1, "empty-state language"))
  end

  defp queue_with_rows(count) do
    rows =
      1..count
      |> Enum.map_join("\n", fn index ->
        """
        ### #{index}. Candidate #{index}

        Status: ready
        Lane: Lane #{index}
        Plan: `docs/plans/candidate-#{index}.md`
        Next action: Implement candidate #{index}.
        Owned paths:
        - `path/#{index}`
        Prerequisites:
        - None.
        Verification:
        - `mix test`
        Exit condition: Candidate #{index} passes verification.
        """
      end)

    """
    # Work Dispatch Index

    ## Ready Work

    #{rows}
    ## Active Work
    """
  end
end
```

- [ ] **Step 2: Run the test to verify it fails before implementation**

Run: `mix test test/product_compare/work_queue/validator_test.exs`

Expected: FAIL because `ProductCompare.WorkQueue.Validator` is undefined.

- [ ] **Step 3: Implement the pure validator**

Create `lib/product_compare/work_queue/validator.ex`:

```elixir
defmodule ProductCompare.WorkQueue.Validator do
  @moduledoc false

  @minimum_ready_rows 3
  @required_markers [
    "Status:",
    "Lane:",
    "Plan:",
    "Next action:",
    "Owned paths:",
    "Prerequisites:",
    "Verification:",
    "Exit condition:"
  ]
  @empty_state_patterns [
    ~r/^None\./m,
    ~r/no (?:additional )?validated candidate/i,
    ~r/no ready (?:row|rows|work)/i,
    ~r/shortage of validated candidates/i
  ]

  @spec validate_file(Path.t()) ::
          {:ok, %{ready_count: pos_integer()}} | {:error, [String.t()]}
  def validate_file(path) do
    path
    |> File.read!()
    |> validate()
  end

  @spec validate(String.t()) ::
          {:ok, %{ready_count: pos_integer()}} | {:error, [String.t()]}
  def validate(markdown) when is_binary(markdown) do
    with {:ok, ready_section} <- ready_section(markdown) do
      rows = ready_rows(ready_section)

      errors =
        ready_count_errors(rows) ++
          incomplete_row_errors(rows) ++
          empty_state_errors(ready_section)

      case errors do
        [] -> {:ok, %{ready_count: length(rows)}}
        _ -> {:error, errors}
      end
    end
  end

  defp ready_section(markdown) do
    case Regex.run(~r/^## Ready Work\s*\n(?<body>.*?)(?=^## |\z)/ms, markdown,
           capture: :all_names
         ) do
      [body] -> {:ok, body}
      _ -> {:error, ["missing ## Ready Work section"]}
    end
  end

  defp ready_rows(section) do
    ~r/^### .+?\n(?<body>.*?)(?=^### |\z)/ms
    |> Regex.scan(section, capture: :all_names)
    |> List.flatten()
  end

  defp ready_count_errors(rows) when length(rows) >= @minimum_ready_rows, do: []

  defp ready_count_errors(rows) do
    ["Ready Work requires at least #{@minimum_ready_rows} complete rows; found #{length(rows)}"]
  end

  defp incomplete_row_errors(rows) do
    rows
    |> Enum.with_index(1)
    |> Enum.flat_map(fn {row, index} ->
      marker_errors =
        for marker <- @required_markers,
            not String.contains?(row, marker),
            do: "ready row #{index} is missing #{marker}"

      status_errors =
        if Regex.match?(~r/^Status: ready\s*$/m, row),
          do: [],
          else: ["ready row #{index} must contain `Status: ready`"]

      marker_errors ++ status_errors
    end)
  end

  defp empty_state_errors(section) do
    if Enum.any?(@empty_state_patterns, &Regex.match?(&1, section)) do
      ["Ready Work contains forbidden empty-state language"]
    else
      []
    end
  end
end
```

- [ ] **Step 4: Add the Mix task wrapper**

Create `lib/mix/tasks/work_queue.validate.ex`:

```elixir
defmodule Mix.Tasks.WorkQueue.Validate do
  use Mix.Task

  alias ProductCompare.WorkQueue.Validator

  @shortdoc "Validate the live ready-work queue contract"
  @default_path "docs/work/index.md"

  @impl Mix.Task
  def run(args) do
    path = queue_path!(args)

    case Validator.validate_file(path) do
      {:ok, %{ready_count: ready_count}} ->
        Mix.shell().info("work queue valid: #{ready_count} ready rows")

      {:error, errors} ->
        Mix.raise(Enum.join(errors, "\n"))
    end
  end

  defp queue_path!([]), do: @default_path
  defp queue_path!([path]), do: path
  defp queue_path!(_args), do: Mix.raise("usage: mix work_queue.validate [path]")
end
```

- [ ] **Step 5: Run fixture verification**

Run: `mix test test/product_compare/work_queue/validator_test.exs`

Expected: 4 tests, 0 failures.

Run: `mix work_queue.validate`

Expected: FAIL with `Ready Work requires at least 3 complete rows; found 0`, proving the current empty queue is reproduced.

- [ ] **Step 6: Commit the validator milestone**

```bash
git add lib/product_compare/work_queue/validator.ex lib/mix/tasks/work_queue.validate.ex test/product_compare/work_queue/validator_test.exs
git commit -m "test: enforce ready work queue floor"
```

### Task 2: Replace the optional rolling-slate policy with the uncapped floor

**Files:**
- Modify: `AGENTS.md:11-22`
- Modify: `docs/work/operating-model.md:43-60`
- Modify: `docs/work/operating-model.md:151-162`
- Modify: `docs/plans/NOW.md:15-25`
- Modify: `docs/work/index.md:7-30`
- Modify: `docs/work/index.md:251-272`

**Interfaces:**
- Consumes: the approved design in `docs/superpowers/specs/2026-07-09-rolling-ready-queue-design.md` and `mix work_queue.validate` from Task 1.
- Produces: one consistent dispatch contract in all entry-point docs: minimum three ready implementation rows at stable boundaries, no fixed maximum, pre-claim replenishment, truthful completion, and deeper curation instead of an empty-state exception.

- [ ] **Step 1: Update repository-level dispatch guidance**

Replace the current three-to-five and shortage clauses in `AGENTS.md` with:

```markdown
- Maintain at least three `ready` implementation rows at every stable dispatch
  boundary.
- Three is the replenishment floor, not a target or maximum. Promote every
  useful, currently validated candidate whose ownership and prerequisites make
  it executable.
- Before a claim would leave fewer than three other `ready` rows, the
  coordinator replenishes the queue in the same dispatch update.
- Before removing completed or blocked work, preserve truthful lane evidence
  and ensure the committed queue still contains at least three complete ready
  rows.
- If the candidate catalog cannot restore the floor, the coordinator validates
  new implementation candidates against current product behavior, code, tests,
  architecture gaps, and lane evidence before dispatch continues.
- Never use deferred, rejected, blocked, dependent, speculative, stale, or
  unverified work as queue filler.
```

- [ ] **Step 2: Rewrite the rolling-slate section and promotion rules**

In `docs/work/operating-model.md`, rename `## Rolling Ready Slate` to
`## Continuously Replenished Ready Work` and make it define:

```markdown
- Stable boundary: the committed queue state after a claim, promotion,
  completion, blocking, or reassignment update.
- Floor: at least three complete `ready` implementation rows at every stable
  boundary.
- No ceiling: promote every useful validated candidate found in the same
  curation pass.
- Claim guard: a worker may claim a row only when three other ready rows remain.
- Completion guard: completion remains truthful, while queue-row removal and
  replenishment occur together at the coordinator boundary.
- Exhausted catalog: inspect current product/code/test/architecture gaps, write
  executable plans, and validate them before dispatch resumes.
```

Remove every policy clause that accepts a smaller committed slate because of a
decision, blocker, or candidate shortage. Keep the prohibition on filler and
the ownership-conflict rules.

- [ ] **Step 3: Align the compatibility pointer**

Update `docs/plans/NOW.md` so `What To Do` says:

```markdown
- For execution, open `docs/work/index.md` and claim the highest-ranked
  compatible `ready` row only when three other ready rows will remain.
- When a proposed boundary would leave fewer than three ready rows, use the
  coordinator rules in `docs/work/operating-model.md` to validate and promote
  more implementation work first.
- Three is a floor, not a cap. Keep every additional useful validated row.
- An empty or shortage-only `Ready Work` section is invalid; run
  `mix work_queue.validate` before committing a dispatch update.
```

- [ ] **Step 4: Align live queue rules and prompts**

Update the rules and prompts in `docs/work/index.md` to match the same floor,
claim guard, uncapped promotion behavior, and validator. The coordinator prompt
must end with:

```text
End with at least three complete ready implementation rows and keep every additional useful validated row.
Run mix work_queue.validate before committing the dispatch update.
```

The worker prompt must say:

```text
Claim the highest-ranked compatible ready row only when three other ready rows will remain.
If the claim guard is not satisfied, stop and hand off to the coordinator for replenishment.
```

- [ ] **Step 5: Run policy consistency checks**

Run:

```bash
rg -n 'three to five|more than five|below-target|shortage of validated candidates|no additional validated candidate' AGENTS.md docs/work/index.md docs/work/operating-model.md docs/plans/NOW.md
```

Expected: no matches in the operational policy sections. Historical completion prose in `docs/work/index.md` may still mention prior state until Task 3 replaces that snapshot.

Run: `git diff --check`

Expected: exit 0.

- [ ] **Step 6: Commit the policy milestone**

```bash
git add AGENTS.md docs/work/index.md docs/work/operating-model.md docs/plans/NOW.md
git commit -m "docs: enforce uncapped ready queue floor"
```

### Task 3: Create four validated implementation plans and seed the dispatcher

**Files:**
- Create: `docs/plans/2026-07-10-shopper-home-content-implementation-plan.md`
- Create: `docs/plans/2026-07-10-viewer-aware-navigation-implementation-plan.md`
- Create: `docs/plans/2026-07-10-compare-relative-price-signal-implementation-plan.md`
- Create: `docs/plans/2026-07-10-saved-comparison-product-labels-implementation-plan.md`
- Create: `docs/work/frontend-shopper-home-navigation.md`
- Modify: `docs/work/frontend-product-comparison-demo-parity.md`
- Modify: `docs/work/frontend-saved-comparisons-ui.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `docs/work/index.md`
- Modify: `ARCHITECTURE.md`

**Interfaces:**
- Consumes: verified current gaps in `assets/src/routes/root.tsx`, `assets/src/routes/compare/decision-summary.tsx`, `assets/src/routes/compare/saved-data.ts`, `assets/src/routes/compare/saved.tsx`, and `assets/src/routes/compare/queries/SavedComparisonsRouteQuery.ts`.
- Produces: four priority-ordered `Status: ready` rows with implementation plans, explicit lane ownership, exact prerequisites, verification, and exit conditions; the catalog records them as active plans while the live dispatcher remains authoritative. The two root-route rows share code and test ownership, so they remain ready but execute serially under the active-path conflict rule.

- [ ] **Step 1: Write the shopper-home-content plan and lane contract**

Create `docs/plans/2026-07-10-shopper-home-content-implementation-plan.md`
with one TDD task that:

- Adds failing cases to `assets/test/routes/root.route.test.tsx` proving the home
  page explains the browse, compare, and offer-review journey and no longer
  presents GraphQL/auth implementation status as the product message.
- Updates only the home content in `assets/src/routes/root.tsx`; it leaves the
  existing viewer-based auth links and navigation visibility unchanged.
- Keeps Browse products, Compare products, and Offers as the primary home
  actions and groups secondary destinations after the shopper journey.
- Verifies with
  `cd assets && bun x vitest run test/routes/root.route.test.tsx`,
  `cd assets && bun run typecheck`, and `git diff --check`.
- Uses `docs/work/frontend-shopper-home-navigation.md` as its lane work doc.

Create `docs/work/frontend-shopper-home-navigation.md` with two ready lane-local
batches, the exact owned paths above, and the same verification commands. The
home-content exit condition is: the root page communicates the shopper journey
and prioritizes browse, compare, and offer review without changing route data or
authorization.

- [ ] **Step 2: Write the viewer-aware-navigation plan and lane contract**

Create `docs/plans/2026-07-10-viewer-aware-navigation-implementation-plan.md`
with one TDD task that:

- Adds failing cases to `assets/test/routes/root.route.test.tsx` proving guests
  see Browse products, Merchants, Offers, Compare products, Sign in, and Create
  account, but do not see Saved comparisons, Affiliate setup, Revenue, or API
  tokens in primary navigation or home actions.
- Proves authenticated viewers see the four account-oriented destinations plus
  Sign out and do not see Sign in or Create account.
- Updates `assets/src/routes/root.tsx` to render account-oriented destinations
  only when `viewer` is present without changing direct-route authorization.
- Verifies with
  `cd assets && bun x vitest run test/routes/root.route.test.tsx`,
  `cd assets && bun run typecheck`, and `git diff --check`.
- Uses the second ready batch in
  `docs/work/frontend-shopper-home-navigation.md`; it shares root code/test
  ownership with Step 1 and therefore executes after that active row closes.

- [ ] **Step 3: Write the compare relative-price plan and lane contract**

Create `docs/plans/2026-07-10-compare-relative-price-signal-implementation-plan.md`
with one TDD task that:

- Adds focused cases to `assets/test/routes/compare/compare.route.test.tsx` for
  distinct same-currency prices, tied lowest prices, mixed currencies, missing
  prices, and unavailable offer context.
- Updates `assets/src/routes/compare/decision-summary.tsx` with a `Relative
  loaded price` row derived only from already-loaded `bestCurrentPrice` values.
- Labels a unique minimum `Lowest loaded price`, equal minima `Tied for lowest
  loaded price`, other same-currency cells `Above lowest loaded price`, and
  unsafe comparisons `Not comparable`.
- Performs no floating-point subtraction and makes no claim across currencies or
  fewer than two comparable prices.
- Verifies with
  `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "relative loaded price|lowest loaded price|not comparable"`,
  `cd assets && bun run typecheck`, and `git diff --check`.
- Uses `docs/work/frontend-product-comparison-demo-parity.md` as its lane work
  doc and appends a new ready follow-up without reopening completed batches.

- [ ] **Step 4: Write the saved-product-label plan and lane contract**

Create `docs/plans/2026-07-10-saved-comparison-product-labels-implementation-plan.md`
with one TDD task that:

- Adds focused cases to `assets/test/routes/compare/compare.route.test.tsx`
  proving saved comparison cards render product names in stored position order
  and reopen with the same slug order.
- Extends `SavedComparisonsRouteQuery` to select `product { name slug }`.
- Changes `SavedComparisonSetSummary` in
  `assets/src/routes/compare/saved-data.ts` to store ordered
  `%{name, slug}`-equivalent TypeScript objects rather than display-only slugs,
  while continuing to build reopen links from slugs.
- Updates `assets/src/routes/compare/saved.tsx` to render product names instead
  of raw slug text.
- Regenerates Relay artifacts with `cd assets && bun run relay`.
- Verifies with
  `cd assets && bun run relay`,
  `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "saved comparison.*product|stored position order"`,
  `cd assets && bun run typecheck`, and `git diff --check`.
- Uses `docs/work/frontend-saved-comparisons-ui.md` as its lane work doc and
  appends a new ready follow-up without rewriting completed history.

- [ ] **Step 5: Seed `docs/work/index.md` with the four complete rows**

Replace the empty `Ready Work` content with four priority-ordered `###`
sections using this contract shape:

```markdown
### 1. Shopper-focused home content

Status: ready
Lane: Frontend shopper home
Plan: `docs/plans/2026-07-10-shopper-home-content-implementation-plan.md`
Next action: Replace technical implementation-status copy with a shopper-oriented browse, compare, and offer-review journey using the existing root route.
Owned paths:
- `assets/src/routes/root.tsx`
- `assets/test/routes/root.route.test.tsx`
- `docs/work/frontend-shopper-home-navigation.md`
Prerequisites:
- Existing root viewer preload and current route set remain unchanged.
Verification:
- `cd assets && bun x vitest run test/routes/root.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`
Exit condition: The root page communicates the shopper journey and prioritizes browse, compare, and offer review with green focused tests.
```

Add equivalent complete rows for viewer-aware navigation, relative-price, and
saved-product-label plans, preserving the exact paths, commands, and exit
conditions from Steps 2-4. The two root rows share owned paths and execute
serially. The relative-price row owns only decision-summary, its focused compare
test path, and its lane doc. The saved-label row owns the saved query/data/UI,
generated Relay artifacts, its focused compare test path, and its lane doc.

- [ ] **Step 6: Align catalog and architecture summaries**

In `docs/plans/INDEX.md`:

- Replace `There are no active implementation plans.` with the four new plan
  links.
- Add the four plans to `Active Plan Catalog` as promoted work.
- Keep deferred eBay and ingestion dashboard rows deferred.
- Remove empty-slate and candidate-shortage prose.
- State that the catalog may contain any number of useful validated candidates,
  while only `docs/work/index.md` dispatches them.

In `ARCHITECTURE.md`, replace the stale sentence saying no live implementation
batch is ready with a concise `Next Planned Slice` list naming the four
promoted product-facing batches.

- [ ] **Step 7: Run the real queue validator and documentation checks**

Run: `mix work_queue.validate`

Expected: `work queue valid: 4 ready rows`.

Run:

```bash
rg -n 'None\. The plan catalog contains no additional validated candidate|live queue has no ready rows|empty slate reflects a shortage' docs/work/index.md docs/plans/INDEX.md ARCHITECTURE.md
```

Expected: no matches.

Run: `git diff --check`

Expected: exit 0.

- [ ] **Step 8: Commit the seeded queue milestone**

```bash
git add ARCHITECTURE.md docs/work/index.md docs/plans/INDEX.md docs/plans/2026-07-10-shopper-home-content-implementation-plan.md docs/plans/2026-07-10-viewer-aware-navigation-implementation-plan.md docs/plans/2026-07-10-compare-relative-price-signal-implementation-plan.md docs/plans/2026-07-10-saved-comparison-product-labels-implementation-plan.md docs/work/frontend-shopper-home-navigation.md docs/work/frontend-product-comparison-demo-parity.md docs/work/frontend-saved-comparisons-ui.md
git commit -m "docs: seed continuously replenished product work"
```

### Task 4: Wire the invariant into repository gates and verify the complete workflow

**Files:**
- Modify: `mix.exs:92-106`
- Modify: `docs/superpowers/plans/2026-07-10-continuously-replenished-ready-queue.md`

**Interfaces:**
- Consumes: `mix work_queue.validate` and a seeded `docs/work/index.md` from Tasks 1-3.
- Produces: CI and precommit aliases that reject future stable commits with a drained or incomplete ready queue; checked plan boxes record execution evidence.

- [ ] **Step 1: Add queue validation to repository aliases**

In `mix.exs`, prepend `"work_queue.validate"` to both the `ci` and `precommit`
alias lists so the workflow invariant runs before formatting, type, quality, and
test gates.

The resulting entries begin:

```elixir
ci: ["work_queue.validate", "format --check-formatted", "typecheck", "quality", "test --cover"],
precommit: [
  "work_queue.validate",
  "format",
  "typecheck",
  "quality",
  "test --cover"
]
```

- [ ] **Step 2: Run focused workflow verification**

Run: `mix format --check-formatted mix.exs lib/product_compare/work_queue/validator.ex lib/mix/tasks/work_queue.validate.ex test/product_compare/work_queue/validator_test.exs`

Expected: exit 0.

Run: `mix test test/product_compare/work_queue/validator_test.exs`

Expected: 4 tests, 0 failures.

Run: `mix work_queue.validate`

Expected: `work queue valid: 4 ready rows`.

- [ ] **Step 3: Run stale-policy and diff checks**

Run:

```bash
rg -n 'three to five|more than five|below-target slate|shortage of validated candidates|no additional validated candidate|live queue has no ready rows' AGENTS.md ARCHITECTURE.md docs/work/index.md docs/work/operating-model.md docs/plans/INDEX.md docs/plans/NOW.md
```

Expected: no operational-policy or current-state matches. A historical problem
statement in the approved design spec is allowed because it documents the bug
being replaced.

Run: `git diff --check`

Expected: exit 0.

- [ ] **Step 4: Mark this implementation plan complete and commit**

Change every checkbox in this plan to `[x]`, then run:

```bash
git add mix.exs docs/superpowers/plans/2026-07-10-continuously-replenished-ready-queue.md
git commit -m "build: gate continuously replenished work queue"
```

- [ ] **Step 5: Record final commit evidence**

Run: `git log -5 --oneline`

Expected: the design milestone plus the validator, policy, queue-seeding, and
gate commits are visible in order, with no unrelated files included.
