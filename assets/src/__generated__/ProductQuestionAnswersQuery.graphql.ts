/**
 * @generated SignedSource<<85ed81bd326aabc252ece13b2cc7dd77>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ProductQuestionAnswersQuery$variables = {
  after?: string | null | undefined;
  first: number;
  id: string;
};
export type ProductQuestionAnswersQuery$data = {
  readonly productQuestion: {
    readonly answers: {
      readonly edges: ReadonlyArray<{
        readonly node: {
          readonly authorLabel: string;
          readonly body: string;
          readonly id: string;
        };
      }>;
      readonly pageInfo: {
        readonly endCursor: string | null | undefined;
        readonly hasNextPage: boolean;
      };
    };
    readonly id: string;
  } | null | undefined;
};
export type ProductQuestionAnswersQuery = {
  response: ProductQuestionAnswersQuery$data;
  variables: ProductQuestionAnswersQuery$variables;
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
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v4 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "id"
      }
    ],
    "concreteType": "ProductQuestion",
    "kind": "LinkedField",
    "name": "productQuestion",
    "plural": false,
    "selections": [
      (v3/*: any*/),
      {
        "alias": null,
        "args": [
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
                  (v3/*: any*/),
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
                  }
                ],
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
      (v2/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "ProductQuestionAnswersQuery",
    "selections": (v4/*: any*/),
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v2/*: any*/),
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "ProductQuestionAnswersQuery",
    "selections": (v4/*: any*/)
  },
  "params": {
    "cacheID": "8563b4ae3f6f9b3fdafe0a464a90726e",
    "id": null,
    "metadata": {},
    "name": "ProductQuestionAnswersQuery",
    "operationKind": "query",
    "text": "query ProductQuestionAnswersQuery(\n  $id: ID!\n  $first: Int!\n  $after: String\n) {\n  productQuestion(id: $id) {\n    id\n    answers(first: $first, after: $after) {\n      edges {\n        node {\n          id\n          body\n          authorLabel\n        }\n      }\n      pageInfo {\n        endCursor\n        hasNextPage\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "76830fc6f2f36dc238b257549f3d4ff5";

export default node;
