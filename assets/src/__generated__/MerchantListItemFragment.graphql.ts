/**
 * @generated SignedSource<<106c97c81d25cb2c3116c175f90d44c3>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type MerchantListItemFragment$data = {
  readonly domain: string;
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly " $fragmentType": "MerchantListItemFragment";
};
export type MerchantListItemFragment$key = {
  readonly " $data"?: MerchantListItemFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"MerchantListItemFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "MerchantListItemFragment",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "id",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "name",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "domain",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "slug",
      "storageKey": null
    }
  ],
  "type": "Merchant",
  "abstractKey": null
};

(node as any).hash = "b26225c5f03f33347a612bd2004f7faa";

export default node;
