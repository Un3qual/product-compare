/**
 * @generated SignedSource<<c6e83b694a559f59d593523ddc3c05fb>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CommunityModerationStatus = "HIDDEN" | "PENDING" | "PUBLISHED" | "REJECTED" | "REMOVED" | "%future added value";
export type UpdateProductAnswerInput = {
  body?: string | null | undefined;
  id: string;
};
export type productMutationsUpdateProductAnswerMutation$variables = {
  input: UpdateProductAnswerInput;
};
export type productMutationsUpdateProductAnswerMutation$data = {
  readonly updateProductAnswer: {
    readonly answer: {
      readonly body: string;
      readonly id: string;
      readonly moderationStatus: CommunityModerationStatus;
    } | null | undefined;
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
  };
};
export type productMutationsUpdateProductAnswerMutation = {
  response: productMutationsUpdateProductAnswerMutation$data;
  variables: productMutationsUpdateProductAnswerMutation$variables;
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
    "name": "productMutationsUpdateProductAnswerMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "productMutationsUpdateProductAnswerMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "2e47a4058f3a53779efda099629236bf",
    "id": null,
    "metadata": {},
    "name": "productMutationsUpdateProductAnswerMutation",
    "operationKind": "mutation",
    "text": "mutation productMutationsUpdateProductAnswerMutation(\n  $input: UpdateProductAnswerInput!\n) {\n  updateProductAnswer(input: $input) {\n    answer {\n      id\n      body\n      moderationStatus\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "e0383dec18bb017788dfaad7b556db90";

export default node;
