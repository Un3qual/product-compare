/**
 * @generated SignedSource<<8cc7d29e85b31f23a9f7c50f325dad54>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CJProgramFeedsQuery$variables = {
  after?: string | null | undefined;
  first: number;
  id: string;
};
export type CJProgramFeedsQuery$data = {
  readonly cjProgram: {
    readonly feeds: {
      readonly edges: ReadonlyArray<{
        readonly node: {
          readonly advertiserCountry: string | null | undefined;
          readonly currency: string | null | undefined;
          readonly feedName: string | null | undefined;
          readonly id: string;
          readonly language: string | null | undefined;
          readonly lastSeenAt: any;
          readonly productCount: number | null | undefined;
          readonly providerFeedId: string;
          readonly sourceFeedType: string | null | undefined;
        };
      }>;
      readonly pageInfo: {
        readonly endCursor: string | null | undefined;
        readonly hasNextPage: boolean;
        readonly hasPreviousPage: boolean;
      };
    };
  } | null | undefined;
};
export type CJProgramFeedsQuery = {
  response: CJProgramFeedsQuery$data;
  variables: CJProgramFeedsQuery$variables;
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
v5 = {
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
  "concreteType": "MerchantFeedCandidateConnection",
  "kind": "LinkedField",
  "name": "feeds",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "MerchantFeedCandidateEdge",
      "kind": "LinkedField",
      "name": "edges",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "MerchantFeedCandidate",
          "kind": "LinkedField",
          "name": "node",
          "plural": false,
          "selections": [
            (v4/*: any*/),
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "providerFeedId",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "advertiserCountry",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "sourceFeedType",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "currency",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "language",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "feedName",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "productCount",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "lastSeenAt",
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
          "name": "hasNextPage",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "hasPreviousPage",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "endCursor",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "CJProgramFeedsQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "CJProgram",
        "kind": "LinkedField",
        "name": "cjProgram",
        "plural": false,
        "selections": [
          (v5/*: any*/)
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
      (v2/*: any*/),
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "CJProgramFeedsQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "CJProgram",
        "kind": "LinkedField",
        "name": "cjProgram",
        "plural": false,
        "selections": [
          (v5/*: any*/),
          (v4/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "a14473eb4f3c9bd12648afac0096eaa9",
    "id": null,
    "metadata": {},
    "name": "CJProgramFeedsQuery",
    "operationKind": "query",
    "text": "query CJProgramFeedsQuery(\n  $id: ID!\n  $first: Int!\n  $after: String\n) {\n  cjProgram(id: $id) {\n    feeds(first: $first, after: $after) {\n      edges {\n        node {\n          id\n          providerFeedId\n          advertiserCountry\n          sourceFeedType\n          currency\n          language\n          feedName\n          productCount\n          lastSeenAt\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        endCursor\n      }\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "db88989ba2a0c700f0dce3e28b282c9e";

export default node;
