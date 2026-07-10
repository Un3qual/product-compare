# Rolling Ready Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the repository's one-row-at-a-time queue guidance with a rolling slate of three to five validated `ready` rows.

**Architecture:** Keep `docs/work/index.md` as the only live queue and `docs/plans/INDEX.md` as the coordinator-only candidate pool. Apply one consistent policy across repository guidance, the operating model, the live dispatcher, and the legacy NOW pointer so coordinators replenish the slate in one pass while workers retain per-row ownership boundaries.

**Tech Stack:** Markdown documentation, ripgrep policy checks, Git whitespace validation.

## Global Constraints

- The target queue depth is three to five `ready` rows.
- Replenish the slate in one coordinator pass whenever fewer than three `ready` rows remain at a dispatch boundary.
- More than five `ready` rows requires an explicitly requested larger execution batch.
- Fewer than three is valid only when the queue explicitly names the decision, blocker, or shortage of validated candidates.
- Count only `ready` rows toward queue depth.
- Do not create filler work to meet the target.
- Do not mark dependent work `ready` before its prerequisites are complete.
- Allow parallel execution only when owned paths and lane work docs do not overlap.
- Do not select or promote Product Compare work in this policy-only batch.

---

### Task 1: Adopt the rolling ready queue policy atomically

**Files:**

- Modify: `AGENTS.md:5-19`
- Modify: `docs/work/operating-model.md:21-60`
- Modify: `docs/work/operating-model.md:120-141`
- Modify: `docs/work/index.md:9-21`
- Modify: `docs/work/index.md:189-212`
- Modify: `docs/plans/NOW.md:11-17`
- Reference: `docs/superpowers/specs/2026-07-09-rolling-ready-queue-design.md`

**Interfaces:**

- Consumes: the approved rolling queue policy in `docs/superpowers/specs/2026-07-09-rolling-ready-queue-design.md`.
- Produces: one consistent dispatch contract used by coordinators, workers, legacy NOW readers, and repository-level agents.

- [ ] **Step 1: Confirm the current operational docs still contain the stale single-row policy**

Run:

```bash
rg -n 'exactly one|one ready row|one concrete batch' AGENTS.md docs/work/index.md docs/work/operating-model.md docs/plans/NOW.md
```

Expected: matches in `docs/work/index.md` queue rules and coordinator prompt,
plus the single-batch promotion rule in `docs/work/operating-model.md`.

- [ ] **Step 2: Update repository-level dispatch guidance**

In `AGENTS.md`, replace the no-ready-only coordinator rule with guidance that
has this exact behavior:

```markdown
- Maintain a rolling slate of three to five `ready` rows whenever validated work exists.
- At each dispatch boundary, if fewer than three `ready` rows remain, the coordinator replenishes the slate in one pass from source-backed candidates or records the decision, blocker, or candidate shortage that prevents it.
- More than five `ready` rows requires an explicitly requested larger execution batch; never create filler work to meet the target.
- Coordinators may use `docs/plans/INDEX.md` as the candidate pool only during replenishment; workers must not treat it as a second queue.
- A worker claims the highest-ranked `ready` row that does not conflict with an active row. Other executable rows remain `ready`.
```

Keep the existing rules for code verification, lane work docs, coordinator-owned
files, owned paths, and milestone commits unchanged.

- [ ] **Step 3: Define queue depth and compatibility in the operating model**

In `docs/work/operating-model.md`, add a `Rolling Ready Slate` section after the
dispatch row contract with this exact policy:

```markdown
## Rolling Ready Slate

- Target three to five `ready` rows whenever validated work exists.
- Count only `ready` rows; `active`, `blocked`, and `needs_decision` rows do not count toward the target.
- At every promotion, completion, blocking, or reassignment boundary, replenish in one coordinator pass when fewer than three `ready` rows remain.
- A valid below-target result contains every currently valid row plus an explicit decision, blocker, or shortage of validated candidates.
- More than five `ready` rows requires an explicitly requested larger execution batch.
- Do not create filler work or promote deferred, rejected, blocked, dependent, or unverified candidates to satisfy queue depth.
- A worker claims the highest-ranked `ready` row that does not conflict with active ownership. Other executable rows remain `ready`.
- Rows may execute in parallel only when their owned paths and lane work docs do not overlap.
```

