/**
 * @generated SignedSource<<8ccfc1e674a1f472689b160b321e5381>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type BrowseProductList_products$data = {
  readonly edges: ReadonlyArray<{
    readonly node: {
      readonly id: string;
      readonly name: string;
      readonly slug: string;
      readonly " $fragmentSpreads": FragmentRefs<"BrowseProductList_item">;
    };
  }>;
  readonly " $fragmentType": "BrowseProductList_products";
};
export type BrowseProductList_products$key = {
  readonly " $data"?: BrowseProductList_products$data;
  readonly " $fragmentSpreads": FragmentRefs<"BrowseProductList_products">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "BrowseProductList_products",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "ProductEdge",
      "kind": "LinkedField",
      "name": "edges",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "Product",
          "kind": "LinkedField",
          "name": "node",
          "plural": false,
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
              "name": "slug",
              "storageKey": null
            },
            {
              "args": null,
              "kind": "FragmentSpread",
              "name": "BrowseProductList_item"
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "ProductConnection",
  "abstractKey": null
};

(node as any).hash = "335ad360a020c13cb7933d9b019c612c";

export default node;
