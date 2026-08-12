import { globSync, readFileSync } from "node:fs";

test("application disclosures use the project Base UI boundary", () => {
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

test("the frontend no longer imports Radix UI", () => {
  const violations = globSync("src/**/*.{ts,tsx}")
    .flatMap((file) => {
      const source = readFileSync(file, "utf8");

      return source
        .split("\n")
        .flatMap((line, index) => (line.includes("@radix-ui/") ? [`${file}:${index + 1}`] : []));
    })
    .sort();

  expect(violations).toEqual([]);
});

test("Base UI state selectors do not retain Radix data-state attributes", () => {
  const violations = globSync("src/**/*.{css,ts,tsx}")
    .flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .flatMap((line, index) => (line.includes("data-state") ? [`${file}:${index + 1}`] : [])),
    )
    .sort();

  expect(violations).toEqual([]);
});
