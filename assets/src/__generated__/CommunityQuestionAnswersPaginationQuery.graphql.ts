/**
 * @generated SignedSource<<e4b93a3de4a3403f71fa2976808fa2f9>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type CommunityQuestionAnswersPaginationQuery$variables = {
  answerFirst: number;
  answersAfter?: string | null;
  id: string;
};
export type CommunityQuestionAnswersPaginationQuery$data = {
  readonly node: {
    readonly " $fragmentSpreads": FragmentRefs<"CommunityQuestionAnswers_question">;
  } | null;
};
export type CommunityQuestionAnswersPaginationQuery = {
  response: CommunityQuestionAnswersPaginationQuery$data;
  variables: CommunityQuestionAnswersPaginationQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "answerFirst"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "answersAfter"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "id"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v4 = [
  {
    "kind": "Variable",
    "name": "after",
    "variableName": "answersAfter"
  },
  {
    "kind": "Variable",
    "name": "first",
    "variableName": "answerFirst"
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "CommunityQuestionAnswersPaginationQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*:: as any*/),
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
                "name": "answersAfter",
                "variableName": "answersAfter"
              }
            ],
            "kind": "FragmentSpread",
            "name": "CommunityQuestionAnswers_question"
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
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "CommunityQuestionAnswersPaginationQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*:: as any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "node",
        "plural": false,
        "selections": [
          (v2/*:: as any*/),
          (v3/*:: as any*/),
          {
            "kind": "InlineFragment",
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "acceptedAnswerId",
                "storageKey": null
              },
              {
                "alias": null,
                "args": (v4/*:: as any*/),
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
                          (v3/*:: as any*/),
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
                          (v2/*:: as any*/)
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
                "args": (v4/*:: as any*/),
                "filters": null,
                "handle": "connection",
                "key": "CommunityQuestionAnswers_answers",
                "kind": "LinkedHandle",
                "name": "answers"
              }
            ],
            "type": "ProductQuestion",
            "abstractKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "e67482da8c74afb4cb1e106ec7d11218",
    "id": null,
    "metadata": {},
    "name": "CommunityQuestionAnswersPaginationQuery",
    "operationKind": "query",
    "text": "query CommunityQuestionAnswersPaginationQuery(\n  $answerFirst: Int!\n  $answersAfter: String\n  $id: ID!\n) {\n  node(id: $id) {\n    __typename\n    ...CommunityQuestionAnswers_question_1VGOkt\n    id\n  }\n}\n\nfragment CommunityQuestionAnswers_question_1VGOkt on ProductQuestion {\n  id\n  acceptedAnswerId\n  answers(first: $answerFirst, after: $answersAfter) {\n    edges {\n      node {\n        id\n        ...ProductCommunityItems_answer\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n\nfragment ProductCommunityItems_answer on ProductAnswer {\n  id\n  body\n  authorLabel\n  moderationStatus\n  viewerCanEdit\n  viewerCanRemove\n}\n"
  }
};
})();

(node as any).hash = "2539f5070c9613f4c1c819acc798d2c4";

export default node;
