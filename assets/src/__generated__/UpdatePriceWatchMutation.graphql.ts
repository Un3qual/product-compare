/**
 * @generated SignedSource<<47c59ae57ce1692744c52c8b53e9c802>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdatePriceWatchInput = {
  cooldownSeconds?: number | null | undefined;
  enabled?: boolean | null | undefined;
  id: string;
  percentageDrop?: any | null | undefined;
  targetAmount?: any | null | undefined;
};
export type UpdatePriceWatchMutation$variables = {
  input: UpdatePriceWatchInput;
};
export type UpdatePriceWatchMutation$data = {
  readonly updatePriceWatch: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
    readonly watch: {
      readonly enabled: boolean;
      readonly id: string;
    } | null | undefined;
  };
};
export type UpdatePriceWatchMutation = {
  response: UpdatePriceWatchMutation$data;
  variables: UpdatePriceWatchMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "PriceWatchPayload",
    "kind": "LinkedField",
    "name": "updatePriceWatch",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "PriceWatch",
        "kind": "LinkedField",
        "name": "watch",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "id",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "enabled",
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "MutationError",
        "kind": "LinkedField",
        "name": "errors",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "code",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "field",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "message",
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "UpdatePriceWatchMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "UpdatePriceWatchMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "a3fe0bca1d3a0c37ad24864afed12167",
    "id": null,
    "metadata": {},
    "name": "UpdatePriceWatchMutation",
    "operationKind": "mutation",
    "text": "mutation UpdatePriceWatchMutation(\n  $input: UpdatePriceWatchInput!\n) {\n  updatePriceWatch(input: $input) {\n    watch {\n      id\n      enabled\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "924121b4b17c5693bc8d6e55bbe08c09";

export default node;
