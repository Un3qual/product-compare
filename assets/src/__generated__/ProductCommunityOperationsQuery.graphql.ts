/**
 * @generated SignedSource<<423b827324d4c8be99fe86d9c92d21d7>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ProductCommunityOperationsQuery$variables = {
  answerFirst: number;
  questionFirst: number;
  questionsAfter?: string | null | undefined;
  reviewFirst: number;
  reviewsAfter?: string | null | undefined;
  slug: string;
};
export type ProductCommunityOperationsQuery$data = {
  readonly product: {
    readonly id: string;
    readonly questions: {
      readonly edges: ReadonlyArray<{
        readonly node: {
          readonly acceptedAnswerId: string | null | undefined;
          readonly answers: {
            readonly edges: ReadonlyArray<{
              readonly node: {
                readonly id: string;
                readonly " $fragmentSpreads": FragmentRefs<"ProductCommunityItems_answer">;
              };
            }>;
            readonly pageInfo: {
              readonly endCursor: string | null | undefined;
              readonly hasNextPage: boolean;
            };
          };
          readonly id: string;
          readonly " $fragmentSpreads": FragmentRefs<"ProductCommunityItems_question">;
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
          readonly id: string;
          readonly " $fragmentSpreads": FragmentRefs<"ProductCommunityItems_review">;
        };
      }>;
      readonly pageInfo: {
        readonly endCursor: string | null | undefined;
        readonly hasNextPage: boolean;
      };
    };
    readonly viewerCommunitySubmissions: {
      readonly answers: ReadonlyArray<{
        readonly id: string;
        readonly " $fragmentSpreads": FragmentRefs<"ProductCommunityItems_answer">;
      }>;
      readonly questions: ReadonlyArray<{
        readonly id: string;
        readonly " $fragmentSpreads": FragmentRefs<"ProductCommunityItems_question">;
      }>;
      readonly reviews: ReadonlyArray<{
        readonly id: string;
        readonly " $fragmentSpreads": FragmentRefs<"ProductCommunityItems_review">;
      }>;
    };
  } | null | undefined;
};
export type ProductCommunityOperationsQuery = {
  response: ProductCommunityOperationsQuery$data;
  variables: ProductCommunityOperationsQuery$variables;
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
v6 = [
  {
    "kind": "Variable",
    "name": "slug",
    "variableName": "slug"
  }
],
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v8 = {
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
v9 = [
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
v10 = [
  (v7/*: any*/),
  {
    "args": null,
    "kind": "FragmentSpread",
    "name": "ProductCommunityItems_review"
  }
],
v11 = {
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
v12 = [
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
v13 = {
  "args": null,
  "kind": "FragmentSpread",
  "name": "ProductCommunityItems_question"
},
v14 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "acceptedAnswerId",
  "storageKey": null
},
v15 = [
  {
    "kind": "Variable",
    "name": "first",
    "variableName": "answerFirst"
  }
],
v16 = [
  (v7/*: any*/),
  {
    "args": null,
    "kind": "FragmentSpread",
    "name": "ProductCommunityItems_answer"
  }
],
v17 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
},
v18 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "body",
  "storageKey": null
},
v19 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "authorLabel",
  "storageKey": null
},
v20 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "moderationStatus",
  "storageKey": null
},
v21 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "viewerCanEdit",
  "storageKey": null
},
v22 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "viewerCanRemove",
  "storageKey": null
},
v23 = [
  (v7/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "rating",
    "storageKey": null
  },
  (v17/*: any*/),
  (v18/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "verifiedPurchase",
    "storageKey": null
  },
  (v19/*: any*/),
  (v20/*: any*/),
  (v21/*: any*/),
  (v22/*: any*/)
],
v24 = [
  (v7/*: any*/),
  (v18/*: any*/),
  (v19/*: any*/),
  (v20/*: any*/),
  (v21/*: any*/),
  (v22/*: any*/)
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
    "name": "ProductCommunityOperationsQuery",
    "selections": [
      {
        "alias": null,
        "args": (v6/*: any*/),
        "concreteType": "Product",
        "kind": "LinkedField",
        "name": "product",
        "plural": false,
        "selections": [
          (v7/*: any*/),
          (v8/*: any*/),
          {
            "alias": null,
            "args": (v9/*: any*/),
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
                    "selections": (v10/*: any*/),
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              (v11/*: any*/)
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": (v12/*: any*/),
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
                      (v7/*: any*/),
                      (v13/*: any*/),
                      (v14/*: any*/),
                      {
                        "alias": null,
                        "args": (v15/*: any*/),
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
                                "selections": (v16/*: any*/),
                                "storageKey": null
                              }
                            ],
                            "storageKey": null
                          },
                          (v11/*: any*/)
                        ],
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              (v11/*: any*/)
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
                "selections": (v10/*: any*/),
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
                  (v7/*: any*/),
                  (v13/*: any*/)
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
                "selections": (v16/*: any*/),
                "storageKey": null
              }
            ],
            "storageKey": null
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
      (v5/*: any*/),
      (v3/*: any*/),
      (v4/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "ProductCommunityOperationsQuery",
    "selections": [
      {
        "alias": null,
        "args": (v6/*: any*/),
        "concreteType": "Product",
        "kind": "LinkedField",
        "name": "product",
        "plural": false,
        "selections": [
          (v7/*: any*/),
          (v8/*: any*/),
          {
            "alias": null,
            "args": (v9/*: any*/),
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
                    "selections": (v23/*: any*/),
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              (v11/*: any*/)
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": (v12/*: any*/),
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
                      (v7/*: any*/),
                      (v17/*: any*/),
                      (v18/*: any*/),
                      (v19/*: any*/),
                      (v20/*: any*/),
                      (v21/*: any*/),
                      (v22/*: any*/),
                      (v14/*: any*/),
                      {
                        "alias": null,
                        "args": (v15/*: any*/),
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
                                "selections": (v24/*: any*/),
                                "storageKey": null
                              }
                            ],
                            "storageKey": null
                          },
                          (v11/*: any*/)
                        ],
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              (v11/*: any*/)
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
                "selections": (v23/*: any*/),
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
                  (v7/*: any*/),
                  (v17/*: any*/),
                  (v18/*: any*/),
                  (v19/*: any*/),
                  (v20/*: any*/),
                  (v21/*: any*/),
                  (v22/*: any*/)
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
                "selections": (v24/*: any*/),
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "aed2d901aa0f99504193202455d723b3",
    "id": null,
    "metadata": {},
    "name": "ProductCommunityOperationsQuery",
    "operationKind": "query",
    "text": "query ProductCommunityOperationsQuery(\n  $slug: String!\n  $reviewFirst: Int!\n  $reviewsAfter: String\n  $questionFirst: Int!\n  $questionsAfter: String\n  $answerFirst: Int!\n) {\n  product(slug: $slug) {\n    id\n    reviewSummary {\n      count\n      averageRating\n    }\n    reviews(first: $reviewFirst, after: $reviewsAfter) {\n      edges {\n        node {\n          id\n          ...ProductCommunityItems_review\n        }\n      }\n      pageInfo {\n        endCursor\n        hasNextPage\n      }\n    }\n    questions(first: $questionFirst, after: $questionsAfter) {\n      edges {\n        node {\n          id\n          ...ProductCommunityItems_question\n          acceptedAnswerId\n          answers(first: $answerFirst) {\n            edges {\n              node {\n                id\n                ...ProductCommunityItems_answer\n              }\n            }\n            pageInfo {\n              endCursor\n              hasNextPage\n            }\n          }\n        }\n      }\n      pageInfo {\n        endCursor\n        hasNextPage\n      }\n    }\n    viewerCommunitySubmissions {\n      reviews {\n        id\n        ...ProductCommunityItems_review\n      }\n      questions {\n        id\n        ...ProductCommunityItems_question\n      }\n      answers {\n        id\n        ...ProductCommunityItems_answer\n      }\n    }\n  }\n}\n\nfragment ProductCommunityItems_answer on ProductAnswer {\n  id\n  body\n  authorLabel\n  moderationStatus\n  viewerCanEdit\n  viewerCanRemove\n}\n\nfragment ProductCommunityItems_question on ProductQuestion {\n  id\n  title\n  body\n  authorLabel\n  moderationStatus\n  viewerCanEdit\n  viewerCanRemove\n}\n\nfragment ProductCommunityItems_review on ProductReview {\n  id\n  rating\n  title\n  body\n  verifiedPurchase\n  authorLabel\n  moderationStatus\n  viewerCanEdit\n  viewerCanRemove\n}\n"
  }
};
})();

(node as any).hash = "0da6c52681efb97caae1fe614f37af20";

export default node;
