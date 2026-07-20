/**
 * @generated SignedSource<<f7939b22933948ae066971bb350ee466>>
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
    "cacheID": "41488686fb324056d5854806d194d96f",
    "id": null,
    "metadata": {},
    "name": "UpdateProductAnswerMutation",
    "operationKind": "mutation",
    "text": "mutation UpdateProductAnswerMutation(\n  $input: UpdateProductAnswerInput!\n) {\n  updateProductAnswer(input: $input) {\n    answer {\n      id\n      moderationStatus\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "0d9331677b37fb2e060c8feda02aaf83";

export default node;
