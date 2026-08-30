/**
 * @generated SignedSource<<2d25c091ac50f645d4ac261312a7431a>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ProductCommunityReviewsPaginationQuery$variables = {
  id: string;
  reviewFirst: number;
  reviewsAfter?: string | null;
};
export type ProductCommunityReviewsPaginationQuery$data = {
  readonly node: {
    readonly " $fragmentSpreads": FragmentRefs<"ProductCommunityPanel_reviews">;
  } | null;
};
export type ProductCommunityReviewsPaginationQuery = {
  response: ProductCommunityReviewsPaginationQuery$data;
  variables: ProductCommunityReviewsPaginationQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "id"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "reviewFirst"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "reviewsAfter"
},
v3 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "id"
  }
],
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v6 = [
  {
    "kind": "Variable",
    "name": "after",
    "variableName": "reviewsAfter"
  },
  {
    "kind": "Variable",
    "name": "first",
    "variableName": "reviewFirst"
  }
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*:: as any*/),
      (v1/*:: as any*/),
      (v2/*:: as any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "ProductCommunityReviewsPaginationQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*:: as any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "node",
        "plural": false,
        "selections": [
          {
            "args": [
              {
                "kind": "Variable",
                "name": "reviewFirst",
                "variableName": "reviewFirst"
              },
              {
                "kind": "Variable",
                "name": "reviewsAfter",
                "variableName": "reviewsAfter"
              }
            ],
            "kind": "FragmentSpread",
            "name": "ProductCommunityPanel_reviews"
          }
        ],
        "storageKey": null
      }
    ],
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*:: as any*/),
      (v2/*:: as any*/),
      (v0/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "ProductCommunityReviewsPaginationQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*:: as any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "node",
        "plural": false,
        "selections": [
          (v4/*:: as any*/),
          (v5/*:: as any*/),
          {
            "kind": "InlineFragment",
            "selections": [
              {
                "alias": null,
                "args": (v6/*:: as any*/),
                "concreteType": "ProductReviewConnection",
                "kind": "LinkedField",
                "name": "reviews",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "ProductReviewEdge",
                    "kind": "LinkedField",
                    "name": "edges",
                    "plural": true,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "ProductReview",
                        "kind": "LinkedField",
                        "name": "node",
                        "plural": false,
                        "selections": [
                          (v5/*:: as any*/),
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
                            "name": "verifiedPurchase",
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "authorLabel",
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "moderationStatus",
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "viewerCanEdit",
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "viewerCanRemove",
                            "storageKey": null
                          },
                          (v4/*:: as any*/)
                        ],
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "cursor",
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "PageInfo",
                    "kind": "LinkedField",
                    "name": "pageInfo",
                    "plural": false,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "endCursor",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "hasNextPage",
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": (v6/*:: as any*/),
                "filters": null,
                "handle": "connection",
                "key": "ProductCommunityPanel_reviews",
                "kind": "LinkedHandle",
                "name": "reviews"
              }
            ],
            "type": "Product",
            "abstractKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "7398717917fe9491e0e128e60a97d20c",
    "id": null,
    "metadata": {},
    "name": "ProductCommunityReviewsPaginationQuery",
    "operationKind": "query",
    "text": "query ProductCommunityReviewsPaginationQuery(\n  $reviewFirst: Int!\n  $reviewsAfter: String\n  $id: ID!\n) {\n  node(id: $id) {\n    __typename\n    ...ProductCommunityPanel_reviews_48YXwb\n    id\n  }\n}\n\nfragment ProductCommunityItems_review on ProductReview {\n  id\n  rating\n  title\n  body\n  verifiedPurchase\n  authorLabel\n  moderationStatus\n  viewerCanEdit\n  viewerCanRemove\n}\n\nfragment ProductCommunityPanel_reviews_48YXwb on Product {\n  reviews(first: $reviewFirst, after: $reviewsAfter) {\n    edges {\n      node {\n        id\n        ...ProductCommunityItems_review\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n  id\n}\n"
  }
};
})();

(node as any).hash = "a35c4c07997ad17830ad0cccf40a3936";

export default node;
