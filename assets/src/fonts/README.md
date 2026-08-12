# Bundled fonts

The application bundles its interface fonts through local npm dependencies; it
does not request fonts from a third-party URL at runtime.

- `@fontsource-variable/instrument-sans` 5.3.0 supplies Instrument Sans
  Variable through `wght.css` (normal weights 400–700).
- `@fontsource/ibm-plex-mono` 5.3.0 supplies IBM Plex Mono regular through
  `400.css` for compact data labels.

Both font packages are licensed under the SIL Open Font License 1.1 (OFL-1.1).
Their complete notices are retained in the installed package `LICENSE` files:
`node_modules/@fontsource-variable/instrument-sans/LICENSE` and
`node_modules/@fontsource/ibm-plex-mono/LICENSE`.
