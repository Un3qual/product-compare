/**
 * @generated SignedSource<<eaeaa72811f2e06370a0fa524f8e8193>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CommunityModerationStatus = "HIDDEN" | "PENDING" | "PUBLISHED" | "REJECTED" | "REMOVED" | "%future added value";
export type UpdateProductQuestionInput = {
  body?: string | null;
  id: string;
  title?: string | null;
};
export type ProductCommunityOperationsUpdateProductQuestionMutation$variables = {
  input: UpdateProductQuestionInput;
};
export type ProductCommunityOperationsUpdateProductQuestionMutation$data = {
  readonly updateProductQuestion: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null;
      readonly message: string;
    }>;
    readonly question: {
      readonly body: string | null;
      readonly id: string;
      readonly moderationStatus: CommunityModerationStatus;
      readonly title: string;
    } | null;
  };
};
export type ProductCommunityOperationsUpdateProductQuestionMutation = {
  response: ProductCommunityOperationsUpdateProductQuestionMutation$data;
  variables: ProductCommunityOperationsUpdateProductQuestionMutation$variables;
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
            "name": "title",
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
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "ProductCommunityOperationsUpdateProductQuestionMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "ProductCommunityOperationsUpdateProductQuestionMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "74535e4029c94925fb8ae133932cdcb7",
    "id": null,
    "metadata": {},
    "name": "ProductCommunityOperationsUpdateProductQuestionMutation",
    "operationKind": "mutation",
    "text": "mutation ProductCommunityOperationsUpdateProductQuestionMutation(\n  $input: UpdateProductQuestionInput!\n) {\n  updateProductQuestion(input: $input) {\n    question {\n      id\n      title\n      body\n      moderationStatus\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "74f5d793a659464147f0ae269f86a97a";

export default node;
