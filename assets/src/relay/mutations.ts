import type { useMutation, UseMutationConfig } from "react-relay";
import type { MutationParameters } from "relay-runtime";

export type RouteMutationCommit<TMutation extends MutationParameters> = ReturnType<
  typeof useMutation<TMutation>
>[0];

export function commitRouteMutation<TMutation extends MutationParameters>(
  commitMutation: RouteMutationCommit<TMutation>,
  config: UseMutationConfig<TMutation>,
  onCommitError: (error: unknown) => void,
) {
  try {
    return commitMutation(config);
  } catch (error) {
    onCommitError(error);
    return null;
  }
}

export function commitRouteMutationPromise<TMutation extends MutationParameters>(
  commitMutation: RouteMutationCommit<TMutation>,
  config: Omit<UseMutationConfig<TMutation>, "onCompleted" | "onError">,
) {
  return new Promise<{
    response: TMutation["response"];
    graphQLErrors: Parameters<NonNullable<UseMutationConfig<TMutation>["onCompleted"]>>[1];
  }>((resolve, reject) => {
    commitRouteMutation(
      commitMutation,
      {
        ...config,
        onCompleted(response, graphQLErrors) {
          resolve({ response, graphQLErrors });
        },
        onError(error) {
          reject(error);
        },
      },
      (error) => {
        reject(error);
      },
    );
  });
}
