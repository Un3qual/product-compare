import {
  findMangledStylexClassNames,
  findStylexClassNames,
  mangleStylexClassName,
  rewriteStylexClassNames,
} from "../../plugins/stylex-class-name";
import stylexMangle from "../../plugins/stylex-mangle";
import { reactWithStyleX, STYLEX_CLASS_NAME_PREFIX } from "../../stylex-plugin";
import { createServer } from "vite";

const PREFIX = STYLEX_CLASS_NAME_PREFIX;

function rewriteBundle(source: string): string {
  const plugin = stylexMangle({ classNamePrefix: PREFIX });
  const bundle = {
    "entry.js": {
      code: source,
      fileName: "entry.js",
      type: "chunk" as const,
    },
  };
  const handler =
    typeof plugin.generateBundle === "object"
      ? plugin.generateBundle.handler
      : plugin.generateBundle;

  handler!.call(
    {
      error(message: string | { message: string }) {
        throw new Error(typeof message === "string" ? message : message.message);
      },
    } as never,
    {} as never,
    bundle as never,
    false,
  );

  return bundle["entry.js"].code;
}

test("generated classes follow the a-to-z then aa sequence", () => {
  const originals = "123456789abcdefghijklmnopqrs".split("").map((hash) => `${PREFIX}${hash}`);
  const source = [
    ...originals.map((className) => `inject({ ltr: ".${className}{color:red}" });`),
    `const classes = "${originals.join(" ")}";`,
  ].join("\n");
  const lastLine = rewriteBundle(source).split("\n").at(-1);

  expect(lastLine).toBe(
    'const classes = "a b c d e f g h i j k l m n o p q r s t u v w x y z aa ab";',
  );
});

test("build mappings stay stable when bundle encounter order differs", () => {
  const source = (classNames: string[]) =>
    [
      ...classNames.map((className) => `inject({ ltr: ".${className}{color:red}" });`),
      `const classes = "${classNames.join(" ")}";`,
    ].join("\n");

  expect(
    rewriteBundle(source([`${PREFIX}z`, `${PREFIX}1`]))
      .split("\n")
      .at(-1),
  ).toBe('const classes = "b a";');
  expect(
    rewriteBundle(source([`${PREFIX}1`, `${PREFIX}z`]))
      .split("\n")
      .at(-1),
  ).toBe('const classes = "a b";');
});

test("the project prefix is compatible with StyleX runtime constants", () => {
  expect(PREFIX).toMatch(/^[A-Za-z][A-Za-z0-9]*$/);
});

test("the same StyleX class keeps its first assigned short name", () => {
  const classNames = new Map<string, string>();
  const className = `${PREFIX}1dmbf1k`;

  expect(mangleStylexClassName(className, PREFIX, classNames)).toBe("a");
  expect(mangleStylexClassName(`${PREFIX}zz`, PREFIX, classNames)).toBe("b");
  expect(mangleStylexClassName(className, PREFIX, classNames)).toBe("a");
});

test("bundle rewriting leaves prefix-shaped application data unchanged", () => {
  const atomic = `${PREFIX}1`;
  const productId = `${PREFIX}123`;
  const source = [
    `inject({ ltr: ".${atomic}{color:red}" });`,
    `const className = "${atomic}";`,
    `const productId = "${productId}";`,
  ].join("\n");

  expect(rewriteBundle(source)).toBe(
    [
      'inject({ ltr: ".a{color:red}" });',
      'const className = "a";',
      `const productId = "${productId}";`,
    ].join("\n"),
  );
});

test("bundle rewriting leaves prefix-shaped authored CSS unchanged", () => {
  const authoredClass = `${PREFIX}123`;
  const plugin = stylexMangle({ classNamePrefix: PREFIX });
  const bundle = {
    "index.css": {
      fileName: "index.css",
      name: "index.css",
      source: `.${authoredClass}{color:red}`,
      type: "asset" as const,
    },
  };
  const handler =
    typeof plugin.generateBundle === "object"
      ? plugin.generateBundle.handler
      : plugin.generateBundle;

  handler!.call(
    {
      error(message: string | { message: string }) {
        throw new Error(typeof message === "string" ? message : message.message);
      },
    } as never,
    {} as never,
    bundle as never,
    false,
  );

  expect(bundle["index.css"].source).toBe(`.${authoredClass}{color:red}`);
});

