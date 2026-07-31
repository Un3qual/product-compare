/**
 * @generated SignedSource<<fdb4abf8d0dbafb817c125fc6c99aed2>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type compareMutationsDeleteSavedComparisonSetMutation$variables = {
  savedComparisonSetId: string;
};
export type compareMutationsDeleteSavedComparisonSetMutation$data = {
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
export type compareMutationsDeleteSavedComparisonSetMutation = {
  response: compareMutationsDeleteSavedComparisonSetMutation$data;
  variables: compareMutationsDeleteSavedComparisonSetMutation$variables;
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
    "name": "compareMutationsDeleteSavedComparisonSetMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "compareMutationsDeleteSavedComparisonSetMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "153ab1a9af2cb75f27d47edf241a1375",
    "id": null,
    "metadata": {},
    "name": "compareMutationsDeleteSavedComparisonSetMutation",
    "operationKind": "mutation",
    "text": "mutation compareMutationsDeleteSavedComparisonSetMutation(\n  $savedComparisonSetId: ID!\n) {\n  deleteSavedComparisonSet(savedComparisonSetId: $savedComparisonSetId) {\n    savedComparisonSet {\n      id\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "7bf0c1638b19ab74c921a1fc2e369bff";

export default node;
