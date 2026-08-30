/**
 * @generated SignedSource<<2911ddaae6bc17641e937bb6bd67aca8>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ProductCommunityOperationsQuery$variables = {
  answerFirst: number;
  questionFirst: number;
  questionsAfter?: string | null;
  reviewFirst: number;
  reviewsAfter?: string | null;
  slug: string;
};
export type ProductCommunityOperationsQuery$data = {
  readonly product: {
    readonly id: string;
    readonly reviewSummary: {
      readonly averageRating: string | null;
      readonly count: number;
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
    readonly " $fragmentSpreads": FragmentRefs<"ProductCommunityPanel_questions" | "ProductCommunityPanel_reviews">;
  } | null;
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
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "rating",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "body",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "verifiedPurchase",
  "storageKey": null
},
v14 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "authorLabel",
  "storageKey": null
},
v15 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "moderationStatus",
  "storageKey": null
},
v16 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "viewerCanEdit",
  "storageKey": null
},
v17 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "viewerCanRemove",
  "storageKey": null
},
v18 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
v19 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cursor",
  "storageKey": null
},
v20 = {
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
v21 = [
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
v22 = [
  {
    "kind": "Variable",
    "name": "first",
    "variableName": "answerFirst"
  }
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*:: as any*/),
      (v1/*:: as any*/),
      (v2/*:: as any*/),
      (v3/*:: as any*/),
      (v4/*:: as any*/),
      (v5/*:: as any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "ProductCommunityOperationsQuery",
    "selections": [
      {
        "alias": null,
        "args": (v6/*:: as any*/),
        "concreteType": "Product",
        "kind": "LinkedField",
        "name": "product",
        "plural": false,
        "selections": [
          (v7/*:: as any*/),
          (v8/*:: as any*/),
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
          },
          {
            "args": [
              {
                "kind": "Variable",
                "name": "answerFirst",
                "variableName": "answerFirst"
              },
              {
                "kind": "Variable",
                "name": "questionFirst",
                "variableName": "questionFirst"
              },
              {
                "kind": "Variable",
                "name": "questionsAfter",
                "variableName": "questionsAfter"
              }
            ],
            "kind": "FragmentSpread",
            "name": "ProductCommunityPanel_questions"
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
                "selections": [
                  (v7/*:: as any*/),
                  {
                    "args": null,
                    "kind": "FragmentSpread",
                    "name": "ProductCommunityItems_review"
                  }
                ],
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
                  (v7/*:: as any*/),
                  {
                    "args": null,
                    "kind": "FragmentSpread",
                    "name": "ProductCommunityItems_question"
                  }
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
                "selections": [
                  (v7/*:: as any*/),
                  {
                    "args": null,
                    "kind": "FragmentSpread",
                    "name": "ProductCommunityItems_answer"
                  }
                ],
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
      (v5/*:: as any*/),
      (v3/*:: as any*/),
      (v4/*:: as any*/),
      (v1/*:: as any*/),
      (v2/*:: as any*/),
      (v0/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "ProductCommunityOperationsQuery",
    "selections": [
      {
        "alias": null,
        "args": (v6/*:: as any*/),
        "concreteType": "Product",
        "kind": "LinkedField",
        "name": "product",
        "plural": false,
        "selections": [
          (v7/*:: as any*/),
          (v8/*:: as any*/),
          {
            "alias": null,
            "args": (v9/*:: as any*/),
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
                      (v7/*:: as any*/),
                      (v10/*:: as any*/),
                      (v11/*:: as any*/),
                      (v12/*:: as any*/),
                      (v13/*:: as any*/),
                      (v14/*:: as any*/),
                      (v15/*:: as any*/),
                      (v16/*:: as any*/),
                      (v17/*:: as any*/),
                      (v18/*:: as any*/)
                    ],
                    "storageKey": null
                  },
                  (v19/*:: as any*/)
                ],
                "storageKey": null
              },
              (v20/*:: as any*/)
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": (v9/*:: as any*/),
            "filters": null,
            "handle": "connection",
            "key": "ProductCommunityPanel_reviews",
            "kind": "LinkedHandle",
            "name": "reviews"
          },
          {
            "alias": null,
            "args": (v21/*:: as any*/),
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
                      (v7/*:: as any*/),
                      (v11/*:: as any*/),
                      (v12/*:: as any*/),
                      (v14/*:: as any*/),
                      (v15/*:: as any*/),
                      (v16/*:: as any*/),
                      (v17/*:: as any*/),
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "acceptedAnswerId",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": (v22/*:: as any*/),
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
                                "selections": [
                                  (v7/*:: as any*/),
                                  (v12/*:: as any*/),
                                  (v14/*:: as any*/),
                                  (v15/*:: as any*/),
                                  (v16/*:: as any*/),
                                  (v17/*:: as any*/),
                                  (v18/*:: as any*/)
                                ],
                                "storageKey": null
                              },
                              (v19/*:: as any*/)
                            ],
                            "storageKey": null
                          },
                          (v20/*:: as any*/)
                        ],
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": (v22/*:: as any*/),
                        "filters": null,
                        "handle": "connection",
                        "key": "CommunityQuestionAnswers_answers",
                        "kind": "LinkedHandle",
                        "name": "answers"
                      },
                      (v18/*:: as any*/)
                    ],
                    "storageKey": null
                  },
                  (v19/*:: as any*/)
                ],
                "storageKey": null
              },
              (v20/*:: as any*/)
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": (v21/*:: as any*/),
            "filters": null,
            "handle": "connection",
            "key": "ProductCommunityPanel_questions",
            "kind": "LinkedHandle",
            "name": "questions"
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
                "selections": [
                  (v7/*:: as any*/),
                  (v10/*:: as any*/),
                  (v11/*:: as any*/),
                  (v12/*:: as any*/),
                  (v13/*:: as any*/),
                  (v14/*:: as any*/),
                  (v15/*:: as any*/),
                  (v16/*:: as any*/),
                  (v17/*:: as any*/)
                ],
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
                  (v7/*:: as any*/),
                  (v11/*:: as any*/),
                  (v12/*:: as any*/),
                  (v14/*:: as any*/),
                  (v15/*:: as any*/),
                  (v16/*:: as any*/),
                  (v17/*:: as any*/)
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
                "selections": [
                  (v7/*:: as any*/),
                  (v12/*:: as any*/),
                  (v14/*:: as any*/),
                  (v15/*:: as any*/),
                  (v16/*:: as any*/),
                  (v17/*:: as any*/)
                ],
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
    "cacheID": "8db3ca8d78e54112b79e0e4bf5b4b75e",
    "id": null,
    "metadata": {},
    "name": "ProductCommunityOperationsQuery",
    "operationKind": "query",
    "text": "query ProductCommunityOperationsQuery(\n  $slug: String!\n  $reviewFirst: Int!\n  $reviewsAfter: String\n  $questionFirst: Int!\n  $questionsAfter: String\n  $answerFirst: Int!\n) {\n  product(slug: $slug) {\n    id\n    reviewSummary {\n      count\n      averageRating\n    }\n    ...ProductCommunityPanel_reviews_48YXwb\n    ...ProductCommunityPanel_questions_4dO3Lg\n    viewerCommunitySubmissions {\n      reviews {\n        id\n        ...ProductCommunityItems_review\n      }\n      questions {\n        id\n        ...ProductCommunityItems_question\n      }\n      answers {\n        id\n        ...ProductCommunityItems_answer\n      }\n    }\n  }\n}\n\nfragment CommunityQuestionAnswers_question_2KK7X7 on ProductQuestion {\n  id\n  acceptedAnswerId\n  answers(first: $answerFirst) {\n    edges {\n      node {\n        id\n        ...ProductCommunityItems_answer\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n\nfragment ProductCommunityItems_answer on ProductAnswer {\n  id\n  body\n  authorLabel\n  moderationStatus\n  viewerCanEdit\n  viewerCanRemove\n}\n\nfragment ProductCommunityItems_question on ProductQuestion {\n  id\n  title\n  body\n  authorLabel\n  moderationStatus\n  viewerCanEdit\n  viewerCanRemove\n}\n\nfragment ProductCommunityItems_review on ProductReview {\n  id\n  rating\n  title\n  body\n  verifiedPurchase\n  authorLabel\n  moderationStatus\n  viewerCanEdit\n  viewerCanRemove\n}\n\nfragment ProductCommunityPanel_questions_4dO3Lg on Product {\n  questions(first: $questionFirst, after: $questionsAfter) {\n    edges {\n      node {\n        id\n        ...ProductCommunityItems_question\n        ...CommunityQuestionAnswers_question_2KK7X7\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n  id\n}\n\nfragment ProductCommunityPanel_reviews_48YXwb on Product {\n  reviews(first: $reviewFirst, after: $reviewsAfter) {\n    edges {\n      node {\n        id\n        ...ProductCommunityItems_review\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n  id\n}\n"
  }
};
})();

(node as any).hash = "47e9dd73d04e1dd0e5a181fcfb0dffef";

export default node;
