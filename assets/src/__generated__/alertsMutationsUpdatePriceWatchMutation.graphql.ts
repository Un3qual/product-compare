/**
 * @generated SignedSource<<93ec0eb081fc9667fc86ff78f6cee743>>
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
export type alertsMutationsUpdatePriceWatchMutation$variables = {
  input: UpdatePriceWatchInput;
};
export type alertsMutationsUpdatePriceWatchMutation$data = {
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
export type alertsMutationsUpdatePriceWatchMutation = {
  response: alertsMutationsUpdatePriceWatchMutation$data;
  variables: alertsMutationsUpdatePriceWatchMutation$variables;
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
    "name": "alertsMutationsUpdatePriceWatchMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "alertsMutationsUpdatePriceWatchMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "82c3edc32f191936ff7cc27d6e46a628",
    "id": null,
    "metadata": {},
    "name": "alertsMutationsUpdatePriceWatchMutation",
    "operationKind": "mutation",
    "text": "mutation alertsMutationsUpdatePriceWatchMutation(\n  $input: UpdatePriceWatchInput!\n) {\n  updatePriceWatch(input: $input) {\n    watch {\n      id\n      enabled\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "b5b7c7d4492185a6d613fae60cda4204";

export default node;
