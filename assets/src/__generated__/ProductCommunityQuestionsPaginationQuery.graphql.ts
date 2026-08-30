/**
 * @generated SignedSource<<c88278d775abbe07c9c22ae30ce8f4f6>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ProductCommunityQuestionsPaginationQuery$variables = {
  answerFirst: number;
  id: string;
  questionFirst: number;
  questionsAfter?: string | null;
};
export type ProductCommunityQuestionsPaginationQuery$data = {
  readonly node: {
    readonly " $fragmentSpreads": FragmentRefs<"ProductCommunityPanel_questions">;
  } | null;
};
export type ProductCommunityQuestionsPaginationQuery = {
  response: ProductCommunityQuestionsPaginationQuery$data;
  variables: ProductCommunityQuestionsPaginationQuery$variables;
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
  "name": "id"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "questionFirst"
},
v3 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "questionsAfter"
},
v4 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "id"
  }
],
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v7 = [
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
  {
    "kind": "Variable",
    "name": "first",
    "variableName": "answerFirst"
  }
],
v14 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cursor",
  "storageKey": null
},
v15 = {
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
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*:: as any*/),
      (v1/*:: as any*/),
      (v2/*:: as any*/),
      (v3/*:: as any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "ProductCommunityQuestionsPaginationQuery",
    "selections": [
      {
        "alias": null,
        "args": (v4/*:: as any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "node",
        "plural": false,
        "selections": [
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
      (v0/*:: as any*/),
      (v2/*:: as any*/),
      (v3/*:: as any*/),
      (v1/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "ProductCommunityQuestionsPaginationQuery",
    "selections": [
      {
        "alias": null,
        "args": (v4/*:: as any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "node",
        "plural": false,
        "selections": [
          (v5/*:: as any*/),
          (v6/*:: as any*/),
          {
            "kind": "InlineFragment",
            "selections": [
              {
                "alias": null,
                "args": (v7/*:: as any*/),
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
                          (v6/*:: as any*/),
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "title",
                            "storageKey": null
                          },
                          (v8/*:: as any*/),
                          (v9/*:: as any*/),
                          (v10/*:: as any*/),
                          (v11/*:: as any*/),
                          (v12/*:: as any*/),
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "acceptedAnswerId",
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": (v13/*:: as any*/),
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
                                      (v6/*:: as any*/),
                                      (v8/*:: as any*/),
                                      (v9/*:: as any*/),
                                      (v10/*:: as any*/),
                                      (v11/*:: as any*/),
                                      (v12/*:: as any*/),
                                      (v5/*:: as any*/)
                                    ],
                                    "storageKey": null
                                  },
                                  (v14/*:: as any*/)
                                ],
                                "storageKey": null
                              },
                              (v15/*:: as any*/)
                            ],
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": (v13/*:: as any*/),
                            "filters": null,
                            "handle": "connection",
                            "key": "CommunityQuestionAnswers_answers",
                            "kind": "LinkedHandle",
                            "name": "answers"
                          },
                          (v5/*:: as any*/)
                        ],
                        "storageKey": null
                      },
                      (v14/*:: as any*/)
                    ],
                    "storageKey": null
                  },
                  (v15/*:: as any*/)
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": (v7/*:: as any*/),
                "filters": null,
                "handle": "connection",
                "key": "ProductCommunityPanel_questions",
                "kind": "LinkedHandle",
                "name": "questions"
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
    "cacheID": "c9a1eed9670587156df85af688fbfc0b",
    "id": null,
    "metadata": {},
    "name": "ProductCommunityQuestionsPaginationQuery",
    "operationKind": "query",
    "text": "query ProductCommunityQuestionsPaginationQuery(\n  $answerFirst: Int!\n  $questionFirst: Int!\n  $questionsAfter: String\n  $id: ID!\n) {\n  node(id: $id) {\n    __typename\n    ...ProductCommunityPanel_questions_4dO3Lg\n    id\n  }\n}\n\nfragment CommunityQuestionAnswers_question_2KK7X7 on ProductQuestion {\n  id\n  acceptedAnswerId\n  answers(first: $answerFirst) {\n    edges {\n      node {\n        id\n        ...ProductCommunityItems_answer\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n\nfragment ProductCommunityItems_answer on ProductAnswer {\n  id\n  body\n  authorLabel\n  moderationStatus\n  viewerCanEdit\n  viewerCanRemove\n}\n\nfragment ProductCommunityItems_question on ProductQuestion {\n  id\n  title\n  body\n  authorLabel\n  moderationStatus\n  viewerCanEdit\n  viewerCanRemove\n}\n\nfragment ProductCommunityPanel_questions_4dO3Lg on Product {\n  questions(first: $questionFirst, after: $questionsAfter) {\n    edges {\n      node {\n        id\n        ...ProductCommunityItems_question\n        ...CommunityQuestionAnswers_question_2KK7X7\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n  id\n}\n"
  }
};
})();

(node as any).hash = "b814c228436220ca9f2367a2ec9aad45";

export default node;
