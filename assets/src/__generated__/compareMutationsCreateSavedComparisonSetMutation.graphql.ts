/**
 * @generated SignedSource<<a0fbf947ff23d0784b6df75fdb78ecd5>>
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
export type compareMutationsCreateSavedComparisonSetMutation$variables = {
  input: CreateSavedComparisonSetInput;
};
export type compareMutationsCreateSavedComparisonSetMutation$data = {
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
export type compareMutationsCreateSavedComparisonSetMutation = {
  response: compareMutationsCreateSavedComparisonSetMutation$data;
  variables: compareMutationsCreateSavedComparisonSetMutation$variables;
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
    "name": "compareMutationsCreateSavedComparisonSetMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "compareMutationsCreateSavedComparisonSetMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "6158f1d1a073fbb907422714b44029b4",
    "id": null,
    "metadata": {},
    "name": "compareMutationsCreateSavedComparisonSetMutation",
    "operationKind": "mutation",
    "text": "mutation compareMutationsCreateSavedComparisonSetMutation(\n  $input: CreateSavedComparisonSetInput!\n) {\n  createSavedComparisonSet(input: $input) {\n    savedComparisonSet {\n      id\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "41b948fa136dff156e0abbb9df6ceaaa";

export default node;
