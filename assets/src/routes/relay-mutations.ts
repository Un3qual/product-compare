import type { MutationCommitFn } from "react-relay";
import type { MutationConfig, MutationParameters } from "relay-runtime";

export function commitRouteMutation<TMutation extends MutationParameters>(
  commitMutation: MutationCommitFn<TMutation>,
  config: Omit<MutationConfig<TMutation>, "mutation">,
  onCommitError: (error: unknown) => void
) {
  try {
    return commitMutation(config);
  } catch (error) {
    onCommitError(error);
    return null;
  }
}

export function commitRouteMutationPromise<TMutation extends MutationParameters>(
  commitMutation: MutationCommitFn<TMutation>,
  config: Omit<MutationConfig<TMutation>, "mutation" | "onCompleted" | "onError">
) {
  return new Promise<{
    response: TMutation["response"];
    graphQLErrors: Parameters<NonNullable<MutationConfig<TMutation>["onCompleted"]>>[1];
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
        }
      },
      (error) => {
        reject(error);
      }
    );
  });
}
