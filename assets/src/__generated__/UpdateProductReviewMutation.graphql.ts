/**
 * @generated SignedSource<<52985d19cb67466dfaaa7b326a48bd4e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CommunityModerationStatus = "HIDDEN" | "PENDING" | "PUBLISHED" | "REJECTED" | "REMOVED" | "%future added value";
export type UpdateProductReviewInput = {
  body?: string | null | undefined;
  id: string;
  rating?: number | null | undefined;
  title?: string | null | undefined;
};
export type UpdateProductReviewMutation$variables = {
  input: UpdateProductReviewInput;
};
export type UpdateProductReviewMutation$data = {
  readonly updateProductReview: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
    readonly review: {
      readonly id: string;
      readonly moderationStatus: CommunityModerationStatus;
    } | null | undefined;
  };
};
export type UpdateProductReviewMutation = {
  response: UpdateProductReviewMutation$data;
  variables: UpdateProductReviewMutation$variables;
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
    "concreteType": "ProductReviewPayload",
    "kind": "LinkedField",
    "name": "updateProductReview",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "ProductReview",
        "kind": "LinkedField",
        "name": "review",
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
    "name": "UpdateProductReviewMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "UpdateProductReviewMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "0af0b2cac6c36b6393090e2437b5e809",
    "id": null,
    "metadata": {},
    "name": "UpdateProductReviewMutation",
    "operationKind": "mutation",
    "text": "mutation UpdateProductReviewMutation(\n  $input: UpdateProductReviewInput!\n) {\n  updateProductReview(input: $input) {\n    review {\n      id\n      moderationStatus\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "df82581ef1108c3a65892abe9a389db1";

export default node;
