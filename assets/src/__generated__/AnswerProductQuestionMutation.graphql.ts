/**
 * @generated SignedSource<<e24158bc7277657899e88188262d4620>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CommunityModerationStatus = "HIDDEN" | "PENDING" | "PUBLISHED" | "REJECTED" | "%future added value";
export type AnswerProductQuestionInput = {
  body: string;
  questionId: string;
};
export type AnswerProductQuestionMutation$variables = {
  input: AnswerProductQuestionInput;
};
export type AnswerProductQuestionMutation$data = {
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
export type AnswerProductQuestionMutation = {
  response: AnswerProductQuestionMutation$data;
  variables: AnswerProductQuestionMutation$variables;
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
    "name": "AnswerProductQuestionMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "AnswerProductQuestionMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "1d95fa9fc3dd736c29d8d0c6386f24e6",
    "id": null,
    "metadata": {},
    "name": "AnswerProductQuestionMutation",
    "operationKind": "mutation",
    "text": "mutation AnswerProductQuestionMutation(\n  $input: AnswerProductQuestionInput!\n) {\n  answerProductQuestion(input: $input) {\n    answer {\n      id\n      moderationStatus\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "29f6a0ba3b7c1d70c1327a4b60d29f1d";

export default node;
