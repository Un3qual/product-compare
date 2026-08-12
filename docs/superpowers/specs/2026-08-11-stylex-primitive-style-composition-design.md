# StyleX Primitive Style Composition Design

## Context

The frontend primitives currently accept ordinary `className` strings and pass them through `customClassName`, which forges StyleX's private `$$css` compiled-style marker. This makes StyleQ concatenate the class string, but it loses the property metadata StyleQ needs for deterministic style precedence.

## Decision

Frontend primitives will expose one styling channel: a typed StyleX `style` prop. Consumers pass compiled StyleX objects or arrays directly, and the primitive calls `stylex.props()` once where it renders its host element or Base UI root.

Raw `className` is removed from primitive public props. Native elements can still use ordinary `className` directly when needed, but component-to-component styling remains in StyleX form until the final render boundary.

## Alternatives considered

- Concatenating raw `className` after `stylex.props()` would avoid the private marker, but retain two styling systems and prevent StyleQ from resolving conflicts in external classes.
- Replacing `customClassName` with another wrapper would remove the cast while preserving the same repeated adapter ceremony.

The StyleX-only API is preferred because it uses the supported composition model and makes precedence explicit.

## Migration

- Remove `customClassName` and its utility module.
- Update each primitive prop type to omit DOM/Base UI `className` and `style`, then add `style?: StyleXStyles` where styling is supported.
- Pass internal styles, variants, state styles, and the caller's `style` together to `stylex.props()`.
- Replace primitive consumers that spread `stylex.props(styles.foo)` with `style={styles.foo}`. Native-element calls remain unchanged.
- Preserve Base UI render-prop state behavior and existing semantic markup.

## Verification

- Behavior tests prove caller StyleX styles are present and override primitive defaults where the API allows overrides.
- Architecture coverage rejects the private `$$css` adapter and primitive `customClassName` imports.
- Typecheck, lint, formatting, unit tests, client/SSR builds, StyleX mangling contracts, bundle budgets, and Playwright flows must pass.
