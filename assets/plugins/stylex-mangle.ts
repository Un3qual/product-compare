import type { Plugin, ResolvedConfig, Rollup } from "vite";
import {
  findStylexClassNames,
  mangleStylexClassName,
  rewriteStylexClassNames,
} from "./stylex-class-name.ts";

export type StylexMangleOptions = {
  classNamePrefix: string;
};

function assetSourceToString(source: string | Uint8Array): string {
  return typeof source === "string" ? source : new TextDecoder().decode(source);
}

function isTextAsset(fileName: string): boolean {
  return /\.(?:css|html|js|mjs|cjs)$/.test(fileName);
}

function authoredCssClasses(source: string): Set<string> {
  return new Set([...source.matchAll(/\.([_A-Za-z][_A-Za-z0-9-]*)/g)].map((match) => match[1]!));
}

function collisionMessage(className: string, original: string): string {
  return `StyleX mangling generated class ".${className}" would collide with authored CSS (source class: ".${original}").`;
}

export default function stylexMangle(options: StylexMangleOptions): Plugin {
  const { classNamePrefix } = options;

  if (!classNamePrefix) {
    throw new Error("stylex-mangle: classNamePrefix cannot be empty");
  }

  const classNames = new Map<string, string>();
  const generatedNames = new Map<string, string>();
  let command: ResolvedConfig["command"] = "build";

  function rememberClassName(original: string): void {
    const mangled = mangleStylexClassName(original, classNamePrefix, classNames);

    if (mangled !== null) {
      generatedNames.set(mangled, original);
    }
  }

  function remember(source: string): void {
    for (const original of findStylexClassNames(source, classNamePrefix)) {
      rememberClassName(original);
    }
  }

  function rewrite(source: string): string {
    remember(source);
    return rewriteStylexClassNames(source, classNamePrefix, classNames).code;
  }

  function rewriteBundle(this: Rollup.PluginContext, bundle: Rollup.OutputBundle): void {
    const originals = new Set<string>();

    for (const output of Object.values(bundle)) {
      const source =
        output.type === "chunk"
          ? output.code
          : isTextAsset(output.fileName)
            ? assetSourceToString(output.source)
            : null;

      if (source !== null) {
        for (const original of findStylexClassNames(source, classNamePrefix)) {
          originals.add(original);
        }
      }
    }

    for (const original of [...originals].sort()) {
      rememberClassName(original);
    }

    for (const output of Object.values(bundle)) {
      if (output.type !== "asset" || !output.fileName.endsWith(".css")) {
        continue;
      }

      const source = assetSourceToString(output.source);
      const originalNames = findStylexClassNames(source, classNamePrefix);

      for (const className of authoredCssClasses(source)) {
        const original = generatedNames.get(className);

        if (original !== undefined && !originalNames.has(className)) {
          this.error(collisionMessage(className, original));
        }
      }
    }

    for (const output of Object.values(bundle)) {
      if (output.type === "chunk") {
        output.code = rewrite(output.code);
      } else if (isTextAsset(output.fileName)) {
        output.source = rewrite(assetSourceToString(output.source));
      }
    }
  }

  return {
    name: "product-compare:stylex-mangle",
    enforce: "post",
    configResolved(config) {
      command = config.command;
    },
    transform(code) {
      if (command !== "serve") {
        return null;
      }

      remember(code);
      const result = rewriteStylexClassNames(code, classNamePrefix, classNames);

      return result.changed ? { code: result.code, map: null } : null;
    },
    generateBundle: {
      order: "post",
      handler(_outputOptions, bundle) {
        rewriteBundle.call(this, bundle);
      },
    },
  };
}
