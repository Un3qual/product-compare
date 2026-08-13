/**
 * @generated SignedSource<<9d125c66775847c800d29cdebc7de574>>
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
  readonly affiliateNetworkCode: string | null;
  readonly affiliateNetworkName: string | null;
  readonly affiliateProgramCode: string | null;
  readonly anonymousVisitor: boolean;
  readonly clickId: string;
  readonly insertedAt: string;
  readonly ipAddress: string | null;
  readonly linkType: CommerceAttributionLinkType;
  readonly matchedConversions: ReadonlyArray<{
    readonly affiliateNetworkCode: string | null;
    readonly affiliateNetworkName: string | null;
    readonly attributionConfidence: CommerceAttributionConfidence;
    readonly commissionAmount: string | null;
    readonly currency: string;
    readonly merchantName: string | null;
    readonly networkConversionRef: string;
    readonly orderAmount: string | null;
    readonly productName: string | null;
    readonly purchasedAt: string | null;
    readonly reportedAt: string;
    readonly status: CommerceConversionStatus;
  }>;
  readonly merchantName: string;
  readonly merchantProductExternalSku: string | null;
  readonly productName: string | null;
  readonly referrer: string | null;
  readonly sourceSurface: CommerceClickSourceSurface;
  readonly userAgent: string | null;
  readonly userEmail: string | null;
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
  "name": "affiliateNetworkName",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "merchantName",
  "storageKey": null
},
v3 = {
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
        (v2/*: any*/),
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
        (v3/*: any*/),
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
    (v2/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "merchantProductExternalSku",
      "storageKey": null
    },
    (v3/*: any*/),
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
    }
  ],
  "type": "CommerceAttributionClick",
  "abstractKey": null
};
})();

(node as any).hash = "3f6ebc21599247f0c656e6b01f1cc81d";

export default node;
