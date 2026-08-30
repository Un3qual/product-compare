import { readFileSync } from "node:fs";

test("the main TypeScript project includes Playwright source", () => {
  const config = JSON.parse(readFileSync("tsconfig.json", "utf8"));

  expect(config).toEqual(
    expect.objectContaining({
      include: expect.arrayContaining(["tests/e2e"]),
    }),
  );
});
