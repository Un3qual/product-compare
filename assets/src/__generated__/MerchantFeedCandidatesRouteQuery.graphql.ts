/**
 * @generated SignedSource<<cf712c9be1dc92e92a0c4102967104ef>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type MerchantFeedCandidateReviewStatus = "DISMISSED" | "PENDING" | "SHORTLISTED" | "%future added value";
export type MerchantFeedCandidateSort = "LAST_SEEN_DESC" | "NAME_ASC" | "PRODUCT_COUNT_DESC" | "%future added value";
export type MerchantFeedCandidatesRouteQuery$variables = {
  after?: string | null | undefined;
  first?: number | null | undefined;
  reviewStatus?: MerchantFeedCandidateReviewStatus | null | undefined;
  sort?: MerchantFeedCandidateSort | null | undefined;
};
export type MerchantFeedCandidatesRouteQuery$data = {
  readonly merchantFeedCandidates: {
    readonly edges: ReadonlyArray<{
      readonly cursor: string;
      readonly node: {
        readonly advertiserCountry: string | null | undefined;
        readonly advertiserName: string | null | undefined;
        readonly currency: string | null | undefined;
        readonly feedName: string | null | undefined;
        readonly id: string;
        readonly language: string | null | undefined;
        readonly lastSeenAt: any;
        readonly productCount: number | null | undefined;
        readonly provider: string;
        readonly providerFeedId: string;
        readonly providerLastUpdatedAt: any | null | undefined;
        readonly reviewNote: string | null | undefined;
        readonly reviewStatus: MerchantFeedCandidateReviewStatus;
        readonly reviewedAt: any | null | undefined;
        readonly sourceFeedType: string | null | undefined;
      };
    }>;
    readonly pageInfo: {
      readonly endCursor: string | null | undefined;
      readonly hasNextPage: boolean;
      readonly hasPreviousPage: boolean;
      readonly startCursor: string | null | undefined;
    };
  } | null | undefined;
};
export type MerchantFeedCandidatesRouteQuery = {
  response: MerchantFeedCandidatesRouteQuery$data;
  variables: MerchantFeedCandidatesRouteQuery$variables;
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
  "name": "reviewStatus"
},
v3 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "sort"
},
v4 = [
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
      },
      {
        "kind": "Variable",
        "name": "reviewStatus",
        "variableName": "reviewStatus"
      },
      {
        "kind": "Variable",
        "name": "sort",
        "variableName": "sort"
      }
    ],
    "concreteType": "MerchantFeedCandidateConnection",
    "kind": "LinkedField",
    "name": "merchantFeedCandidates",
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
            "kind": "ScalarField",
            "name": "cursor",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "MerchantFeedCandidate",
            "kind": "LinkedField",
            "name": "node",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "id",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "provider",
                "storageKey": null
              },
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
                "name": "reviewStatus",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "reviewNote",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "reviewedAt",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "providerLastUpdatedAt",
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
            "name": "startCursor",
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
  }
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/),
      (v3/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "MerchantFeedCandidatesRouteQuery",
    "selections": (v4/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/),
      (v2/*: any*/),
      (v3/*: any*/)
    ],
    "kind": "Operation",
    "name": "MerchantFeedCandidatesRouteQuery",
    "selections": (v4/*: any*/)
  },
  "params": {
    "cacheID": "3122e2895b83abbc6aef6df7688fe192",
    "id": null,
    "metadata": {},
    "name": "MerchantFeedCandidatesRouteQuery",
    "operationKind": "query",
    "text": "query MerchantFeedCandidatesRouteQuery(\n  $first: Int\n  $after: String\n  $reviewStatus: MerchantFeedCandidateReviewStatus\n  $sort: MerchantFeedCandidateSort\n) {\n  merchantFeedCandidates(first: $first, after: $after, reviewStatus: $reviewStatus, sort: $sort) {\n    edges {\n      cursor\n      node {\n        id\n        provider\n        providerFeedId\n        advertiserName\n        advertiserCountry\n        sourceFeedType\n        currency\n        language\n        feedName\n        productCount\n        reviewStatus\n        reviewNote\n        reviewedAt\n        providerLastUpdatedAt\n        lastSeenAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "6ff5865f5af106667a1dd295f390e6cb";

export default node;
