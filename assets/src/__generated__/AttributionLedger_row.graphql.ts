/**
 * @generated SignedSource<<6b9b9db498a3d2db01e2d7ebf8217b16>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
export type CommerceAttributionConfidence = "HIGH" | "LOW" | "UNMATCHED" | "%future added value";
export type CommerceAttributionLinkType = "AFFILIATE" | "NON_AFFILIATE" | "%future added value";
export type CommerceClickSourceSurface = "API" | "EXTENSION" | "WEB" | "%future added value";
export type CommerceConversionStatus =
  | "APPROVED"
  | "PAID"
  | "PENDING"
  | "REVERSED"
  | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type AttributionLedger_row$data = {
  readonly affiliateNetworkCode: string | null | undefined;
  readonly affiliateNetworkName: string | null | undefined;
  readonly affiliateProgramCode: string | null | undefined;
  readonly anonymousVisitor: boolean;
  readonly clickId: string;
  readonly insertedAt: string;
  readonly ipAddress: string | null | undefined;
  readonly linkType: CommerceAttributionLinkType;
  readonly matchedConversions: ReadonlyArray<{
    readonly affiliateNetworkCode: string | null | undefined;
    readonly affiliateNetworkName: string | null | undefined;
    readonly attributionConfidence: CommerceAttributionConfidence;
    readonly commissionAmount: string | null | undefined;
    readonly currency: string;
    readonly merchantName: string | null | undefined;
    readonly networkConversionRef: string;
    readonly orderAmount: string | null | undefined;
    readonly productName: string | null | undefined;
    readonly purchasedAt: string | null | undefined;
    readonly reportedAt: string;
    readonly status: CommerceConversionStatus;
  }>;
  readonly merchantName: string;
  readonly merchantProductExternalSku: string | null | undefined;
  readonly productName: string | null | undefined;
  readonly referrer: string | null | undefined;
  readonly sourceSurface: CommerceClickSourceSurface;
  readonly userAgent: string | null | undefined;
  readonly userEmail: string | null | undefined;
  readonly " $fragmentType": "AttributionLedger_row";
};
export type AttributionLedger_row$key = {
  readonly " $data"?: AttributionLedger_row$data;
  readonly " $fragmentSpreads": FragmentRefs<"AttributionLedger_row">;
};

const node: ReaderFragment = (function () {
  var v0 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "affiliateNetworkCode",
      storageKey: null,
    },
    v1 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "affiliateNetworkName",
      storageKey: null,
    },
    v2 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "merchantName",
      storageKey: null,
    },
    v3 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "productName",
      storageKey: null,
    };
  return {
    argumentDefinitions: [],
    kind: "Fragment",
    metadata: null,
    name: "AttributionLedger_row",
    selections: [
      v0 /*: any*/,
      v1 /*: any*/,
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "affiliateProgramCode",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "anonymousVisitor",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "clickId",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "insertedAt",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "ipAddress",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "linkType",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        concreteType: "CommerceAttributionMatchedConversion",
        kind: "LinkedField",
        name: "matchedConversions",
        plural: true,
        selections: [
          v0 /*: any*/,
          v1 /*: any*/,
          {
            alias: null,
            args: null,
            kind: "ScalarField",
            name: "attributionConfidence",
            storageKey: null,
          },
          {
            alias: null,
            args: null,
            kind: "ScalarField",
            name: "commissionAmount",
            storageKey: null,
          },
          {
            alias: null,
            args: null,
            kind: "ScalarField",
            name: "currency",
            storageKey: null,
          },
          v2 /*: any*/,
          {
            alias: null,
            args: null,
            kind: "ScalarField",
            name: "networkConversionRef",
            storageKey: null,
          },
          {
            alias: null,
            args: null,
            kind: "ScalarField",
            name: "orderAmount",
            storageKey: null,
          },
          v3 /*: any*/,
          {
            alias: null,
            args: null,
            kind: "ScalarField",
            name: "purchasedAt",
            storageKey: null,
          },
          {
            alias: null,
            args: null,
            kind: "ScalarField",
            name: "reportedAt",
            storageKey: null,
          },
          {
            alias: null,
            args: null,
            kind: "ScalarField",
            name: "status",
            storageKey: null,
          },
        ],
        storageKey: null,
      },
      v2 /*: any*/,
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "merchantProductExternalSku",
        storageKey: null,
      },
      v3 /*: any*/,
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "referrer",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "sourceSurface",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "userAgent",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "userEmail",
        storageKey: null,
      },
    ],
    type: "CommerceAttributionClick",
    abstractKey: null,
  };
})();

(node as any).hash = "3f6ebc21599247f0c656e6b01f1cc81d";

export default node;
