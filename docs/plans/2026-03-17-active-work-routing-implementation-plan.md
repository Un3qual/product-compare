# Active Work Routing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce prompt and context overhead for "implement the next documented feature" by making the next batch of work discoverable from one short, audited source-of-truth file.

**Architecture:** Add a lightweight `docs/NEXT.md` queue for active work, point repo guidance at it, and demote older plans/checklists to supporting context instead of the default routing layer. Clean up stale auth plan/design status so the active queue is trustworthy.

**Tech Stack:** Markdown docs, repo guidance in `AGENTS.md`, git workflow conventions

---

## Progress

- [x] Add repo guidance that routes next-work selection through `docs/NEXT.md`.
- [x] Add `docs/NEXT.md` as the active queue.
- [x] Add a short docs guide clarifying which files are active vs historical.
- [x] Mark `docs/implementation-checklist.md` as historical.
- [x] Audit and clean stale status in the active auth migration docs.

## Task 1: Add a Single Active Queue Entry Point

**Files:**
- Modify: `AGENTS.md`
- Create: `docs/NEXT.md`
- Create: `docs/README.md`

**Outcome:**

- Future agents can answer "what's next?" by reading one short file instead of scanning the full docs tree.
- Repo guidance explicitly tells agents to start from `docs/NEXT.md` and only widen the search when needed.

## Task 2: Remove Ambiguous Live Status From Historical Docs

**Files:**
- Modify: `docs/implementation-checklist.md`
- Modify: `docs/plans/2026-03-16-graphql-auth-migration-design.md`
- Modify: `docs/plans/2026-03-16-graphql-auth-migration-implementation-plan.md`

**Outcome:**

- Historical docs stay useful without pretending to be the live task queue.
- The auth migration docs describe the audited current state and the true remaining work, avoiding repeated repo-wide revalidation.
