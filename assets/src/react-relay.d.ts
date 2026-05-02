declare module "react-relay" {
  import type { ComponentType, ReactNode } from "react";
  import type {
    CacheConfig,
    Environment,
    FetchPolicy,
    GraphQLTaggedNode as RelayGraphQLTaggedNode,
    MutationConfig,
    MutationParameters,
    OperationType
  } from "relay-runtime";

  export type GraphQLTaggedNode = RelayGraphQLTaggedNode;

  export function graphql(
    strings: TemplateStringsArray,
    ...substitutions: unknown[]
  ): GraphQLTaggedNode;

  export interface PreloadedQuery<TQuery extends OperationType> {
    readonly variables: TQuery["variables"];
    dispose(): void;
  }

  export interface LoadQueryOptions {
    fetchPolicy?: FetchPolicy | null;
    networkCacheConfig?: CacheConfig | null;
  }

  export const RelayEnvironmentProvider: ComponentType<{
    children?: ReactNode;
    environment: Environment;
  }>;

  export function loadQuery<TQuery extends OperationType>(
    environment: Environment,
    query: GraphQLTaggedNode,
    variables: TQuery["variables"],
    options?: LoadQueryOptions
  ): PreloadedQuery<TQuery>;

  export function usePreloadedQuery<TQuery extends OperationType>(
    query: GraphQLTaggedNode,
    preloadedQuery: PreloadedQuery<TQuery>
  ): TQuery["response"];

  export interface MutationCommitFn<TMutation extends MutationParameters> {
    (config: Omit<MutationConfig<TMutation>, "mutation">): { dispose(): void };
  }

  export function useMutation<TMutation extends MutationParameters>(
    mutation: GraphQLTaggedNode
  ): [MutationCommitFn<TMutation>, boolean];

  export function useRelayEnvironment(): Environment;
}
