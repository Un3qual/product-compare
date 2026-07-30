/**
 * @generated SignedSource<<50ede97704d4a6f0286c05f890094d47>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type SavedComparisonsRouteDeleteSavedComparisonSetMutation$variables = {
  savedComparisonSetId: string;
};
export type SavedComparisonsRouteDeleteSavedComparisonSetMutation$data = {
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
export type SavedComparisonsRouteDeleteSavedComparisonSetMutation = {
  response: SavedComparisonsRouteDeleteSavedComparisonSetMutation$data;
  variables: SavedComparisonsRouteDeleteSavedComparisonSetMutation$variables;
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
    "name": "SavedComparisonsRouteDeleteSavedComparisonSetMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "SavedComparisonsRouteDeleteSavedComparisonSetMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "6433a6e577d1032155b97159d963f5d7",
    "id": null,
    "metadata": {},
    "name": "SavedComparisonsRouteDeleteSavedComparisonSetMutation",
    "operationKind": "mutation",
    "text": "mutation SavedComparisonsRouteDeleteSavedComparisonSetMutation(\n  $savedComparisonSetId: ID!\n) {\n  deleteSavedComparisonSet(savedComparisonSetId: $savedComparisonSetId) {\n    savedComparisonSet {\n      id\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "e1056ac2d17ea51c74305ff4b4676658";

export default node;
