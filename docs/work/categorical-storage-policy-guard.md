# Categorical Storage Policy Guard

## Snapshot

- Status: complete
- Priority: P1
- Source of truth:
  `docs/superpowers/plans/2026-07-30-categorical-storage-policy-guard-implementation-plan.md`
- Last verified: 2026-07-31 against the test-support policy owner, compiled
  relational schemas, PostgreSQL catalog, and explicit controlled-reference
  storage tests.

## Target Outcome

The repository automatically rejects a persisted `Ecto.Enum` backed by a
free-form string column and rejects text-backed database constraints that
encode a closed domain.

## Delivered

- `ProductCompare.TestSupport.CategoricalStoragePolicy` discovers relational
  schemas from the compiled application module set, excludes embedded and
  virtual fields, resolves custom Ecto field sources, and returns deterministic
  schema/table/field/column records. It lives in `test/support`; production no
  longer carries the policy oracle.
- The former hand-maintained 32-column registry is gone. Every discovered
  persisted `Ecto.Enum` is joined to the live PostgreSQL catalog and must
  report `data_type = 'USER-DEFINED'` and `pg_type.typtype = 'e'`.
- Missing and non-enum columns produce schema-qualified errors with the
  observed PostgreSQL data type, UDT, and type kind.
- Text, varchar, and bpchar check constraints are inspected for direct
  `IN (...)`, PostgreSQL `ANY (ARRAY[...])`, and repeated-equality closed sets.
  Ordinary length and format checks remain valid.
- Commerce and ingestion controlled-reference suites remain independent,
  explicit coverage for domains whose values have metadata or identity.
- Reference-code parity is separately self-checking against the database and
  includes every production `ReferenceCode` schema field.

## Boundaries

- PostgreSQL enum is the minimum, not the preferred answer for domains that
  need metadata or independent identity.
- Preserve raw provider evidence verbatim.
- Do not create a generic schema-policy framework beyond this approved storage
  invariant.

## Next Action

None. The durable categorical storage contract is complete.

## Verification

- `MIX_ENV=test mix ecto.reset`: passed through the complete migration history.
- Focused enum and controlled-reference storage gate: 9 tests passed.
- Post-move categorical architecture gate: 4 tests passed.
- Final full backend suite: 1,026 tests passed.
- `mix typecheck`: passed.
- `mix quality`: Credo found no issues, ExDNA remained at its 3/3 budget,
  Reach reported no unsuppressed smells, and Dialyzer reported zero errors.
- `mix work_queue.validate`: passed with 3 ready rows.
- `mix format --check-formatted` and `git diff --check`: passed.
