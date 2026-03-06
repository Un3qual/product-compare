import { fetchGraphQL } from "../fetch-graphql";

test("sends credentials for session auth", async () => {
  const originalFetch = globalThis.fetch;
  const calls: unknown[][] = [];

  globalThis.fetch = (async (...args: unknown[]) => {
    calls.push(args);
    return {
      ok: true,
      json: async () => ({ data: {} })
    } as Response;
  }) as typeof fetch;

  await fetchGraphQL("query Viewer { viewer { id } }", {});

  expect(String(calls[0][0])).toContain("/api/graphql");
  expect((calls[0][1] as RequestInit).credentials).toBe("include");

  globalThis.fetch = originalFetch;
});
