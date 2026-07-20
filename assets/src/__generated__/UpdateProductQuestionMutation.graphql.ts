/**
 * @generated SignedSource<<f11814b3037c01fb49e900e8fe88d5ed>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CommunityModerationStatus = "HIDDEN" | "PENDING" | "PUBLISHED" | "REJECTED" | "REMOVED" | "%future added value";
export type UpdateProductQuestionInput = {
  body?: string | null | undefined;
  id: string;
  title?: string | null | undefined;
};
export type UpdateProductQuestionMutation$variables = {
  input: UpdateProductQuestionInput;
};
export type UpdateProductQuestionMutation$data = {
  readonly updateProductQuestion: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
    readonly question: {
      readonly id: string;
      readonly moderationStatus: CommunityModerationStatus;
    } | null | undefined;
  };
};
export type UpdateProductQuestionMutation = {
  response: UpdateProductQuestionMutation$data;
  variables: UpdateProductQuestionMutation$variables;
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
    "concreteType": "ProductQuestionPayload",
    "kind": "LinkedField",
    "name": "updateProductQuestion",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "ProductQuestion",
        "kind": "LinkedField",
        "name": "question",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "id",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "moderationStatus",
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
    "name": "UpdateProductQuestionMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "UpdateProductQuestionMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "e8673cf7bde4b2144b5e5c42d42867da",
    "id": null,
    "metadata": {},
    "name": "UpdateProductQuestionMutation",
    "operationKind": "mutation",
    "text": "mutation UpdateProductQuestionMutation(\n  $input: UpdateProductQuestionInput!\n) {\n  updateProductQuestion(input: $input) {\n    question {\n      id\n      moderationStatus\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "4b7498cdd60758e191c275745451eac5";

export default node;
