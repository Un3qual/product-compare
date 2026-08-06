import { globSync, readFileSync } from "node:fs";

test("application disclosures use the project Radix boundary", () => {
  const violations = globSync("src/**/*.{ts,tsx}")
    .flatMap((file) => {
      const source = readFileSync(file, "utf8");

      return source
        .split("\n")
        .flatMap((line, index) =>
          /<(details|summary)\b/.test(line) ? [`${file}:${index + 1}`] : [],
        );
    })
    .sort();

  expect(violations).toEqual([]);
});
