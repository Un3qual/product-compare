# Dated Plans

Start at `docs/work/index.md` for the live dispatch queue.

Files in this directory are dated design and implementation baselines. They are
reference material unless `docs/work/index.md` links one of them as the active
plan for a `ready` row.

Do not use dated plans as live checklists. Track live status in
`docs/work/index.md` and lane-specific context in `docs/work/*.md`.

Plan tasks and queue batches use different granularity. A batch is an
independently shippable, reviewable outcome. Per-surface changes, path-disjoint
parallel work, test cycles, and milestone commits belong under internal slices
inside that batch. Do not create one queue row per helper, component, route,
file, or requested ordinal when the work shares one invariant and acceptance
boundary. See `docs/work/operating-model.md` for the promotion test.
