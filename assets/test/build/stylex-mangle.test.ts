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

test("the project prefix is compatible with StyleX runtime constants", () => {
  expect(PREFIX).toMatch(/^[A-Za-z][A-Za-z0-9]*$/);
});

test("the same StyleX class receives the same short name independently of graph order", () => {
  const className = `${PREFIX}1dmbf1k`;

  const clientNames = new Map(
    [`${PREFIX}a`, className, `${PREFIX}zz`].map((name) => [
      name,
      mangleStylexClassName(name, PREFIX),
    ]),
  );
  const serverNames = [className].map((name) => mangleStylexClassName(name, PREFIX));

  expect(serverNames[0]).toBe(clientNames.get(className));
  expect(serverNames[0]).toMatch(/^_[A-Za-z0-9]+$/);
  expect(serverNames[0]!.length).toBeLessThan(className.length);
});

test("mangling is injective for canonical StyleX base-36 hashes", () => {
  const originals = ["0", "1", "z", "10", "zz", "100", "1dmbf1k"].map((hash) => `${PREFIX}${hash}`);
  const mangled = originals.map((name) => mangleStylexClassName(name, PREFIX));

  expect(new Set(mangled).size).toBe(originals.length);
});

test("rewriting changes only atomic classes and leaves constants, variables, and keyframes intact", () => {
  const atomic = `${PREFIX}1dmbf1k`;
  const mangled = mangleStylexClassName(atomic, PREFIX);
  const source = [
    `const className = "${atomic}";`,
    `register({ constKey: "${atomic}", constVal: "red" });`,
    `register({constKey:\`${atomic}\`,constVal:"blue"});`,
    `const variable = "--${atomic}";`,
    `const keyframes = "${atomic}-B";`,
    `const embedded = "before${atomic}";`,
  ].join("\n");

  expect(rewriteStylexClassNames(source, PREFIX)).toEqual({
    changed: true,
    code: [
      `const className = "${mangled}";`,
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
  expect(mangleStylexClassName(`${PREFIX}01`, PREFIX)).toBeNull();
  expect(mangleStylexClassName(`${PREFIX}ABC`, PREFIX)).toBeNull();
  expect(mangleStylexClassName("product-card", PREFIX)).toBeNull();
});

test("mangled class discovery requires emitted CSS selectors in the reserved namespace", () => {
  expect(
    findMangledStylexClassNames(
      'const _jsx = value; class="_a _A0 authored_name";._z9{color:red};before_a after',
    ),
  ).toEqual(new Set(["_z9"]));
});

test("the Vite plugin fails closed when its output namespace collides with authored CSS", () => {
  const original = `${PREFIX}1`;
  const mangled = mangleStylexClassName(original, PREFIX)!;
  const plugin = stylexMangle({ classNamePrefix: PREFIX });
  const bundle = {
    "index.css": {
      fileName: "index.css",
      name: "index.css",
      source: `.${original}{color:red}.${mangled}{color:blue}`,
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
  ).toThrow(`generated class ".${mangled}" would collide`);
});

test("the Vite plugin rejects an empty class-name prefix", () => {
  expect(() => stylexMangle({ classNamePrefix: "" })).toThrow("classNamePrefix cannot be empty");
});

test("the Vite development server emits shortened StyleX atomic class names", async () => {
  const server = await createServer({
    configFile: false,
    plugins: [...reactWithStyleX(), stylexMangle({ classNamePrefix: PREFIX })],
    root: process.cwd(),
    server: { middlewareMode: true, watch: null, ws: false },
  });

  try {
    const result = await server.transformRequest("/src/ui/primitives/Button.tsx");

    expect(result).not.toBeNull();
    expect(findStylexClassNames(result!.code, PREFIX)).toEqual(new Set());
    expect(findMangledStylexClassNames(result!.code).size).toBeGreaterThan(0);
  } finally {
    await server.close();
  }
});
