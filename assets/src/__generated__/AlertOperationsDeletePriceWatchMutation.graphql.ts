/**
 * @generated SignedSource<<3aada89b2473b8592b7d9ae835143143>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type AlertOperationsDeletePriceWatchMutation$variables = {
  id: string;
};
export type AlertOperationsDeletePriceWatchMutation$data = {
  readonly deletePriceWatch: {
    readonly deletedWatchId: string | null;
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null;
      readonly message: string;
    }>;
  };
};
export type AlertOperationsDeletePriceWatchMutation = {
  response: AlertOperationsDeletePriceWatchMutation$data;
  variables: AlertOperationsDeletePriceWatchMutation$variables;
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
    "name": "AlertOperationsDeletePriceWatchMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "AlertOperationsDeletePriceWatchMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "7ce7dd9bf5777b6a078cacddd007f1a8",
    "id": null,
    "metadata": {},
    "name": "AlertOperationsDeletePriceWatchMutation",
    "operationKind": "mutation",
    "text": "mutation AlertOperationsDeletePriceWatchMutation(\n  $id: ID!\n) {\n  deletePriceWatch(id: $id) {\n    deletedWatchId\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "91cdf0612ae45aa9fa169117f9317be4";

export default node;
