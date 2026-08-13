/**
 * @generated SignedSource<<167ff8fd15e3e0fa8162d2c2104465e9>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type SavedComparisonSetListDeleteSavedComparisonSetMutation$variables = {
  savedComparisonSetId: string;
};
export type SavedComparisonSetListDeleteSavedComparisonSetMutation$data = {
  readonly deleteSavedComparisonSet: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null;
      readonly message: string;
    }>;
    readonly savedComparisonSet: {
      readonly id: string;
    } | null;
  };
};
export type SavedComparisonSetListDeleteSavedComparisonSetMutation = {
  response: SavedComparisonSetListDeleteSavedComparisonSetMutation$data;
  variables: SavedComparisonSetListDeleteSavedComparisonSetMutation$variables;
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
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "SavedComparisonSetListDeleteSavedComparisonSetMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "SavedComparisonSetListDeleteSavedComparisonSetMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "00ad523b64b325838e4be1a3be74a3d7",
    "id": null,
    "metadata": {},
    "name": "SavedComparisonSetListDeleteSavedComparisonSetMutation",
    "operationKind": "mutation",
    "text": "mutation SavedComparisonSetListDeleteSavedComparisonSetMutation(\n  $savedComparisonSetId: ID!\n) {\n  deleteSavedComparisonSet(savedComparisonSetId: $savedComparisonSetId) {\n    savedComparisonSet {\n      id\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "c9a104fb4789b122f17c8d9fd677c458";

export default node;
