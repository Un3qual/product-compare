/**
 * @generated SignedSource<<643104608aa63c5d29970fa16f9cb31c>>
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
export type AttributionLedger_row$data = {
  readonly affiliateNetworkCode: string | null | undefined;
  readonly affiliateNetworkId: string | null | undefined;
  readonly affiliateNetworkName: string | null | undefined;
  readonly affiliateProgramCode: string | null | undefined;
  readonly affiliateProgramId: string | null | undefined;
  readonly anonymousVisitor: boolean;
  readonly clickId: string;
  readonly insertedAt: any;
  readonly ipAddress: string | null | undefined;
  readonly linkType: CommerceAttributionLinkType;
  readonly matchedConversions: ReadonlyArray<{
    readonly affiliateNetworkCode: string | null | undefined;
    readonly affiliateNetworkId: string | null | undefined;
    readonly affiliateNetworkName: string | null | undefined;
    readonly attributionConfidence: CommerceAttributionConfidence;
    readonly commissionAmount: any | null | undefined;
    readonly currency: string;
    readonly merchantId: string | null | undefined;
    readonly merchantName: string | null | undefined;
    readonly networkConversionRef: string;
    readonly orderAmount: any | null | undefined;
    readonly productId: string | null | undefined;
    readonly productName: string | null | undefined;
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
  readonly " $fragmentType": "AttributionLedger_row";
};
export type AttributionLedger_row$key = {
  readonly " $data"?: AttributionLedger_row$data;
  readonly " $fragmentSpreads": FragmentRefs<"AttributionLedger_row">;
};

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "affiliateNetworkCode",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "affiliateNetworkId",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "affiliateNetworkName",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "merchantId",
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
  "name": "productId",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "productName",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "AttributionLedger_row",
  "selections": [
    (v0/*: any*/),
    (v1/*: any*/),
    (v2/*: any*/),
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
      "name": "anonymousVisitor",
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
        (v0/*: any*/),
        (v1/*: any*/),
        (v2/*: any*/),
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
        (v3/*: any*/),
        (v4/*: any*/),
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
        (v5/*: any*/),
        (v6/*: any*/),
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
    (v3/*: any*/),
    (v4/*: any*/),
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
    (v5/*: any*/),
    (v6/*: any*/),
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
    }
  ],
  "type": "CommerceAttributionClick",
  "abstractKey": null
};
})();

(node as any).hash = "1d4a25d5e3b662e2ae7a116edb3cb556";

export default node;
