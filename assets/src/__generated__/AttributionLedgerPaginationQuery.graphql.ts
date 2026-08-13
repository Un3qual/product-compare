/**
 * @generated SignedSource<<b22687fe2b8f97a855c3745e1659d77b>>
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
export type AttributionLedgerPaginationQuery$variables = {
  after?: string | null;
  first: number;
  input?: RevenueSummaryInput | null;
};
export type AttributionLedgerPaginationQuery$data = {
  readonly " $fragmentSpreads": FragmentRefs<"AttributionLedger_connection">;
};
export type AttributionLedgerPaginationQuery = {
  response: AttributionLedgerPaginationQuery$data;
  variables: AttributionLedgerPaginationQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "after"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "first"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
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
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "affiliateNetworkCode",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "affiliateNetworkName",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "merchantName",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "productName",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "AttributionLedgerPaginationQuery",
    "selections": [
      {
        "args": (v1/*:: as any*/),
        "kind": "FragmentSpread",
        "name": "AttributionLedger_connection"
      }
    ],
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "AttributionLedgerPaginationQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*:: as any*/),
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
                  (v2/*:: as any*/),
                  (v3/*:: as any*/),
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
                      (v2/*:: as any*/),
                      (v3/*:: as any*/),
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
                      (v4/*:: as any*/),
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
                      (v5/*:: as any*/),
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
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "purchasedAt",
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  (v4/*:: as any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "merchantProductExternalSku",
                    "storageKey": null
                  },
                  (v5/*:: as any*/),
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
        "args": (v1/*:: as any*/),
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
    "cacheID": "d1297c60b5bb5ebb355edf409751e92e",
    "id": null,
    "metadata": {},
    "name": "AttributionLedgerPaginationQuery",
    "operationKind": "query",
    "text": "query AttributionLedgerPaginationQuery(\n  $after: String\n  $first: Int!\n  $input: RevenueSummaryInput\n) {\n  ...AttributionLedger_connection_2DAjA4\n}\n\nfragment AttributionLedger_connection_2DAjA4 on RootQueryType {\n  commerceAttributionClicks(input: $input, first: $first, after: $after) {\n    edges {\n      node {\n        clickId\n        ...AttributionLedger_row\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n\nfragment AttributionLedger_row on CommerceAttributionClick {\n  affiliateNetworkCode\n  affiliateNetworkName\n  affiliateProgramCode\n  anonymousVisitor\n  clickId\n  insertedAt\n  ipAddress\n  linkType\n  matchedConversions {\n    affiliateNetworkCode\n    affiliateNetworkName\n    attributionConfidence\n    commissionAmount\n    currency\n    merchantName\n    networkConversionRef\n    orderAmount\n    productName\n    reportedAt\n    status\n    ...ConversionDetails_conversion\n  }\n  merchantName\n  merchantProductExternalSku\n  productName\n  referrer\n  sourceSurface\n  userAgent\n  userEmail\n}\n\nfragment ConversionDetails_conversion on CommerceAttributionMatchedConversion {\n  affiliateNetworkName\n  attributionConfidence\n  commissionAmount\n  currency\n  merchantName\n  networkConversionRef\n  orderAmount\n  productName\n  purchasedAt\n  reportedAt\n  status\n}\n"
  }
};
})();

(node as any).hash = "0c0b37b5ba210723492a12c1a516c313";

export default node;
