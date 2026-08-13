/**
 * @generated SignedSource<<43d8ba2f84b2d79266510da9e36d0ea3>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type BrowseProductList_item$data = {
  readonly brand: {
    readonly id: string;
    readonly name: string;
  } | null;
  readonly currentAttributes: ReadonlyArray<{
    readonly code: string;
    readonly displayName: string;
    readonly sortOrder: number | null;
    readonly valueText: string;
  }>;
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly " $fragmentType": "BrowseProductList_item";
};
export type BrowseProductList_item$key = {
  readonly " $data"?: BrowseProductList_item$data;
  readonly " $fragmentSpreads": FragmentRefs<"BrowseProductList_item">;
};

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "BrowseProductList_item",
  "selections": [
    (v0/*: any*/),
    (v1/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "slug",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "Brand",
      "kind": "LinkedField",
      "name": "brand",
      "plural": false,
      "selections": [
        (v0/*: any*/),
        (v1/*: any*/)
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "ProductAttributeValue",
      "kind": "LinkedField",
      "name": "currentAttributes",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "code",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "displayName",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "valueText",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "sortOrder",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "Product",
  "abstractKey": null
};
})();

(node as any).hash = "2f19dbcd17879021529787b65c7a6e8c";

export default node;
