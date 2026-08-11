/**
 * @generated SignedSource<<10e4f3c459c106054e2be5471ed47f96>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type MerchantDirectoryView_item$data = {
  readonly domain: string;
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly " $fragmentType": "MerchantDirectoryView_item";
};
export type MerchantDirectoryView_item$key = {
  readonly " $data"?: MerchantDirectoryView_item$data;
  readonly " $fragmentSpreads": FragmentRefs<"MerchantDirectoryView_item">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "MerchantDirectoryView_item",
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

(node as any).hash = "3ea05ea26f72a3a8ea6cfd13fe93926a";

export default node;
