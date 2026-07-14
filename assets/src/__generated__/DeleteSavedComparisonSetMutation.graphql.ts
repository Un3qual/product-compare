/**
 * @generated SignedSource<<cd6ce2f91cd39720451a6c71530ba478>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type DeleteSavedComparisonSetMutation$variables = {
  savedComparisonSetId: string;
};
export type DeleteSavedComparisonSetMutation$data = {
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
export type DeleteSavedComparisonSetMutation = {
  response: DeleteSavedComparisonSetMutation$data;
  variables: DeleteSavedComparisonSetMutation$variables;
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
    "name": "DeleteSavedComparisonSetMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "DeleteSavedComparisonSetMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "6a235d4a528113b79a667a9e63bf4490",
    "id": null,
    "metadata": {},
    "name": "DeleteSavedComparisonSetMutation",
    "operationKind": "mutation",
    "text": "mutation DeleteSavedComparisonSetMutation(\n  $savedComparisonSetId: ID!\n) {\n  deleteSavedComparisonSet(savedComparisonSetId: $savedComparisonSetId) {\n    savedComparisonSet {\n      id\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "899474bb6fb0d9bb3940886e3e9d2c16";

export default node;
