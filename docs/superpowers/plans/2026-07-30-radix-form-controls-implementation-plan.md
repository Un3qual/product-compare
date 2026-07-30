# Radix Form Controls Implementation Plan

**Goal:** Use Radix Themes form and button components wherever the frontend has
a faithful equivalent, leaving native inputs only for hidden transport fields
or browser behavior Radix does not model.

**Architecture:** Add one Radix Themes provider at the application boundary and
keep project semantic wrappers for product naming and StyleX composition.
Rebase `Button` and `TextField` on Radix Themes, add equally small Select,
TextArea, and Checkbox wrappers, then migrate visible raw controls route by
route. Hidden GET/pagination fields remain native and visually inert.

**Tech Stack:** React, Radix Themes, StyleX, TypeScript, Vitest, Vite,
Rolldown.

## Global Constraints

- Use Radix components for visible buttons, text fields, selects, text areas,
  and checkboxes when their form semantics match the existing control.
- Keep project wrappers semantic and thin; do not recreate Radix behavior or
  expose a second styling system.
- Retain native hidden inputs and any browser-native control whose behavior
  cannot be represented faithfully by Radix.
- Preserve form names, submitted values, default values, labels, focus order,
  validation, GET navigation, and SSR hydration.
- Keep StyleX for layout and product styling.
- Do not weaken the client bundle budget or add wrapper-only tests coupled to
  Radix private markup.

## Task 1: Characterize The Form Contract

- [ ] Inventory every visible raw form control and every use of the project
  `Button` and `TextField` wrappers.
- [ ] Add focused accessibility and form-submission characterization for
  selects, text areas, checkboxes, date inputs, and `asChild` button links.

## Task 2: Establish The Radix Themes Boundary

- [ ] Add the exact Radix Themes dependency and stylesheet.
- [ ] Install one provider at the shared application boundary with SSR-safe
  output.
- [ ] Rebase `Button` and `TextField` and add only the Select, TextArea, and
  Checkbox wrappers required by live controls.
- [ ] Preserve project data attributes and semantic variants only where they
  remain useful to application-owned StyleX/CSS.

## Task 3: Migrate Visible Controls

- [ ] Replace visible raw text inputs, selects, text areas, and checkboxes in
  affiliate, catalog, comparison, ingestion, merchant, offer, and
  community routes.
- [ ] Leave hidden transport fields native and document that exception in the
  boundary test.
- [ ] Prove no visible raw control remains where a project Radix wrapper
  exists.

## Task 4: Verify And Commit

- [ ] Run focused UI/route tests, accessibility assertions, TypeScript, Oxc,
  the full frontend suite, client and SSR builds, and the bundle contract.
- [ ] Record exact results in `docs/work/frontend-radix-form-controls.md`.
- [ ] Commit with `refactor: adopt radix form controls`.

Exit condition: every visible control with a faithful Radix Themes equivalent
uses the project Radix-backed wrapper, native exceptions are explicit and
tested, StyleX remains the styling owner, and every frontend gate passes.
