/**
 * @generated SignedSource<<5c15c3bc10e891d0b14fb01f6d58c959>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CommunityModerationStatus = "HIDDEN" | "PENDING" | "PUBLISHED" | "REJECTED" | "REMOVED" | "%future added value";
export type UpdateProductAnswerInput = {
  body?: string | null;
  id: string;
};
export type ProductCommunityOperationsUpdateProductAnswerMutation$variables = {
  input: UpdateProductAnswerInput;
};
export type ProductCommunityOperationsUpdateProductAnswerMutation$data = {
  readonly updateProductAnswer: {
    readonly answer: {
      readonly body: string;
      readonly id: string;
      readonly moderationStatus: CommunityModerationStatus;
    } | null;
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null;
      readonly message: string;
    }>;
  };
};
export type ProductCommunityOperationsUpdateProductAnswerMutation = {
  response: ProductCommunityOperationsUpdateProductAnswerMutation$data;
  variables: ProductCommunityOperationsUpdateProductAnswerMutation$variables;
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
    "concreteType": "ProductAnswerPayload",
    "kind": "LinkedField",
    "name": "updateProductAnswer",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "ProductAnswer",
        "kind": "LinkedField",
        "name": "answer",
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
            "name": "body",
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
    "name": "ProductCommunityOperationsUpdateProductAnswerMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ProductCommunityOperationsUpdateProductAnswerMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "306814bbe9b2039f54f1e92b802f17fc",
    "id": null,
    "metadata": {},
    "name": "ProductCommunityOperationsUpdateProductAnswerMutation",
    "operationKind": "mutation",
    "text": "mutation ProductCommunityOperationsUpdateProductAnswerMutation(\n  $input: UpdateProductAnswerInput!\n) {\n  updateProductAnswer(input: $input) {\n    answer {\n      id\n      body\n      moderationStatus\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "8c025003bc87a41456e90abc31cd5507";

export default node;
