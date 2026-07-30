/**
 * @generated SignedSource<<11096ca019ea6ce064cd35be8830052e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CommunityModerationStatus = "HIDDEN" | "PENDING" | "PUBLISHED" | "REJECTED" | "REMOVED" | "%future added value";
export type AskProductQuestionInput = {
  body?: string | null | undefined;
  idempotencyKey?: string | null | undefined;
  productId: string;
  title: string;
};
export type ProductCommunityPanelAskProductQuestionMutation$variables = {
  input: AskProductQuestionInput;
};
export type ProductCommunityPanelAskProductQuestionMutation$data = {
  readonly askProductQuestion: {
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
export type ProductCommunityPanelAskProductQuestionMutation = {
  response: ProductCommunityPanelAskProductQuestionMutation$data;
  variables: ProductCommunityPanelAskProductQuestionMutation$variables;
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
    "name": "askProductQuestion",
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
    "name": "ProductCommunityPanelAskProductQuestionMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ProductCommunityPanelAskProductQuestionMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "4890a9e0512b99c43485095e2ada27fe",
    "id": null,
    "metadata": {},
    "name": "ProductCommunityPanelAskProductQuestionMutation",
    "operationKind": "mutation",
    "text": "mutation ProductCommunityPanelAskProductQuestionMutation(\n  $input: AskProductQuestionInput!\n) {\n  askProductQuestion(input: $input) {\n    question {\n      id\n      moderationStatus\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "83b6756a357d9ee9da97d1d30dcb4936";

export default node;
