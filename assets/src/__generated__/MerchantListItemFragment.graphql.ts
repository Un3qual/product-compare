/**
 * @generated SignedSource<<d6df4ea177bd9c5da372a07fc4b7d084>>
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
    }
  ],
  "type": "Merchant",
  "abstractKey": null
};

(node as any).hash = "05b8ecfa14afa6f2b88517c990384a5b";

export default node;
