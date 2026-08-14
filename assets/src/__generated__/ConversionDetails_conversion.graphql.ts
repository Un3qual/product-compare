/**
 * @generated SignedSource<<8a21cb4ee493f5c8d71fde3eb03623aa>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type CommerceAttributionConfidence = "HIGH" | "LOW" | "UNMATCHED" | "%future added value";
export type CommerceConversionStatus = "APPROVED" | "PAID" | "PENDING" | "REVERSED" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type ConversionDetails_conversion$data = {
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
  readonly " $fragmentType": "ConversionDetails_conversion";
};
export type ConversionDetails_conversion$key = {
  readonly " $data"?: ConversionDetails_conversion$data;
  readonly " $fragmentSpreads": FragmentRefs<"ConversionDetails_conversion">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ConversionDetails_conversion",
  "selections": [
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
      "name": "merchantName",
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
      "name": "productName",
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
  "type": "CommerceAttributionMatchedConversion",
  "abstractKey": null
};

(node as any).hash = "760da54d0d309f6a71ebc8b93e0dd0db";

export default node;
