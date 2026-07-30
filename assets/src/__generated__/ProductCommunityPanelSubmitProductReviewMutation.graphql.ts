/**
 * @generated SignedSource<<5dca78cb9fee4e80266768780eb3ee68>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CommunityModerationStatus = "HIDDEN" | "PENDING" | "PUBLISHED" | "REJECTED" | "REMOVED" | "%future added value";
export type SubmitProductReviewInput = {
  body?: string | null | undefined;
  idempotencyKey?: string | null | undefined;
  merchantProductId?: string | null | undefined;
  productId: string;
  rating: number;
  title?: string | null | undefined;
};
export type ProductCommunityPanelSubmitProductReviewMutation$variables = {
  input: SubmitProductReviewInput;
};
export type ProductCommunityPanelSubmitProductReviewMutation$data = {
  readonly submitProductReview: {
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
export type ProductCommunityPanelSubmitProductReviewMutation = {
  response: ProductCommunityPanelSubmitProductReviewMutation$data;
  variables: ProductCommunityPanelSubmitProductReviewMutation$variables;
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
    "name": "submitProductReview",
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
    "name": "ProductCommunityPanelSubmitProductReviewMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ProductCommunityPanelSubmitProductReviewMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "54a1db3093daf7b3d0cefd4c26b60694",
    "id": null,
    "metadata": {},
    "name": "ProductCommunityPanelSubmitProductReviewMutation",
    "operationKind": "mutation",
    "text": "mutation ProductCommunityPanelSubmitProductReviewMutation(\n  $input: SubmitProductReviewInput!\n) {\n  submitProductReview(input: $input) {\n    review {\n      id\n      moderationStatus\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "629e43ab35edb1fb2230728ad4bf1846";

export default node;
