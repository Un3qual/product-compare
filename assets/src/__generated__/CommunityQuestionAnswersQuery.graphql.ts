/**
 * @generated SignedSource<<5bd2330da45e76b33511e646b1ce28d7>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type CommunityQuestionAnswersQuery$variables = {
  after?: string | null;
  first: number;
  id: string;
};
export type CommunityQuestionAnswersQuery$data = {
  readonly productQuestion: {
    readonly answers: {
      readonly edges: ReadonlyArray<{
        readonly node: {
          readonly id: string;
          readonly " $fragmentSpreads": FragmentRefs<"ProductCommunityItems_answer">;
        };
      }>;
      readonly pageInfo: {
        readonly endCursor: string | null;
        readonly hasNextPage: boolean;
      };
    };
    readonly id: string;
  } | null;
};
export type CommunityQuestionAnswersQuery = {
  response: CommunityQuestionAnswersQuery$data;
  variables: CommunityQuestionAnswersQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "after"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "first"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "id"
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
  "name": "id",
  "storageKey": null
},
v5 = [
  {
    "kind": "Variable",
    "name": "after",
    "variableName": "after"
  },
  {
    "kind": "Variable",
    "name": "first",
    "variableName": "first"
  }
],
v6 = {
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
      (v2/*:: as any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "CommunityQuestionAnswersQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*:: as any*/),
        "concreteType": "ProductQuestion",
        "kind": "LinkedField",
        "name": "productQuestion",
        "plural": false,
        "selections": [
          (v4/*:: as any*/),
          {
            "alias": null,
            "args": (v5/*:: as any*/),
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
                      (v4/*:: as any*/),
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
              },
              (v6/*:: as any*/)
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
      (v2/*:: as any*/),
      (v1/*:: as any*/),
      (v0/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "CommunityQuestionAnswersQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*:: as any*/),
        "concreteType": "ProductQuestion",
        "kind": "LinkedField",
        "name": "productQuestion",
        "plural": false,
        "selections": [
          (v4/*:: as any*/),
          {
            "alias": null,
            "args": (v5/*:: as any*/),
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
                      (v4/*:: as any*/),
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
                      }
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              (v6/*:: as any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "0ac58667147d279930c77c05c63616c2",
    "id": null,
    "metadata": {},
    "name": "CommunityQuestionAnswersQuery",
    "operationKind": "query",
    "text": "query CommunityQuestionAnswersQuery(\n  $id: ID!\n  $first: Int!\n  $after: String\n) {\n  productQuestion(id: $id) {\n    id\n    answers(first: $first, after: $after) {\n      edges {\n        node {\n          id\n          ...ProductCommunityItems_answer\n        }\n      }\n      pageInfo {\n        endCursor\n        hasNextPage\n      }\n    }\n  }\n}\n\nfragment ProductCommunityItems_answer on ProductAnswer {\n  id\n  body\n  authorLabel\n  moderationStatus\n  viewerCanEdit\n  viewerCanRemove\n}\n"
  }
};
})();

(node as any).hash = "d7a4bb8f752c3b52d515f77698f8d81b";

export default node;
