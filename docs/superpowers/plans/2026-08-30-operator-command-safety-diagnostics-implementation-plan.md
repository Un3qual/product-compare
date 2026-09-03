# Operator Command Safety And Diagnostics Implementation Plan

## Goal

Make dry-run and CJ operator commands reject malformed arguments before startup
and report bounded useful failures without provider or credential leakage.

## Constraints

- Use OptionParser and one small shared boundary for unknown options,
  positional arguments, and reusable numeric validation.
- Validate command-specific values before repository or application startup.
- Use repository-only startup where the workflow does not need the supervision
  tree.
- Keep diagnostics to stable categories and sanitized stacktrace locations.

## Implementation

1. Apply strict option parsing and command-owned range/string checks to CJ feed
   and credential entry points.
2. Move product-attribute backfill validation ahead of repository-only startup.
3. Audit candidate, readiness, and run commands for the same validation-first
   ordering.
4. Share CJ failure categorization and stacktrace argument removal across
   import, feed, and resume commands.

## Owned Areas

- lib/product_compare/mix_tasks/cli_options.ex
- CJ and product-attribute Mix tasks
- lib/product_compare/ingestion/cj_failure_diagnostics.ex
- Matching focused command tests

## Verification

Use no-start subprocess tests for invalid input, focused command and adversarial
diagnostic tests, formatting and type checks, then the complete repository gate.
Completion evidence and milestone commits live in
docs/work/operator-command-safety-diagnostics.md.