test("mangling is injective for canonical StyleX base-36 hashes", () => {
  const classNames = new Map<string, string>();
  const originals = ["0", "1", "z", "10", "zz", "100", "1dmbf1k"].map((hash) => `${PREFIX}${hash}`);
  const mangled = originals.map((name) => mangleStylexClassName(name, PREFIX, classNames));

  expect(new Set(mangled).size).toBe(originals.length);
});

test("rewriting changes only atomic classes and leaves constants, variables, and keyframes intact", () => {
  const atomic = `${PREFIX}1dmbf1k`;
  const source = [
    `inject({ ltr: ".${atomic}{color:red}" });`,
    `const className = "${atomic}";`,
    `register({ constKey: "${atomic}", constVal: "red" });`,
    `register({constKey:\`${atomic}\`,constVal:"blue"});`,
    `const variable = "--${atomic}";`,
    `const keyframes = "${atomic}-B";`,
    `const embedded = "before${atomic}";`,
  ].join("\n");
  const classNames = new Map<string, string>();
  mangleStylexClassName(atomic, PREFIX, classNames);

  expect(rewriteStylexClassNames(source, PREFIX, classNames)).toEqual({
    changed: true,
    code: [
      'inject({ ltr: ".a{color:red}" });',
      `const className = "a";`,
      `register({ constKey: "${atomic}", constVal: "red" });`,
      `register({constKey:\`${atomic}\`,constVal:"blue"});`,
      `const variable = "--${atomic}";`,
      `const keyframes = "${atomic}-B";`,
      `const embedded = "before${atomic}";`,
    ].join("\n"),
  });
  expect(findStylexClassNames(source, PREFIX)).toEqual(new Set([atomic]));
});

test("noncanonical and unrelated names are not treated as StyleX atomic classes", () => {
  const classNames = new Map<string, string>();

  expect(mangleStylexClassName(`${PREFIX}01`, PREFIX, classNames)).toBeNull();
  expect(mangleStylexClassName(`${PREFIX}ABC`, PREFIX, classNames)).toBeNull();
  expect(mangleStylexClassName("product-card", PREFIX, classNames)).toBeNull();
});

test("mangled class discovery reads StyleX rules without treating JavaScript properties as classes", () => {
  expect(
    findMangledStylexClassNames(
      'const first = result.edges[0]; inject({ltr: `.ab{color:red}`, rtl: ".ac:hover{color:blue}"});',
    ),
  ).toEqual(new Set(["ab", "ac"]));
});

test("the Vite plugin fails closed when its output namespace collides with authored CSS", () => {
  const original = `${PREFIX}1`;
  const plugin = stylexMangle({ classNamePrefix: PREFIX });
  const bundle = {
    "entry.js": {
      code: `inject({ ltr: ".${original}{color:red}" });`,
      fileName: "entry.js",
      type: "chunk" as const,
    },
    "index.css": {
      fileName: "index.css",
      name: "index.css",
      source: `.${original}{color:red}.a{color:blue}`,
      type: "asset" as const,
    },
  };
  const handler =
    typeof plugin.generateBundle === "object"
      ? plugin.generateBundle.handler
      : plugin.generateBundle;

  expect(() =>
    handler!.call(
      {
        error(message: string | { message: string }) {
          throw new Error(typeof message === "string" ? message : message.message);
        },
      } as never,
      {} as never,
      bundle as never,
      false,
    ),
  ).toThrow('generated class ".a" would collide');
});

test("the Vite plugin rejects an empty class-name prefix", () => {
  expect(() => stylexMangle({ classNamePrefix: "" })).toThrow("classNamePrefix cannot be empty");
});

test("the Vite development server emits shortened StyleX atomic class names", async () => {
  const server = await createServer({
    configFile: false,
    optimizeDeps: { include: [], noDiscovery: true },
    plugins: [...reactWithStyleX(), stylexMangle({ classNamePrefix: PREFIX })],
    root: process.cwd(),
    server: { middlewareMode: true, watch: null, ws: false },
  });

  try {
    const result = await server.transformRequest("/src/ui/primitives/Button.tsx");

    expect(result).not.toBeNull();
    expect(findStylexClassNames(result!.code, PREFIX)).toEqual(new Set());
    expect(findMangledStylexClassNames(result!.code)).toContain("a");
  } finally {
    await server.close();
  }
}, 15_000);
