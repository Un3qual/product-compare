/**
 * @generated SignedSource<<a354e1cdd0051b1f7646ab9ac904420f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type RevenueSummaryInput = {
  currency?: string | null | undefined;
  from?: string | null | undefined;
  merchantId?: string | null | undefined;
  network?: string | null | undefined;
  productId?: string | null | undefined;
  to?: string | null | undefined;
};
export type RevenueSummaryRouteQuery$variables = {
  input?: RevenueSummaryInput | null | undefined;
  ledgerAfter?: string | null | undefined;
  ledgerFirst: number;
};
export type RevenueSummaryRouteQuery$data = {
  readonly revenueSummary: {
    readonly filters: {
      readonly currency: string | null | undefined;
      readonly from: string | null | undefined;
      readonly merchantId: string | null | undefined;
      readonly network: string | null | undefined;
      readonly productId: string | null | undefined;
      readonly to: string | null | undefined;
    };
    readonly metrics: {
      readonly averagePaidPrice: string | null | undefined;
      readonly clicks: number | null | undefined;
      readonly commissionRevenue: string | null | undefined;
      readonly conversions: number | null | undefined;
      readonly currency: string | null | undefined;
      readonly grossOrderValue: string | null | undefined;
    };
  } | null | undefined;
  readonly " $fragmentSpreads": FragmentRefs<"AttributionLedger_connection">;
};
export type RevenueSummaryRouteQuery = {
  response: RevenueSummaryRouteQuery$data;
  variables: RevenueSummaryRouteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "input"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "ledgerAfter"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "ledgerFirst"
},
v3 = {
  "kind": "Variable",
  "name": "input",
  "variableName": "input"
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "merchantId",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "productId",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": [
    (v3/*: any*/)
  ],
  "concreteType": "RevenueSummary",
  "kind": "LinkedField",
  "name": "revenueSummary",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "RevenueSummaryFilters",
      "kind": "LinkedField",
      "name": "filters",
      "plural": false,
      "selections": [
        (v4/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "from",
          "storageKey": null
        },
        (v5/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "network",
          "storageKey": null
        },
        (v6/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "to",
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "RevenueSummaryMetrics",
      "kind": "LinkedField",
      "name": "metrics",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "averagePaidPrice",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "clicks",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "commissionRevenue",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "conversions",
          "storageKey": null
        },
        (v4/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "grossOrderValue",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "storageKey": null
},
v8 = [
  {
    "kind": "Variable",
    "name": "after",
    "variableName": "ledgerAfter"
  },
  {
    "kind": "Variable",
    "name": "first",
    "variableName": "ledgerFirst"
  },
  (v3/*: any*/)
],
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "affiliateNetworkCode",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "affiliateNetworkId",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "affiliateNetworkName",
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "merchantName",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "productName",
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
    "name": "RevenueSummaryRouteQuery",
    "selections": [
      (v7/*: any*/),
      {
        "args": (v8/*: any*/),
        "kind": "FragmentSpread",
        "name": "AttributionLedger_connection"
      }
    ],
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v2/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Operation",
    "name": "RevenueSummaryRouteQuery",
    "selections": [
      (v7/*: any*/),
      {
        "alias": null,
        "args": (v8/*: any*/),
        "concreteType": "CommerceAttributionClickConnection",
        "kind": "LinkedField",
        "name": "commerceAttributionClicks",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "CommerceAttributionClickEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "CommerceAttributionClick",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v9/*: any*/),
                  (v10/*: any*/),
                  (v11/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "affiliateProgramCode",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "affiliateProgramId",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "anonymousId",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "clickId",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "insertedAt",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "ipAddress",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "linkType",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "CommerceAttributionMatchedConversion",
                    "kind": "LinkedField",
                    "name": "matchedConversions",
                    "plural": true,
                    "selections": [
                      (v9/*: any*/),
                      (v10/*: any*/),
                      (v11/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "attributionConfidence",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "commissionAmount",
                        "storageKey": null
                      },
                      (v4/*: any*/),
                      (v5/*: any*/),
                      (v12/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "networkConversionRef",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "orderAmount",
                        "storageKey": null
                      },
                      (v6/*: any*/),
                      (v13/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "purchasedAt",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "reportedAt",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "status",
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  (v5/*: any*/),
                  (v12/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "merchantProductExternalSku",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "merchantProductId",
                    "storageKey": null
                  },
                  (v6/*: any*/),
                  (v13/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "referrer",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "sourceSurface",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "userAgent",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "userEmail",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "userId",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "__typename",
                    "storageKey": null
                  }
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
        "args": (v8/*: any*/),
        "filters": [
          "input"
        ],
        "handle": "connection",
        "key": "AttributionLedger_commerceAttributionClicks",
        "kind": "LinkedHandle",
        "name": "commerceAttributionClicks"
      }
    ]
  },
  "params": {
    "cacheID": "7922be76c5a20aeb166f3d4c1c14a51a",
    "id": null,
    "metadata": {},
    "name": "RevenueSummaryRouteQuery",
    "operationKind": "query",
    "text": "query RevenueSummaryRouteQuery(\n  $input: RevenueSummaryInput\n  $ledgerFirst: Int!\n  $ledgerAfter: String\n) {\n  revenueSummary(input: $input) {\n    filters {\n      currency\n      from\n      merchantId\n      network\n      productId\n      to\n    }\n    metrics {\n      averagePaidPrice\n      clicks\n      commissionRevenue\n      conversions\n      currency\n      grossOrderValue\n    }\n  }\n  ...AttributionLedger_connection_wKqW4\n}\n\nfragment AttributionLedger_connection_wKqW4 on RootQueryType {\n  commerceAttributionClicks(input: $input, first: $ledgerFirst, after: $ledgerAfter) {\n    edges {\n      node {\n        affiliateNetworkCode\n        affiliateNetworkId\n        affiliateNetworkName\n        affiliateProgramCode\n        affiliateProgramId\n        anonymousId\n        clickId\n        insertedAt\n        ipAddress\n        linkType\n        matchedConversions {\n          affiliateNetworkCode\n          affiliateNetworkId\n          affiliateNetworkName\n          attributionConfidence\n          commissionAmount\n          currency\n          merchantId\n          merchantName\n          networkConversionRef\n          orderAmount\n          productId\n          productName\n          purchasedAt\n          reportedAt\n          status\n        }\n        merchantId\n        merchantName\n        merchantProductExternalSku\n        merchantProductId\n        productId\n        productName\n        referrer\n        sourceSurface\n        userAgent\n        userEmail\n        userId\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "a4be97557a948fa60e3c0b8602c9608c";

export default node;
