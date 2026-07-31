/**
 * @generated SignedSource<<c5b728c196b623e6c066c959a7b60576>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type SavedComparisonOperationsDeleteSavedComparisonSetMutation$variables = {
  savedComparisonSetId: string;
};
export type SavedComparisonOperationsDeleteSavedComparisonSetMutation$data = {
  readonly deleteSavedComparisonSet: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
    readonly savedComparisonSet: {
      readonly id: string;
    } | null | undefined;
  };
};
export type SavedComparisonOperationsDeleteSavedComparisonSetMutation = {
  response: SavedComparisonOperationsDeleteSavedComparisonSetMutation$data;
  variables: SavedComparisonOperationsDeleteSavedComparisonSetMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "savedComparisonSetId"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "savedComparisonSetId",
        "variableName": "savedComparisonSetId"
      }
    ],
    "concreteType": "SavedComparisonSetPayload",
    "kind": "LinkedField",
    "name": "deleteSavedComparisonSet",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "SavedComparisonSet",
        "kind": "LinkedField",
        "name": "savedComparisonSet",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "id",
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
    "name": "SavedComparisonOperationsDeleteSavedComparisonSetMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "SavedComparisonOperationsDeleteSavedComparisonSetMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "eac21b7dcb6749b97c7fd7fd9ff683cf",
    "id": null,
    "metadata": {},
    "name": "SavedComparisonOperationsDeleteSavedComparisonSetMutation",
    "operationKind": "mutation",
    "text": "mutation SavedComparisonOperationsDeleteSavedComparisonSetMutation(\n  $savedComparisonSetId: ID!\n) {\n  deleteSavedComparisonSet(savedComparisonSetId: $savedComparisonSetId) {\n    savedComparisonSet {\n      id\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "9ccc02ccf89c5af9d03dcdcad727897f";

export default node;
