/**
 * @generated SignedSource<<9fe26e9b9cd526e6f485a86149770747>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type UnmatchedFeedsQuery$variables = {
  after?: string | null;
  first: number;
};
export type UnmatchedFeedsQuery$data = {
  readonly unmatchedCjFeeds: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly " $fragmentSpreads": FragmentRefs<"FeedFactsRow_feed">;
      };
    }>;
    readonly pageInfo: {
      readonly endCursor: string | null;
      readonly hasNextPage: boolean;
      readonly hasPreviousPage: boolean;
    };
  };
};
export type UnmatchedFeedsQuery = {
  response: UnmatchedFeedsQuery$data;
  variables: UnmatchedFeedsQuery$variables;
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
v2 = [
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
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v4 = {
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
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*:: as any*/),
      (v1/*:: as any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "UnmatchedFeedsQuery",
    "selections": [
      {
        "alias": null,
        "args": (v2/*:: as any*/),
        "concreteType": "MerchantFeedCandidateConnection",
        "kind": "LinkedField",
        "name": "unmatchedCjFeeds",
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
                  (v3/*:: as any*/),
                  {
                    "args": null,
                    "kind": "FragmentSpread",
                    "name": "FeedFactsRow_feed"
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          (v4/*:: as any*/)
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
      (v0/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "UnmatchedFeedsQuery",
    "selections": [
      {
        "alias": null,
        "args": (v2/*:: as any*/),
        "concreteType": "MerchantFeedCandidateConnection",
        "kind": "LinkedField",
        "name": "unmatchedCjFeeds",
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
                  (v3/*:: as any*/),
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
                    "name": "advertiserName",
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
          (v4/*:: as any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "f1b898906df8c81d69a48fdd1512ec14",
    "id": null,
    "metadata": {},
    "name": "UnmatchedFeedsQuery",
    "operationKind": "query",
    "text": "query UnmatchedFeedsQuery(\n  $first: Int!\n  $after: String\n) {\n  unmatchedCjFeeds(first: $first, after: $after) {\n    edges {\n      node {\n        id\n        ...FeedFactsRow_feed\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      endCursor\n    }\n  }\n}\n\nfragment FeedFactsRow_feed on MerchantFeedCandidate {\n  id\n  providerFeedId\n  advertiserName\n  advertiserCountry\n  sourceFeedType\n  currency\n  language\n  feedName\n  productCount\n  lastSeenAt\n}\n"
  }
};
})();

(node as any).hash = "ad945a454b0904f1fe94cacc09a9e0e5";

export default node;
