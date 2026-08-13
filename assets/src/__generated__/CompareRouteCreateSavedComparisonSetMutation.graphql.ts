/**
 * @generated SignedSource<<e03dd9183327c1342569876e5ecaf9e0>>
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
export type CompareRouteCreateSavedComparisonSetMutation$variables = {
  input: CreateSavedComparisonSetInput;
};
export type CompareRouteCreateSavedComparisonSetMutation$data = {
  readonly createSavedComparisonSet: {
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
export type CompareRouteCreateSavedComparisonSetMutation = {
  response: CompareRouteCreateSavedComparisonSetMutation$data;
  variables: CompareRouteCreateSavedComparisonSetMutation$variables;
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
    "name": "CompareRouteCreateSavedComparisonSetMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CompareRouteCreateSavedComparisonSetMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "9186b19ed6208d6b6b59f34ad1d1c492",
    "id": null,
    "metadata": {},
    "name": "CompareRouteCreateSavedComparisonSetMutation",
    "operationKind": "mutation",
    "text": "mutation CompareRouteCreateSavedComparisonSetMutation(\n  $input: CreateSavedComparisonSetInput!\n) {\n  createSavedComparisonSet(input: $input) {\n    savedComparisonSet {\n      id\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "a13f1b1f64a9e1d9f4a1ef4f4e334f0d";

export default node;
