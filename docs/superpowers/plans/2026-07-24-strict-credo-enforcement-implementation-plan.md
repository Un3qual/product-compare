# Strict Credo Enforcement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the repository Credo gate enforce its current strict readability
checks with purposeful test-support documentation.

**Architecture:** Replace the two generated narrator module docs with concise
why-oriented contracts, then enable strict mode in the existing Credo
configuration so the normal quality alias enforces the same check.

**Tech Stack:** Elixir, Credo.

## Global Constraints

- Do not change ConnCase or DataCase runtime behavior or imported helpers.
- Keep the existing Credo check set and ExSlop integration.

---

## Task 1: Purposeful Test-Support Documentation

**Files:**

- Modify: `test/support/conn_case.ex`
- Modify: `test/support/data_case.ex`

**Interfaces:**

- Produces: module docs that explain the repository-specific sandbox and
  authenticated-connection contracts without narrating module names.

- [ ] Run `mix credo --all --strict`; verify exactly the two narrator-doc
  findings fail.
- [ ] Replace both module docs with concise repository-specific contracts.
- [ ] Re-run `mix credo --all --strict`; expect zero findings.
- [ ] Commit with message `docs: clarify test support contracts`.

## Task 2: Strict Gate

**Files:**

- Modify: `.credo.exs`
- Modify: `docs/work/strict-credo-enforcement.md`

**Interfaces:**

- Produces: `strict: true` in the existing default Credo configuration.

- [ ] Set the default Credo configuration to `strict: true`.
- [ ] Run `mix credo --all`, `mix quality`, `mix ci`, and `git diff --check`.
- [ ] Record exact evidence in the lane doc.
- [ ] Commit with message `chore: enforce strict credo`.
