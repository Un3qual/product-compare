# Route Configuration Location Design

## Outcome

Remove the ambiguous top-level `assets/src/routing` directory. Keep route-table
configuration separate from route-owned page implementations by relocating the
four existing configuration files to `assets/src/routes/config`.

## Structure

The relocated directory contains:

- `account-routes.tsx`
- `operator-routes.tsx`
- `shopper-routes.tsx`
- `lazy-route.tsx`

`assets/src/router.tsx` remains the composition root. It imports the three route
tables from `assets/src/routes/config`, while those tables continue to lazy-load
page implementations from the surrounding route feature directories.

## Constraints

- Preserve every URL, route identifier, loader, metadata value, error boundary,
  redirect, and lazy-import recovery behavior.
- Make no component, data-flow, or presentation changes.
- Do not inline the route tables into `router.tsx` or scatter configuration
  files among feature directories.
- Remove `assets/src/routing` after all four files have moved.

## Verification

- Confirm no source imports or files still reference `assets/src/routing`.
- Run the focused router tests.
- Run TypeScript and formatting checks.
- Run a clean Git diff check.
