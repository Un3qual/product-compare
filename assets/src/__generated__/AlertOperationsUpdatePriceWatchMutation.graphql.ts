/**
 * @generated SignedSource<<0552706fffd7c45952eddacc7db7058c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdatePriceWatchInput = {
  cooldownSeconds?: number | null;
  enabled?: boolean | null;
  id: string;
  percentageDrop?: string | null;
  targetAmount?: string | null;
};
export type AlertOperationsUpdatePriceWatchMutation$variables = {
  input: UpdatePriceWatchInput;
};
export type AlertOperationsUpdatePriceWatchMutation$data = {
  readonly updatePriceWatch: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null;
      readonly message: string;
    }>;
    readonly watch: {
      readonly enabled: boolean;
      readonly id: string;
    } | null;
  };
};
export type AlertOperationsUpdatePriceWatchMutation = {
  response: AlertOperationsUpdatePriceWatchMutation$data;
  variables: AlertOperationsUpdatePriceWatchMutation$variables;
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
    "name": "AlertOperationsUpdatePriceWatchMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "AlertOperationsUpdatePriceWatchMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "190834ba5852ed2c092feb33a7177f96",
    "id": null,
    "metadata": {},
    "name": "AlertOperationsUpdatePriceWatchMutation",
    "operationKind": "mutation",
    "text": "mutation AlertOperationsUpdatePriceWatchMutation(\n  $input: UpdatePriceWatchInput!\n) {\n  updatePriceWatch(input: $input) {\n    watch {\n      id\n      enabled\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "b916d1e5af0ecfe45ea1c949624cdd62";

export default node;
