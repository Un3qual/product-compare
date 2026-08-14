/**
 * @generated SignedSource<<c687b1c957996016fb47e4805726d215>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ProgramFeedsQuery$variables = {
  after?: string | null;
  first: number;
  id: string;
};
export type ProgramFeedsQuery$data = {
  readonly cjProgram: {
    readonly feeds: {
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
  } | null;
};
export type ProgramFeedsQuery = {
  response: ProgramFeedsQuery$data;
  variables: ProgramFeedsQuery$variables;
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
v4 = [
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
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
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
      (v1/*:: as any*/),
      (v2/*:: as any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "ProgramFeedsQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*:: as any*/),
        "concreteType": "CJProgram",
        "kind": "LinkedField",
        "name": "cjProgram",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": (v4/*:: as any*/),
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
                      (v5/*:: as any*/),
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
    "name": "ProgramFeedsQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*:: as any*/),
        "concreteType": "CJProgram",
        "kind": "LinkedField",
        "name": "cjProgram",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": (v4/*:: as any*/),
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
                      (v5/*:: as any*/),
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
              (v6/*:: as any*/)
            ],
            "storageKey": null
          },
          (v5/*:: as any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "9a8903c63b6fcd528e3f3ee091e181e1",
    "id": null,
    "metadata": {},
    "name": "ProgramFeedsQuery",
    "operationKind": "query",
    "text": "query ProgramFeedsQuery(\n  $id: ID!\n  $first: Int!\n  $after: String\n) {\n  cjProgram(id: $id) {\n    feeds(first: $first, after: $after) {\n      edges {\n        node {\n          id\n          ...FeedFactsRow_feed\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        endCursor\n      }\n    }\n    id\n  }\n}\n\nfragment FeedFactsRow_feed on MerchantFeedCandidate {\n  id\n  providerFeedId\n  advertiserName\n  advertiserCountry\n  sourceFeedType\n  currency\n  language\n  feedName\n  productCount\n  lastSeenAt\n}\n"
  }
};
})();

(node as any).hash = "fea6523aeea984e8ec64faafc2264f06";

export default node;
