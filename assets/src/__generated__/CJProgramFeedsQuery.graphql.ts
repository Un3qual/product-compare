/**
 * @generated SignedSource<<29590d53f567a46633750a3bf1098b03>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CJProgramStage = "ACCEPTED" | "APPLIED" | "CONSIDERING" | "DECLINED" | "NEW" | "NOT_PURSUING" | "SELECTED" | "%future added value";
export type CJProgramWarningCode = "MISSING_ADVERTISER_NAME" | "MISSING_PRODUCT_COUNT" | "NON_ENGLISH_LANGUAGE" | "NON_USD_CURRENCY" | "NON_US_MARKET" | "%future added value";
export type CJProgramFeedsQuery$variables = {
  after?: string | null | undefined;
  first: number;
  id: string;
};
export type CJProgramFeedsQuery$data = {
  readonly cjProgram: {
    readonly advertiserId: string;
    readonly advertiserName: string | null | undefined;
    readonly feedCount: number | null | undefined;
    readonly feeds: {
      readonly edges: ReadonlyArray<{
        readonly cursor: string;
        readonly node: {
          readonly advertiserCountry: string | null | undefined;
          readonly advertiserId: string | null | undefined;
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
      };
    };
    readonly id: string;
    readonly lastChanged: any;
    readonly note: string | null | undefined;
    readonly stage: CJProgramStage;
    readonly warningCodes: ReadonlyArray<CJProgramWarningCode>;
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
  "kind": "ScalarField",
  "name": "advertiserId",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "advertiserName",
  "storageKey": null
},
v6 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "id"
      }
    ],
    "concreteType": "CJProgram",
    "kind": "LinkedField",
    "name": "cjProgram",
    "plural": false,
    "selections": [
      (v3/*: any*/),
      (v4/*: any*/),
      (v5/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "stage",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "note",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "lastChanged",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "feedCount",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "warningCodes",
        "storageKey": null
      },
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
                  (v3/*: any*/),
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
                  (v4/*: any*/),
                  (v5/*: any*/),
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
                "name": "endCursor",
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
    "name": "CJProgramFeedsQuery",
    "selections": (v6/*: any*/),
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
    "selections": (v6/*: any*/)
  },
  "params": {
    "cacheID": "04c37a14fee8fdf06bd46b90d69c26c8",
    "id": null,
    "metadata": {},
    "name": "CJProgramFeedsQuery",
    "operationKind": "query",
    "text": "query CJProgramFeedsQuery(\n  $id: ID!\n  $first: Int!\n  $after: String\n) {\n  cjProgram(id: $id) {\n    id\n    advertiserId\n    advertiserName\n    stage\n    note\n    lastChanged\n    feedCount\n    warningCodes\n    feeds(first: $first, after: $after) {\n      edges {\n        cursor\n        node {\n          id\n          provider\n          providerFeedId\n          advertiserId\n          advertiserName\n          advertiserCountry\n          sourceFeedType\n          currency\n          language\n          feedName\n          productCount\n          providerLastUpdatedAt\n          lastSeenAt\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        endCursor\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "1f4bd80010f65971b238276fca7aac1f";

export default node;
