import path from "node:path";
import { fileURLToPath } from "node:url";
import stylexPlugin from "@stylexjs/babel-plugin";
import react from "@vitejs/plugin-react";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export function reactWithStyleX() {
  return react({
    babel: {
      plugins: [
        [
          stylexPlugin,
          {
            dev: process.env.NODE_ENV !== "production",
            test: process.env.NODE_ENV === "test",
            runtimeInjection: true,
            unstable_moduleResolution: {
              type: "commonJS",
              rootDir: projectRoot
            }
          }
        ]
      ]
    }
  });
}
