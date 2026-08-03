/**
 * @generated SignedSource<<12941e1d96b1cddd202d99d9b763888e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type CommerceAttributionConfidence = "HIGH" | "LOW" | "UNMATCHED" | "%future added value";
export type CommerceAttributionLinkType = "AFFILIATE" | "NON_AFFILIATE" | "%future added value";
export type CommerceClickSourceSurface = "API" | "EXTENSION" | "WEB" | "%future added value";
export type CommerceConversionStatus = "APPROVED" | "PAID" | "PENDING" | "REVERSED" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type AttributionLedger_connection$data = {
  readonly commerceAttributionClicks: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly affiliateNetworkCode: string | null | undefined;
        readonly affiliateNetworkId: string | null | undefined;
        readonly affiliateNetworkName: string | null | undefined;
        readonly affiliateProgramCode: string | null | undefined;
        readonly affiliateProgramId: string | null | undefined;
        readonly anonymousId: string | null | undefined;
        readonly clickId: string;
        readonly insertedAt: any;
        readonly ipAddress: string | null | undefined;
        readonly linkType: CommerceAttributionLinkType;
        readonly matchedConversions: ReadonlyArray<{
          readonly attributionConfidence: CommerceAttributionConfidence;
          readonly commissionAmount: any | null | undefined;
          readonly currency: string;
          readonly networkConversionRef: string;
          readonly orderAmount: any | null | undefined;
          readonly purchasedAt: any | null | undefined;
          readonly reportedAt: any;
          readonly status: CommerceConversionStatus;
        }>;
        readonly merchantId: string;
        readonly merchantName: string;
        readonly merchantProductExternalSku: string | null | undefined;
        readonly merchantProductId: string | null | undefined;
        readonly productId: string | null | undefined;
        readonly productName: string | null | undefined;
        readonly referrer: string | null | undefined;
        readonly sourceSurface: CommerceClickSourceSurface;
        readonly userAgent: string | null | undefined;
        readonly userEmail: string | null | undefined;
        readonly userId: string | null | undefined;
      };
    }>;
  };
  readonly " $fragmentType": "AttributionLedger_connection";
};
export type AttributionLedger_connection$key = {
  readonly " $data"?: AttributionLedger_connection$data;
  readonly " $fragmentSpreads": FragmentRefs<"AttributionLedger_connection">;
};

import AttributionLedgerPaginationQuery_graphql from './AttributionLedgerPaginationQuery.graphql';

const node: ReaderFragment = (function(){
var v0 = [
  "commerceAttributionClicks"
];
return {
  "argumentDefinitions": [
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
  "kind": "Fragment",
  "metadata": {
    "connection": [
      {
        "count": "first",
        "cursor": "after",
        "direction": "forward",
        "path": (v0/*: any*/)
      }
    ],
    "refetch": {
      "connection": {
        "forward": {
          "count": "first",
          "cursor": "after"
        },
        "backward": null,
        "path": (v0/*: any*/)
      },
      "fragmentPathInResult": [],
      "operation": AttributionLedgerPaginationQuery_graphql
    }
  },
  "name": "AttributionLedger_connection",
  "selections": [
    {
      "alias": "commerceAttributionClicks",
      "args": [
        {
          "kind": "Variable",
          "name": "input",
          "variableName": "input"
        }
      ],
      "concreteType": "CommerceAttributionClickConnection",
      "kind": "LinkedField",
      "name": "__AttributionLedger_commerceAttributionClicks_connection",
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
                  "name": "affiliateNetworkCode",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "affiliateNetworkId",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "affiliateNetworkName",
                  "storageKey": null
                },
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
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "merchantId",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "merchantName",
                  "storageKey": null
                },
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
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "productId",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "productName",
                  "storageKey": null
                },
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
    }
  ],
  "type": "RootQueryType",
  "abstractKey": null
};
})();

(node as any).hash = "7cd17bc06567de585eac79c339cd6f90";

export default node;
