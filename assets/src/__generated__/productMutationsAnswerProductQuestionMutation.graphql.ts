/**
 * @generated SignedSource<<69a9d96e64e6c97000d03013af9fd5f3>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CommunityModerationStatus = "HIDDEN" | "PENDING" | "PUBLISHED" | "REJECTED" | "REMOVED" | "%future added value";
export type AnswerProductQuestionInput = {
  body: string;
  idempotencyKey?: string | null | undefined;
  questionId: string;
};
export type productMutationsAnswerProductQuestionMutation$variables = {
  input: AnswerProductQuestionInput;
};
export type productMutationsAnswerProductQuestionMutation$data = {
  readonly answerProductQuestion: {
    readonly answer: {
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
export type productMutationsAnswerProductQuestionMutation = {
  response: productMutationsAnswerProductQuestionMutation$data;
  variables: productMutationsAnswerProductQuestionMutation$variables;
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
    "name": "answerProductQuestion",
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
    "name": "productMutationsAnswerProductQuestionMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "productMutationsAnswerProductQuestionMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "3c5fd09bcbb11aa2ab03947bd64cca3f",
    "id": null,
    "metadata": {},
    "name": "productMutationsAnswerProductQuestionMutation",
    "operationKind": "mutation",
    "text": "mutation productMutationsAnswerProductQuestionMutation(\n  $input: AnswerProductQuestionInput!\n) {\n  answerProductQuestion(input: $input) {\n    answer {\n      id\n      moderationStatus\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "075e4f0f86bef93c3cffb24781a72891";

export default node;
