# Repository Guidance

## Execution Entry Point

- Filename glossary: Now (NOW) is the legacy current-work pointer file (`docs/plans/NOW.md`); Index (INDEX) is the plan catalog file (`docs/plans/INDEX.md`).
- Start plan discovery at `docs/work/index.md`.
- Read `docs/work/operating-model.md` for the dispatch rules, prompt templates, and handoff templates.
- Treat `docs/work/index.md` as the only live dispatch queue. Execute only rows marked `ready`.
- Treat `docs/work/*.md` as lane context and lane-local status evidence, not as a second queue.
- Treat dated docs in `docs/plans/` and `docs/implementation-checklist.md` as historical design/checkpoint context unless `docs/work/index.md` links one as the active plan for a `ready` row.
- Treat `docs/plans/NOW.md` as a compatibility pointer back to `docs/work/index.md`, not as a separate ledger.
- Maintain at least three `ready` implementation rows at every stable dispatch
  boundary unless the committed queue includes a complete `Ready Floor
  Exception` proving that fewer coherent outcomes exist.
- Three is the replenishment floor, not a target or maximum. Promote every
  useful, currently validated candidate whose ownership and prerequisites make
  it executable.
- Treat a queue row as an independently shippable and reviewable outcome, not
  as one helper, component, file, or test-sized implementation step.
- Group source-backed changes that enforce the same invariant across adjacent
  surfaces into one batch. Track path-disjoint or serial implementation work
  as internal slices and milestone commits inside that batch; internal slices
  do not count toward the ready-row floor.
- Frontend and backend share this one queue. Layer or lane labels do not prevent
  grouping when both sides close one lifecycle invariant, and a frontend-only
  replenishment pass must verify that no ready backend outcome was overlooked.
- Parallel ownership is a way to execute slices inside a coherent batch, not
  sufficient reason by itself to create separate queue rows.
- Never split work into micro-batches or invent filler merely to reach a
  requested batch count or the ready-row floor. If fewer coherent batches are
  available, return the smaller truthful set, add the validator-enforced ready
  floor exception, and record the replenishment action. Remove the exception
  as soon as three coherent rows exist.
- Before a claim would leave fewer than three other `ready` rows, the
  coordinator replenishes the queue or commits a complete ready floor exception
  in the same dispatch update.
- Before removing completed or blocked work, preserve truthful lane evidence
  and ensure the committed queue either contains at least three complete ready
  rows or a complete ready floor exception.
- If the candidate catalog cannot restore the floor, the coordinator validates
  new implementation candidates against current product behavior, code, tests,
  architecture gaps, and lane evidence before dispatch continues.
- Do not use deferred, rejected, blocked, dependent, speculative, stale, or
  unverified work as queue filler unless a later explicit product decision or
  fresh validation reclassifies it as `ready`.
- Coordinators may use `docs/plans/INDEX.md` as the candidate pool only during
  replenishment; workers must not treat it as a second queue.
- A worker claims the highest-ranked `ready` row that does not conflict with an
  active row. Other executable rows remain `ready`; a ready floor exception
  permits claiming the smaller truthful set it documents.
- Verify the selected batch against the codebase before assuming it is still unimplemented.
- Update the relevant `docs/work/*.md` file when lane-local batch status or blockers change.
- In parallel mode, a worker may edit only files in its row's `Owned paths` plus its lane work doc.
- Treat `docs/work/index.md`, `docs/plans/INDEX.md`, `docs/plans/NOW.md`, and `ARCHITECTURE.md` as coordinator-owned shared docs unless the selected queue row explicitly names them under `Owned paths`.
- If the selected batch requires another lane's files or a coordinator-owned doc, record the blocker in the lane work doc instead of crossing lanes.
- Commit only at milestone boundaries that include the related code/test/doc changes; do not make standalone checkbox-only or docs-only progress commits.
- A docs-only commit is acceptable when the docs/workflow system itself is the requested deliverable.

## Typescript

- Prefer inferred types over explicit type declarations when possible.
- Don't create new types that do nothing but alias another type or slightly modify another.
- Don't create new types when relay has already generated one that works.
- Prefer concise solutions for current problems. Still keep in mind future plans, but channel "YAGNI". Don't overcomplicate a solution "just in case" things may change or requirements may expand in the future.

## Tests
- Don't add unnecessary regression tests for every single review comment. Analyze whether it is worth adding a regression test before blindly adding one when the issue may just be something like a one time typo or mistake.

## Auth Contract

- Frontend-facing browser auth flows must use GraphQL over `/api/graphql`.
- Do not add new REST/JSON endpoints for browser `login`, `register`, `logout`, `forgotPassword`, `resetPassword`, or `verifyEmail` flows.
- Keep Phoenix as the cookie-backed session authority. GraphQL auth mutations set or clear the Phoenix session cookie; they do not return bearer or session tokens for browser auth.
- Treat `viewer` plus auth mutations on the GraphQL schema as the frontend auth contract.

## Database Constraint Contract

- Every application-owned same-row PostgreSQL check constraint reachable
  through an Ecto changeset must have equivalent pre-write validation, an
  explicit `check_constraint/3` mapping, a changeset behavior test, and direct
  database coverage in the same batch.
- A trigger-maintained table without an application write changeset may be an
  exception only when the originating values are validated and the trigger
  executes inside the originating SQL statement; document and test the
  exception.
- Uniqueness, foreign keys, and cross-row invariants remain
  database-authoritative. Do not replace them with a race-prone preflight
  query.
- When a write depends on an earlier read, perform the read, required row lock,
  and write in one `Repo.transaction/2`, or use one atomic statement. A lone
  constrained statement already has PostgreSQL statement atomicity and does
  not need a ceremonial wrapper transaction.
- A migration that adds or changes a constraint must update its owning
  changeset contract and focused tests in the same batch.
