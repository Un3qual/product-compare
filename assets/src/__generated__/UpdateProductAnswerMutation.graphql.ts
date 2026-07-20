/**
 * @generated SignedSource<<8b8958adfac28d30e9544ea9067efec3>>
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
export type UpdateProductAnswerMutation$variables = {
  input: UpdateProductAnswerInput;
};
export type UpdateProductAnswerMutation$data = {
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
export type UpdateProductAnswerMutation = {
  response: UpdateProductAnswerMutation$data;
  variables: UpdateProductAnswerMutation$variables;
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
    "name": "UpdateProductAnswerMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "UpdateProductAnswerMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "1f431cf2e70ffd61b11ea271517de841",
    "id": null,
    "metadata": {},
    "name": "UpdateProductAnswerMutation",
    "operationKind": "mutation",
    "text": "mutation UpdateProductAnswerMutation(\n  $input: UpdateProductAnswerInput!\n) {\n  updateProductAnswer(input: $input) {\n    answer {\n      id\n      body\n      moderationStatus\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "6d9241f56047f037018c044abb0886fc";

export default node;
