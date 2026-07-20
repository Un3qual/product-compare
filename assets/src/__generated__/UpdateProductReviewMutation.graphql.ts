/**
 * @generated SignedSource<<f36176763e0e5f92dd37b4ebb5115eff>>
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
      readonly body: string | null | undefined;
      readonly id: string;
      readonly moderationStatus: CommunityModerationStatus;
      readonly rating: number;
      readonly title: string | null | undefined;
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
            "name": "rating",
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
    "cacheID": "8746f4bdf72aadc4a9666246b9e5bcb1",
    "id": null,
    "metadata": {},
    "name": "UpdateProductReviewMutation",
    "operationKind": "mutation",
    "text": "mutation UpdateProductReviewMutation(\n  $input: UpdateProductReviewInput!\n) {\n  updateProductReview(input: $input) {\n    review {\n      id\n      rating\n      title\n      body\n      moderationStatus\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "1814cee04f99faeecbe6941bb2d83ee3";

export default node;
