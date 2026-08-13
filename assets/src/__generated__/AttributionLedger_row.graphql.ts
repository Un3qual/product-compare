/**
 * @generated SignedSource<<036273673117183010b0bb58cf8c46dd>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type CommerceAttributionLinkType = "AFFILIATE" | "NON_AFFILIATE" | "%future added value";
export type CommerceClickSourceSurface = "API" | "EXTENSION" | "WEB" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type AttributionLedger_row$data = ReadonlyArray<{
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
    readonly networkConversionRef: string;
    readonly " $fragmentSpreads": FragmentRefs<"ConversionDetails_conversion">;
  }>;
  readonly merchantName: string;
  readonly merchantProductExternalSku: string | null;
  readonly productName: string | null;
  readonly referrer: string | null;
  readonly sourceSurface: CommerceClickSourceSurface;
  readonly userAgent: string | null;
  readonly userEmail: string | null;
  readonly " $fragmentType": "AttributionLedger_row";
}>;
export type AttributionLedger_row$key = ReadonlyArray<{
  readonly " $data"?: AttributionLedger_row$data;
  readonly " $fragmentSpreads": FragmentRefs<"AttributionLedger_row">;
}>;

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "affiliateNetworkCode",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "AttributionLedger_row",
  "selections": [
    (v0/*:: as any*/),
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
        (v0/*:: as any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "networkConversionRef",
          "storageKey": null
        },
        {
          "args": null,
          "kind": "FragmentSpread",
          "name": "ConversionDetails_conversion"
        }
      ],
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
    }
  ],
  "type": "CommerceAttributionClick",
  "abstractKey": null
};
})();

(node as any).hash = "a67cc0085b130a024e7d4d10274b99ff";

export default node;
