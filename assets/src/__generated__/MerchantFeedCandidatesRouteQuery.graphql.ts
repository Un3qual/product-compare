/**
 * @generated SignedSource<<09783b0fe168c7a46dc92e9c08eefcb4>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type MerchantFeedCandidatesRouteQuery$variables = {
  after?: string | null | undefined;
  first?: number | null | undefined;
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
v2 = [
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
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "MerchantFeedCandidatesRouteQuery",
    "selections": (v2/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "MerchantFeedCandidatesRouteQuery",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "9a9ab0b2da96190dba84632e2fb6999a",
    "id": null,
    "metadata": {},
    "name": "MerchantFeedCandidatesRouteQuery",
    "operationKind": "query",
    "text": "query MerchantFeedCandidatesRouteQuery(\n  $first: Int\n  $after: String\n) {\n  merchantFeedCandidates(first: $first, after: $after) {\n    edges {\n      cursor\n      node {\n        id\n        provider\n        providerFeedId\n        advertiserName\n        advertiserCountry\n        sourceFeedType\n        currency\n        language\n        feedName\n        productCount\n        providerLastUpdatedAt\n        lastSeenAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "f119fc4d13ffd84b2372253859665921";

export default node;
