import type { MutationConfig, MutationParameters } from "relay-runtime";

export const DEFAULT_MUTATION_ERROR_MESSAGE = "Request failed. Please try again.";
export type MutationGraphQLErrors = Parameters<
  NonNullable<MutationConfig<MutationParameters>["onCompleted"]>
>[1];

export function hasGraphQLErrors(errors: MutationGraphQLErrors) {
  return Boolean(errors?.length);
}

export function mutationErrorMessage<T extends { readonly message: string }>(
  errors: readonly T[],
  graphQLErrors: MutationGraphQLErrors = null,
) {
  if (hasGraphQLErrors(graphQLErrors)) return DEFAULT_MUTATION_ERROR_MESSAGE;
  return errors[0]?.message ?? DEFAULT_MUTATION_ERROR_MESSAGE;
}
