# CJ Shortlist Cohort Export Rejection Record

**Status:** rejected.

CJ candidate CSV export is intentionally not part of the ingestion roadmap. The
operator path for merchant application planning is the read-only application
cohort report, not a CSV export task.

Do not promote this plan back to `ready`, do not add CSV rendering, and do not
write candidate export files. The local Mix task path exists only to fail fast if
someone invokes the old command name.

Verification for the rejection contract:

```bash
mix test test/mix/tasks/product_compare_ingestion_cj_candidate_export_test.exs
```
