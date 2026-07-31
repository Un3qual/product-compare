# Platform Modernization Simplification Design

## Goal

Remove complexity and policy-driven ceremony introduced by the platform modernization branch while preserving its approved behavior, database invariants, and toolchain choices.

## Constraints

- Keep React 19, Relay, Radix components, StyleX, pnpm, mise, Vite/Rolldown, and Oxc. Do not restore Bun.
- Keep comparison snapshots relational and published under repeatable-read isolation. Do not store application-owned snapshot facts as JSON.
- Never persist enum-like domain values as unconstrained strings. Keep native PostgreSQL enums and integer-backed reference tables.
- Use Dataloader.Ecto for real associations and genuine multi-parent sets. Do not introduce Dataloader.KV without explicit user approval.
- Preserve authorization, forward-only bounded pagination, stable query counts for genuine nested sets and nodes, and all read-modify-write guarantees.
- The project is unreleased, so simplifying GraphQL and migration contracts may be breaking.

## Design

### Frontend and tooling

Keep the Radix Select and add a StyleX `data-highlighted` visual state; fix the route test so it performs a real Radix selection and verifies submitted variables. Replace the Effect transport pilot with the Promise contract Relay actually consumes and remove the unused dependency. Group related mutations in feature-local family modules, remove source-regex ownership tests, and retain behavior and accessibility tests.

Expand Oxc formatting and linting to all authored source and tests while excluding generated Relay artifacts. Include initial CSS in the bundle budget, retain Radix Themes and StyleX, remove inert pnpm configuration, and flatten the Vite plugin configuration.

### GraphQL

Delete the fake Ecto schema/term-serialization adapter. Root fields resolve directly; genuine nested multi-parent sets and authorized nodes use custom `Dataloader.Ecto.run_batch` callbacks over their actual schemas and ID-shaped inputs. Ordinary associations continue to use inline `dataloader(Context)` fields.

Reduce the connection helper to input policy and delegation to `Absinthe.Relay.Connection`. Accept Relay's already-decoded local node IDs without re-encoding them, remove unreachable fallback execution, make root `activeCoupons` a native connection, and use consistent `CJProgramConnection` naming. Keep useful context type ownership but remove empty modules and implementation-spelling tests.

### Persistence and concurrency

Keep deterministic reference-code Ecto codecs, but add database-parity coverage so their maps cannot drift from seeded reference rows. Remove unfinished reputation event APIs and the unused default delta until a real producer defines their semantics. Make affiliate networks consistently table-driven rather than partly open data and partly a closed enum.

Replace the source-provider row mutex with a conditional atomic claim, remove the unused no-touch API-token path, and reduce enrichment to one product lock. Keep the slug reservation table because PostgreSQL cannot enforce cross-table uniqueness directly, but remove its unused alias discriminator. Move test-only categorical policy code to test support and split the cross-domain concurrency monolith beside its owning contexts.

## Deliberate Non-Changes

- Do not return snapshots to JSONB; the relational model is an explicit product constraint.
- Do not replace reference-code codecs with runtime repository lookups or widespread association translation; database parity is simpler and deterministic.
- Do not replace the slug namespace with a join-heavy canonical slug model; the reservation table is the smaller direct-database uniqueness guarantee.
- Do not remove genuine nested or node batching, repeatable-read snapshot publication, taxonomy serialization, atomic claim election, or database-backed concurrency tests.

## Error Handling and Compatibility

Existing resolver and transport error wording remains stable where externally observable. Relay cursors intentionally switch to Absinthe Relay's canonical format, root `activeCoupons` becomes a direct connection, and inconsistent CJ connection names are corrected. The frontend regenerates Relay artifacts only when schema changes require it.

## Verification

Each behavior change follows a red-green cycle with focused tests. Milestones receive task-scoped review, followed by the complete backend suite, frontend `check` gate, database reset/migration coverage, type and quality checks, Relay generation validation, work-queue validation, and `git diff --check` before publication.
