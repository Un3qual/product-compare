import type { MutationCommitFn } from "react-relay";
import { commitRouteMutation, commitRouteMutationPromise } from "../../src/routes/relay-mutations";

type TestMutation = {
  variables: {
    id: string;
  };
  response: {
    ok: boolean;
  };
};

test("commitRouteMutation returns the Relay disposable when commit succeeds", () => {
  const disposable = { dispose: vi.fn() };
  const commitMutation = vi.fn(() => disposable) as unknown as MutationCommitFn<TestMutation>;
  const onCommitError = vi.fn();

  expect(
    commitRouteMutation(
      commitMutation,
      {
        variables: { id: "record-1" },
      },
      onCommitError,
    ),
  ).toBe(disposable);
  expect(onCommitError).not.toHaveBeenCalled();
});

test("commitRouteMutation handles synchronous commit failures", () => {
  const commitError = new Error("commit failed");
  const commitMutation = vi.fn(() => {
    throw commitError;
  }) as unknown as MutationCommitFn<TestMutation>;
  const onCommitError = vi.fn();

  expect(
    commitRouteMutation(
      commitMutation,
      {
        variables: { id: "record-1" },
      },
      onCommitError,
    ),
  ).toBeNull();
  expect(onCommitError).toHaveBeenCalledWith(commitError);
});

test("commitRouteMutationPromise resolves completed Relay responses", async () => {
  const graphQLErrors = [{ message: "GraphQL warning" }];
  const commitMutation = vi.fn((config: Parameters<MutationCommitFn<TestMutation>>[0]) => {
    config.onCompleted?.({ ok: true }, graphQLErrors);
    return { dispose: vi.fn() };
  }) as unknown as MutationCommitFn<TestMutation>;

  await expect(
    commitRouteMutationPromise(commitMutation, {
      variables: { id: "record-1" },
    }),
  ).resolves.toEqual({
    response: { ok: true },
    graphQLErrors,
  });
});

test("commitRouteMutationPromise rejects Relay async failures", async () => {
  const relayError = new Error("Relay failed");
  const commitMutation = vi.fn((config: Parameters<MutationCommitFn<TestMutation>>[0]) => {
    config.onError?.(relayError);
    return { dispose: vi.fn() };
  }) as unknown as MutationCommitFn<TestMutation>;

  await expect(
    commitRouteMutationPromise(commitMutation, {
      variables: { id: "record-1" },
    }),
  ).rejects.toBe(relayError);
});

test("commitRouteMutationPromise rejects synchronous commit failures", async () => {
  const commitError = new Error("commit failed");
  const commitMutation = vi.fn(() => {
    throw commitError;
  }) as unknown as MutationCommitFn<TestMutation>;

  await expect(
    commitRouteMutationPromise(commitMutation, {
      variables: { id: "record-1" },
    }),
  ).rejects.toBe(commitError);
});
