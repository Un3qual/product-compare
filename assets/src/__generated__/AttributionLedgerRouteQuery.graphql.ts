/**
 * @generated SignedSource<<7ada8fce49b683f1714507aa9a477ea1>>
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
export type AttributionLedgerRouteQuery$variables = {
  after?: string | null | undefined;
  first: number;
  input?: RevenueSummaryInput | null | undefined;
};
export type AttributionLedgerRouteQuery$data = {
  readonly " $fragmentSpreads": FragmentRefs<"AttributionLedger_connection">;
};
export type AttributionLedgerRouteQuery = {
  response: AttributionLedgerRouteQuery$data;
  variables: AttributionLedgerRouteQuery$variables;
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
  "name": "input"
},
v3 = [
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
    "name": "input",
    "variableName": "input"
  }
],
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "affiliateNetworkCode",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "affiliateNetworkId",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "affiliateNetworkName",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "merchantId",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "merchantName",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "productId",
  "storageKey": null
},
v10 = {
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
    "name": "AttributionLedgerRouteQuery",
    "selections": [
      {
        "args": (v3/*: any*/),
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
      (v2/*: any*/),
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "AttributionLedgerRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
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
                  (v4/*: any*/),
                  (v5/*: any*/),
                  (v6/*: any*/),
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
                      (v4/*: any*/),
                      (v5/*: any*/),
                      (v6/*: any*/),
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
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "currency",
                        "storageKey": null
                      },
                      (v7/*: any*/),
                      (v8/*: any*/),
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
                      (v9/*: any*/),
                      (v10/*: any*/),
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
                  (v7/*: any*/),
                  (v8/*: any*/),
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
                  (v9/*: any*/),
                  (v10/*: any*/),
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
        "args": (v3/*: any*/),
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
    "cacheID": "6b997e981c2676b9636451fdf745f720",
    "id": null,
    "metadata": {},
    "name": "AttributionLedgerRouteQuery",
    "operationKind": "query",
    "text": "query AttributionLedgerRouteQuery(\n  $input: RevenueSummaryInput\n  $first: Int!\n  $after: String\n) {\n  ...AttributionLedger_connection_2DAjA4\n}\n\nfragment AttributionLedger_connection_2DAjA4 on RootQueryType {\n  commerceAttributionClicks(input: $input, first: $first, after: $after) {\n    edges {\n      node {\n        affiliateNetworkCode\n        affiliateNetworkId\n        affiliateNetworkName\n        affiliateProgramCode\n        affiliateProgramId\n        anonymousId\n        clickId\n        insertedAt\n        ipAddress\n        linkType\n        matchedConversions {\n          affiliateNetworkCode\n          affiliateNetworkId\n          affiliateNetworkName\n          attributionConfidence\n          commissionAmount\n          currency\n          merchantId\n          merchantName\n          networkConversionRef\n          orderAmount\n          productId\n          productName\n          purchasedAt\n          reportedAt\n          status\n        }\n        merchantId\n        merchantName\n        merchantProductExternalSku\n        merchantProductId\n        productId\n        productName\n        referrer\n        sourceSurface\n        userAgent\n        userEmail\n        userId\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "96672ce7ed75102300c12cbafcce76a4";

export default node;
