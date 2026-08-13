/**
 * @generated SignedSource<<ac16eefbef7fb582332f0123c0cbbebc>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type RevenueSummaryInput = {
  currency?: string | null;
  from?: string | null;
  merchantId?: string | null;
  network?: string | null;
  productId?: string | null;
  to?: string | null;
};
export type AttributionLedgerRouteQuery$variables = {
  after?: string | null;
  first: number;
  input?: RevenueSummaryInput | null;
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
  "name": "affiliateNetworkName",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "merchantName",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "productName",
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
    "name": "AttributionLedgerRouteQuery",
    "selections": [
      {
        "args": (v3/*:: as any*/),
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
      (v2/*:: as any*/),
      (v1/*:: as any*/),
      (v0/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "AttributionLedgerRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*:: as any*/),
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
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "clickId",
                    "storageKey": null
                  },
                  (v4/*:: as any*/),
                  (v5/*:: as any*/),
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
                    "name": "anonymousVisitor",
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
                      (v4/*:: as any*/),
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "networkConversionRef",
                        "storageKey": null
                      },
                      (v5/*:: as any*/),
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
                      (v6/*:: as any*/),
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "orderAmount",
                        "storageKey": null
                      },
                      (v7/*:: as any*/),
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
                  (v6/*:: as any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "merchantProductExternalSku",
                    "storageKey": null
                  },
                  (v7/*:: as any*/),
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
        "args": (v3/*:: as any*/),
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
    "cacheID": "18247182cc6350190a8ff22e7cafc995",
    "id": null,
    "metadata": {},
    "name": "AttributionLedgerRouteQuery",
    "operationKind": "query",
    "text": "query AttributionLedgerRouteQuery(\n  $input: RevenueSummaryInput\n  $first: Int!\n  $after: String\n) {\n  ...AttributionLedger_connection_2DAjA4\n}\n\nfragment AttributionLedger_connection_2DAjA4 on RootQueryType {\n  commerceAttributionClicks(input: $input, first: $first, after: $after) {\n    edges {\n      node {\n        clickId\n        ...AttributionLedger_row\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n\nfragment AttributionLedger_row on CommerceAttributionClick {\n  affiliateNetworkCode\n  affiliateNetworkName\n  affiliateProgramCode\n  anonymousVisitor\n  clickId\n  insertedAt\n  ipAddress\n  linkType\n  matchedConversions {\n    affiliateNetworkCode\n    networkConversionRef\n    ...ConversionDetails_conversion\n  }\n  merchantName\n  merchantProductExternalSku\n  productName\n  referrer\n  sourceSurface\n  userAgent\n  userEmail\n}\n\nfragment ConversionDetails_conversion on CommerceAttributionMatchedConversion {\n  affiliateNetworkName\n  attributionConfidence\n  commissionAmount\n  currency\n  merchantName\n  networkConversionRef\n  orderAmount\n  productName\n  purchasedAt\n  reportedAt\n  status\n}\n"
  }
};
})();

(node as any).hash = "96672ce7ed75102300c12cbafcce76a4";

export default node;
