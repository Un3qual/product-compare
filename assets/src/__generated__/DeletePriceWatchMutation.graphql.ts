/**
 * @generated SignedSource<<cecb4d4f76dc8b5e091190d19d978fd5>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type DeletePriceWatchMutation$variables = {
  id: string;
};
export type DeletePriceWatchMutation$data = {
  readonly deletePriceWatch: {
    readonly deletedWatchId: string | null | undefined;
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
  };
};
export type DeletePriceWatchMutation = {
  response: DeletePriceWatchMutation$data;
  variables: DeletePriceWatchMutation$variables;
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
    "name": "DeletePriceWatchMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "DeletePriceWatchMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "8b069be8927f3be3971f4e66e35fe2cd",
    "id": null,
    "metadata": {},
    "name": "DeletePriceWatchMutation",
    "operationKind": "mutation",
    "text": "mutation DeletePriceWatchMutation(\n  $id: ID!\n) {\n  deletePriceWatch(id: $id) {\n    deletedWatchId\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "2b9dc243e4e8bf48d804a7d772e6d73d";

export default node;
