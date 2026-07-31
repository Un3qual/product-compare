import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const routesRoot = resolve(process.cwd(), "src/routes");
const authoredExtensions = new Set([".ts", ".tsx"]);

function authoredRouteFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return entry.name === "__generated__" ? [] : authoredRouteFiles(path);
    }

    return authoredExtensions.has(extname(entry.name)) ? [path] : [];
  });
}

function runtimeImporters(operationName: string, files: readonly string[]): string[] {
  const generatedArtifact = `__generated__/${operationName}.graphql`;
  const runtimeImportPattern =
    /import\s+(?!type\b)([\s\S]*?)\s+from\s+["']([^"']+)["'];/g;

  return files.filter((file) => {
    const source = readFileSync(file, "utf8");

    return [...source.matchAll(runtimeImportPattern)].some((match) => {
      const importClause = match[1]?.trim() ?? "";
      const importPath = match[2] ?? "";

      if (importPath.endsWith(generatedArtifact)) {
        return !importClause.startsWith("{");
      }

      return (
        importPath.endsWith(`/${operationName}`) ||
        importPath.endsWith(`/${operationName}.ts`) ||
        importPath.endsWith(`/${operationName}.tsx`)
      );
    });
  });
}

describe("Relay operation ownership", () => {
  it("colocates mutations unless they have multiple runtime owners", () => {
    const files = authoredRouteFiles(routesRoot);
    const operationOnlyMutations = files.flatMap((file) => {
      const source = readFileSync(file, "utf8");
      const operationNames = [
        ...source.matchAll(/graphql`\s*mutation\s+([A-Za-z][A-Za-z0-9_]*)/g)
      ].map((match) => match[1] as string);
      const ownsMutationRuntime = /\b(useMutation|commitMutation)\b/.test(source);

      if (ownsMutationRuntime) {
        return [];
      }

      return operationNames.flatMap((operationName) => {
        const owners = runtimeImporters(
          operationName,
          files.filter((candidate) => candidate !== file)
        );

        return owners.length >= 2
          ? []
          : [
              `${relative(routesRoot, file)} -> ${
                owners.length === 0
                  ? "no runtime owner"
                  : relative(routesRoot, owners[0] as string)
              }`
            ];
      });
    });

    expect(operationOnlyMutations).toEqual([]);
  });
});
