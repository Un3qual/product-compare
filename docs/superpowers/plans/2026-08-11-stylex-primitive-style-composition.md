# StyleX Primitive Style Composition Implementation Plan

> **Goal:** Remove the `customClassName` StyleQ escape hatch and make styled UI primitives accept compiled StyleX styles directly.

**Architecture:** Styled primitives expose a typed `style?: StyleXStyles` prop instead of a raw `className`/DOM `style` pair. Each primitive resolves its own styles first and caller styles last through `stylex.props()` at the DOM or Base UI boundary. Stateful Base UI callbacks forward both the resolved class name and dynamic inline values. Consumers pass StyleX rules through `style={styles.rule}`; native DOM elements continue to use `stylex.props()` directly.

**Tech stack:** React 19, TypeScript, StyleX, Base UI, Vitest, Testing Library, Playwright.

---

## Task 1: Lock the primitive styling contract with tests

**Files:**
- Create: `assets/test/ui/primitive-style-types.test.tsx`
- Modify: `assets/test/ui/primitives.test.tsx`

1. Add a compile-time contract proving representative styled primitives accept compiled StyleX rules and reject raw `className` values.
2. Add a behavior test proving caller StyleX styles are composed at the primitive host boundary and can override a primitive default.
3. Run `pnpm run typecheck` and the focused primitive test to confirm the new contract fails before implementation.

## Task 2: Introduce the typed StyleX primitive prop contract

**Files:**
- Create: `assets/src/ui/primitives/stylex-props.ts`

1. Define a reusable type that omits native/Base UI `className` and DOM `style` props and replaces them with `style?: StyleXStyles`.
2. Keep the helper type-only: no wrapper component and no runtime style conversion.

## Task 3: Migrate styled primitives to direct StyleX composition

**Files:**
- Modify: `assets/src/ui/primitives/*.tsx`
- Delete: `assets/src/ui/primitives/utils.stylex.ts`

1. Migrate simple DOM primitives (badge, button, input, label, separator, spinner, table, textarea).
2. Migrate stateful Base UI primitives (accordion, checkbox, collapsible, radio group, select, tabs).
3. Migrate feedback and overlay primitives (alert, alert dialog, dialog, popover).
4. Compose caller styles last in every `stylex.props()` call and preserve Base UI state callbacks.
5. Remove all `customClassName` imports/usages and delete the utility.

## Task 4: Migrate primitive consumers

**Files:**
- Modify: `assets/src/routes/**/*.tsx`
- Modify: `assets/src/ui/components/**/*.tsx`

1. Replace `...stylex.props(styles.rule)` on styled primitives with `style={styles.rule}`.
2. Leave native DOM-element `stylex.props()` spreads unchanged.
3. Use TypeScript errors and repository search to find any remaining raw `className` or DOM-style calls on styled primitives.

## Task 5: Verify and commit

1. Run formatter, lint, typecheck, unit tests, and the complete frontend check.
2. Run the relevant Playwright UI suite.
3. Confirm `rg 'customClassName|utils\\.stylex' assets/src` returns no matches.
4. Review the final diff for redundant abstractions or unintended API changes.
5. Commit the verified implementation as one coherent milestone.