Also update `Prompt Rules` so coordinators may consult `docs/plans/INDEX.md` and
the directly relevant lane docs during replenishment, while workers remain
barred from broad historical-plan searches. Replace the single-batch promotion
rule with these exact outcomes:

```markdown
- Resolve a `needs_decision` row by promoting enough source-backed work to restore the rolling slate, or record why fewer than three valid rows exist.
- Promote `blocked` work only after its missing evidence is recorded; then continue replenishing the slate if it remains below target.
- Close a lane only after focused verification passes and the queue has three to five `ready` rows or an explicit below-target explanation.
```

Retain the existing stop rule for work that requires files outside a row's owned
paths.

- [ ] **Step 4: Align the live queue and compatibility pointer**

In `docs/work/index.md`, revise `Queue Rules` to state all of the following:

```markdown
- The target is three to five `ready` rows whenever validated work exists.
- When fewer than three remain at a dispatch boundary, the coordinator replenishes the complete slate in one pass.
- A below-target slate must name the decision, blocker, or shortage of validated candidates preventing replenishment.
- More than five `ready` rows requires an explicitly requested larger execution batch.
- Workers claim the highest-ranked compatible `ready` row and leave other executable rows available.
- Dependent, deferred, rejected, blocked, and unverified work cannot be used as queue-depth filler.
```

Replace the coordinator prompt with:

```text
Start at docs/work/index.md.

Read docs/work/operating-model.md.
Process the highest-ranked non-ready row when a decision or blocker exists.
Otherwise curate source-backed candidates from docs/plans/INDEX.md and the directly affected lane docs.
When fewer than three ready rows remain, replenish the slate to three to five ready rows in one pass.
Validate every promoted row's owned paths, verification, prerequisites, and exit condition.
Update only the live queue plus the directly affected lane or plan docs.
End with three to five ready rows, or every valid row plus a clearly named reason the slate is smaller.
```

Update the worker prompt so it says to execute the highest-ranked `ready` row
that does not conflict with an active row and to leave other `ready` rows
unchanged.

In `docs/plans/NOW.md`, replace its `What To Do` bullets with:

```markdown
- For execution, open `docs/work/index.md` and claim the highest-ranked `ready` row that does not conflict with active ownership.
- When fewer than three `ready` rows remain, use the coordinator rules in `docs/work/operating-model.md` to replenish the slate to three to five in one pass.
- If the slate cannot reach three, keep every valid row and record the decision, blocker, or shortage of validated candidates in `docs/work/index.md`.
- Update this file only if the queue entry point changes.
```

Do not add Product Compare work items in this task.

- [ ] **Step 5: Verify the operational policy is internally consistent**

Run:

```bash
rg -n 'exactly one|one ready row|one concrete batch' AGENTS.md docs/work/index.md docs/work/operating-model.md docs/plans/NOW.md
```

Expected: no output.

Run:

```bash
rg -n 'three to five|fewer than three|validated candidates|conflict with an active' AGENTS.md docs/work/index.md docs/work/operating-model.md docs/plans/NOW.md
```

Expected: policy matches in all four files, covering the target, replenishment
trigger, explicit exception, and active-row compatibility.

Run:

```bash
rg -n 'More than five|more than five|filler work' AGENTS.md docs/work/index.md docs/work/operating-model.md
```

Expected: policy matches in all three authoritative dispatch-rule files,
covering the explicit larger-batch exception and the ban on filler work.

Run:

```bash
git diff --check
```

Expected: exit status 0 with no output.

- [ ] **Step 6: Commit the atomic policy change**

```bash
git add AGENTS.md docs/work/index.md docs/work/operating-model.md docs/plans/NOW.md
git commit -m "docs: adopt rolling ready queue"
```

Expected: one documentation commit containing all four operational sources and
no Product Compare queue promotions.
