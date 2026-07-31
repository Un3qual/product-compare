/**
 * @generated SignedSource<<2dd918419d5255ec5417e514bb8c76a9>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateSavedComparisonSetInput = {
  name: string;
  productIds: ReadonlyArray<string>;
};
export type SavedComparisonOperationsCreateSavedComparisonSetMutation$variables = {
  input: CreateSavedComparisonSetInput;
};
export type SavedComparisonOperationsCreateSavedComparisonSetMutation$data = {
  readonly createSavedComparisonSet: {
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
export type SavedComparisonOperationsCreateSavedComparisonSetMutation = {
  response: SavedComparisonOperationsCreateSavedComparisonSetMutation$data;
  variables: SavedComparisonOperationsCreateSavedComparisonSetMutation$variables;
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
    "concreteType": "SavedComparisonSetPayload",
    "kind": "LinkedField",
    "name": "createSavedComparisonSet",
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
    "name": "SavedComparisonOperationsCreateSavedComparisonSetMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "SavedComparisonOperationsCreateSavedComparisonSetMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "30e9f64c24a48b0f67223e85bb653ef5",
    "id": null,
    "metadata": {},
    "name": "SavedComparisonOperationsCreateSavedComparisonSetMutation",
    "operationKind": "mutation",
    "text": "mutation SavedComparisonOperationsCreateSavedComparisonSetMutation(\n  $input: CreateSavedComparisonSetInput!\n) {\n  createSavedComparisonSet(input: $input) {\n    savedComparisonSet {\n      id\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "755ae44db86069f66da2e903258476d3";

export default node;
