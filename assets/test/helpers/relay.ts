import type { PreloadedQuery } from "react-relay";
import type { Variables } from "relay-runtime";
import { createRelayEnvironment } from "../../src/relay/environment";

type TestOperation<TVariables extends Variables> = {
  response: never;
  variables: TVariables;
};

const environment = createRelayEnvironment();

export function mockPreloadedQuery<TVariables extends Variables>(variables: TVariables) {
  return {
    kind: "PreloadedQuery",
    environment,
    fetchKey: 0,
    fetchPolicy: "store-or-network",
    name: "TestQuery",
    variables,
    dispose: vi.fn(),
    isDisposed: false,
  } satisfies PreloadedQuery<TestOperation<TVariables>>;
}
