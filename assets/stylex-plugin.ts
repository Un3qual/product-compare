import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import relayPlugin from "babel-plugin-relay";
import stylexPlugin from "@stylexjs/babel-plugin";
import babel from "@rolldown/plugin-babel";
import react from "@vitejs/plugin-react";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// StyleX's runtime constant resolver accepts alphanumeric generated keys. The
// Vite plugin shortens emitted atomic classes in development and production,
// while keeping this prefix on internal runtime constant keys.
export const STYLEX_CLASS_NAME_PREFIX = "pcx";

export const frontendAliases = {
  $frontend: path.join(projectRoot, "src/frontend"),
  $generated: path.join(projectRoot, "src/__generated__"),
  $relay: path.join(projectRoot, "src/relay"),
  $routes: path.join(projectRoot, "src/routes"),
  $ui: path.join(projectRoot, "src/ui"),
};

export function reactWithStyleX() {
  return [
    ...react(),
    babel({
      plugins: [
        relayPlugin,
        [
          stylexPlugin,
          {
            aliases: {
              "$frontend/*": [`${pathToFileURL(frontendAliases.$frontend).href}/*`],
              "$generated/*": [`${pathToFileURL(frontendAliases.$generated).href}/*`],
              "$relay/*": [`${pathToFileURL(frontendAliases.$relay).href}/*`],
              "$routes/*": [`${pathToFileURL(frontendAliases.$routes).href}/*`],
              "$ui/*": [`${pathToFileURL(frontendAliases.$ui).href}/*`],
            },
            dev: process.env.NODE_ENV !== "production",
            test: false,
            runtimeInjection: true,
            classNamePrefix: STYLEX_CLASS_NAME_PREFIX,
            unstable_moduleResolution: {
              type: "commonJS",
              rootDir: projectRoot,
            },
          },
        ],
      ],
    }),
  ];
}
