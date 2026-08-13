import type { PayloadError } from "relay-runtime";

export const DEFAULT_MUTATION_ERROR_MESSAGE = "Request failed. Please try again.";
export type MutationGraphQLErrors = readonly PayloadError[] | null | undefined;

export function hasGraphQLErrors(errors: MutationGraphQLErrors) {
  return Boolean(errors?.length);
}

export function mutationErrorMessage<T extends { readonly message: string }>(
  errors: readonly T[] | null | undefined,
  graphQLErrors: MutationGraphQLErrors = undefined,
) {
  if (hasGraphQLErrors(graphQLErrors)) return DEFAULT_MUTATION_ERROR_MESSAGE;
  return errors?.[0]?.message ?? DEFAULT_MUTATION_ERROR_MESSAGE;
}
