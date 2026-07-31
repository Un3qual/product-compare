/**
 * @generated SignedSource<<bda7eca7e91d0311f4f437f098e28c8f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type alertsMutationsDeletePriceWatchMutation$variables = {
  id: string;
};
export type alertsMutationsDeletePriceWatchMutation$data = {
  readonly deletePriceWatch: {
    readonly deletedWatchId: string | null | undefined;
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
  };
};
export type alertsMutationsDeletePriceWatchMutation = {
  response: alertsMutationsDeletePriceWatchMutation$data;
  variables: alertsMutationsDeletePriceWatchMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "id"
      }
    ],
    "concreteType": "DeletePriceWatchPayload",
    "kind": "LinkedField",
    "name": "deletePriceWatch",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "deletedWatchId",
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
    "name": "alertsMutationsDeletePriceWatchMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "alertsMutationsDeletePriceWatchMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "d4fdfa3e6fc2d24b1440e63c67c5063a",
    "id": null,
    "metadata": {},
    "name": "alertsMutationsDeletePriceWatchMutation",
    "operationKind": "mutation",
    "text": "mutation alertsMutationsDeletePriceWatchMutation(\n  $id: ID!\n) {\n  deletePriceWatch(id: $id) {\n    deletedWatchId\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "3ed89c82186b7e65fd26e3d1cc18b0c4";

export default node;
