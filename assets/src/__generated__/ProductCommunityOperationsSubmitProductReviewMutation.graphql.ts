/**
 * @generated SignedSource<<e29f2aad1b9302bf445fdbe9b6a55d76>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CommunityModerationStatus = "HIDDEN" | "PENDING" | "PUBLISHED" | "REJECTED" | "REMOVED" | "%future added value";
export type SubmitProductReviewInput = {
  body?: string | null;
  idempotencyKey?: string | null;
  merchantProductId?: string | null;
  productId: string;
  rating: number;
  title?: string | null;
};
export type ProductCommunityOperationsSubmitProductReviewMutation$variables = {
  input: SubmitProductReviewInput;
};
export type ProductCommunityOperationsSubmitProductReviewMutation$data = {
  readonly submitProductReview: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null;
      readonly message: string;
    }>;
    readonly review: {
      readonly id: string;
      readonly moderationStatus: CommunityModerationStatus;
    } | null;
  };
};
export type ProductCommunityOperationsSubmitProductReviewMutation = {
  response: ProductCommunityOperationsSubmitProductReviewMutation$data;
  variables: ProductCommunityOperationsSubmitProductReviewMutation$variables;
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
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "ProductCommunityOperationsSubmitProductReviewMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "ProductCommunityOperationsSubmitProductReviewMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "83758df74d3288a5ffdf9577d21550d9",
    "id": null,
    "metadata": {},
    "name": "ProductCommunityOperationsSubmitProductReviewMutation",
    "operationKind": "mutation",
    "text": "mutation ProductCommunityOperationsSubmitProductReviewMutation(\n  $input: SubmitProductReviewInput!\n) {\n  submitProductReview(input: $input) {\n    review {\n      id\n      moderationStatus\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "ab487ff3109e1bcdc77e6e75b76f5197";

export default node;
