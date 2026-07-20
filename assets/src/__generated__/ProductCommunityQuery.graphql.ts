/**
 * @generated SignedSource<<c06de89db333c2798a302ab31b0ed050>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CommunityModerationStatus = "HIDDEN" | "PENDING" | "PUBLISHED" | "REJECTED" | "REMOVED" | "%future added value";
export type ProductCommunityQuery$variables = {
  answerFirst: number;
  questionFirst: number;
  questionsAfter?: string | null | undefined;
  reviewFirst: number;
  reviewsAfter?: string | null | undefined;
  slug: string;
};
export type ProductCommunityQuery$data = {
  readonly product: {
    readonly id: string;
    readonly questions: {
      readonly edges: ReadonlyArray<{
        readonly node: {
          readonly acceptedAnswerId: string | null | undefined;
          readonly answers: {
            readonly edges: ReadonlyArray<{
              readonly node: {
                readonly authorLabel: string;
                readonly body: string;
                readonly id: string;
                readonly moderationStatus: CommunityModerationStatus;
                readonly viewerCanEdit: boolean;
                readonly viewerCanRemove: boolean;
              };
            }>;
            readonly pageInfo: {
              readonly endCursor: string | null | undefined;
              readonly hasNextPage: boolean;
            };
          };
          readonly authorLabel: string;
          readonly body: string | null | undefined;
          readonly id: string;
          readonly moderationStatus: CommunityModerationStatus;
          readonly title: string;
          readonly viewerCanEdit: boolean;
          readonly viewerCanRemove: boolean;
        };
      }>;
      readonly pageInfo: {
        readonly endCursor: string | null | undefined;
        readonly hasNextPage: boolean;
      };
    };
    readonly reviewSummary: {
      readonly averageRating: any | null | undefined;
      readonly count: number;
    };
    readonly reviews: {
      readonly edges: ReadonlyArray<{
        readonly node: {
          readonly authorLabel: string;
          readonly body: string | null | undefined;
          readonly id: string;
          readonly moderationStatus: CommunityModerationStatus;
          readonly rating: number;
          readonly title: string | null | undefined;
          readonly verifiedPurchase: boolean;
          readonly viewerCanEdit: boolean;
          readonly viewerCanRemove: boolean;
        };
      }>;
      readonly pageInfo: {
        readonly endCursor: string | null | undefined;
        readonly hasNextPage: boolean;
      };
    };
    readonly viewerCommunitySubmissions: {
      readonly answers: ReadonlyArray<{
        readonly authorLabel: string;
        readonly body: string;
        readonly id: string;
        readonly moderationStatus: CommunityModerationStatus;
        readonly viewerCanEdit: boolean;
        readonly viewerCanRemove: boolean;
      }>;
      readonly questions: ReadonlyArray<{
        readonly authorLabel: string;
        readonly body: string | null | undefined;
        readonly id: string;
        readonly moderationStatus: CommunityModerationStatus;
        readonly title: string;
        readonly viewerCanEdit: boolean;
        readonly viewerCanRemove: boolean;
      }>;
      readonly reviews: ReadonlyArray<{
        readonly authorLabel: string;
        readonly body: string | null | undefined;
        readonly id: string;
        readonly moderationStatus: CommunityModerationStatus;
        readonly rating: number;
        readonly title: string | null | undefined;
        readonly verifiedPurchase: boolean;
        readonly viewerCanEdit: boolean;
        readonly viewerCanRemove: boolean;
      }>;
    };
  } | null | undefined;
};
export type ProductCommunityQuery = {
  response: ProductCommunityQuery$data;
  variables: ProductCommunityQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "answerFirst"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "questionFirst"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "questionsAfter"
},
v3 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "reviewFirst"
},
v4 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "reviewsAfter"
},
v5 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "slug"
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "body",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "authorLabel",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "moderationStatus",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "viewerCanEdit",
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "viewerCanRemove",
  "storageKey": null
},
v13 = [
  (v6/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "rating",
    "storageKey": null
  },
  (v7/*: any*/),
  (v8/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "verifiedPurchase",
    "storageKey": null
  },
  (v9/*: any*/),
  (v10/*: any*/),
  (v11/*: any*/),
  (v12/*: any*/)
],
v14 = {
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
},
v15 = [
  (v6/*: any*/),
  (v8/*: any*/),
  (v9/*: any*/),
  (v10/*: any*/),
  (v11/*: any*/),
  (v12/*: any*/)
],
v16 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "slug",
        "variableName": "slug"
      }
    ],
    "concreteType": "Product",
    "kind": "LinkedField",
    "name": "product",
    "plural": false,
    "selections": [
      (v6/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "ProductReviewSummary",
        "kind": "LinkedField",
        "name": "reviewSummary",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "count",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "averageRating",
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": [
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
        ],
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
                "selections": (v13/*: any*/),
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          (v14/*: any*/)
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": [
          {
            "kind": "Variable",
            "name": "after",
            "variableName": "questionsAfter"
          },
          {
            "kind": "Variable",
            "name": "first",
            "variableName": "questionFirst"
          }
        ],
        "concreteType": "ProductQuestionConnection",
        "kind": "LinkedField",
        "name": "questions",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "ProductQuestionEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "ProductQuestion",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v6/*: any*/),
                  (v7/*: any*/),
                  (v8/*: any*/),
                  (v9/*: any*/),
                  (v10/*: any*/),
                  (v11/*: any*/),
                  (v12/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "acceptedAnswerId",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": [
                      {
                        "kind": "Variable",
                        "name": "first",
                        "variableName": "answerFirst"
                      }
                    ],
                    "concreteType": "ProductAnswerConnection",
                    "kind": "LinkedField",
                    "name": "answers",
                    "plural": false,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "ProductAnswerEdge",
                        "kind": "LinkedField",
                        "name": "edges",
                        "plural": true,
                        "selections": [
                          {
                            "alias": null,
                            "args": null,
                            "concreteType": "ProductAnswer",
                            "kind": "LinkedField",
                            "name": "node",
                            "plural": false,
                            "selections": (v15/*: any*/),
                            "storageKey": null
                          }
                        ],
                        "storageKey": null
                      },
                      (v14/*: any*/)
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          (v14/*: any*/)
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "ViewerCommunitySubmissions",
        "kind": "LinkedField",
        "name": "viewerCommunitySubmissions",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "ProductReview",
            "kind": "LinkedField",
            "name": "reviews",
            "plural": true,
            "selections": (v13/*: any*/),
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "ProductQuestion",
            "kind": "LinkedField",
            "name": "questions",
            "plural": true,
            "selections": [
              (v6/*: any*/),
              (v7/*: any*/),
              (v8/*: any*/),
              (v9/*: any*/),
              (v10/*: any*/),
              (v11/*: any*/),
              (v12/*: any*/)
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "ProductAnswer",
            "kind": "LinkedField",
            "name": "answers",
            "plural": true,
            "selections": (v15/*: any*/),
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
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/),
      (v3/*: any*/),
      (v4/*: any*/),
      (v5/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "ProductCommunityQuery",
    "selections": (v16/*: any*/),
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v5/*: any*/),
      (v3/*: any*/),
      (v4/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "ProductCommunityQuery",
    "selections": (v16/*: any*/)
  },
  "params": {
    "cacheID": "ee5cf31b6877e6ce5b7869c5651d8111",
    "id": null,
    "metadata": {},
    "name": "ProductCommunityQuery",
    "operationKind": "query",
    "text": "query ProductCommunityQuery(\n  $slug: String!\n  $reviewFirst: Int!\n  $reviewsAfter: String\n  $questionFirst: Int!\n  $questionsAfter: String\n  $answerFirst: Int!\n) {\n  product(slug: $slug) {\n    id\n    reviewSummary {\n      count\n      averageRating\n    }\n    reviews(first: $reviewFirst, after: $reviewsAfter) {\n      edges {\n        node {\n          id\n          rating\n          title\n          body\n          verifiedPurchase\n          authorLabel\n          moderationStatus\n          viewerCanEdit\n          viewerCanRemove\n        }\n      }\n      pageInfo {\n        endCursor\n        hasNextPage\n      }\n    }\n    questions(first: $questionFirst, after: $questionsAfter) {\n      edges {\n        node {\n          id\n          title\n          body\n          authorLabel\n          moderationStatus\n          viewerCanEdit\n          viewerCanRemove\n          acceptedAnswerId\n          answers(first: $answerFirst) {\n            edges {\n              node {\n                id\n                body\n                authorLabel\n                moderationStatus\n                viewerCanEdit\n                viewerCanRemove\n              }\n            }\n            pageInfo {\n              endCursor\n              hasNextPage\n            }\n          }\n        }\n      }\n      pageInfo {\n        endCursor\n        hasNextPage\n      }\n    }\n    viewerCommunitySubmissions {\n      reviews {\n        id\n        rating\n        title\n        body\n        verifiedPurchase\n        authorLabel\n        moderationStatus\n        viewerCanEdit\n        viewerCanRemove\n      }\n      questions {\n        id\n        title\n        body\n        authorLabel\n        moderationStatus\n        viewerCanEdit\n        viewerCanRemove\n      }\n      answers {\n        id\n        body\n        authorLabel\n        moderationStatus\n        viewerCanEdit\n        viewerCanRemove\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "a3c354146c27f2af409789e145856fd3";

export default node;
