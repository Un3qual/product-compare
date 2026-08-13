/**
 * @generated SignedSource<<374007cfa3d34ffd22f1357d0935bd92>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type CompareProductList_product$data = {
  readonly brand: {
    readonly name: string;
  } | null;
  readonly currentAttributes: ReadonlyArray<{
    readonly attributeId: string;
    readonly booleanValue: boolean | null;
    readonly code: string;
    readonly dataType: string;
    readonly displayName: string;
    readonly enumOptionId: string | null;
    readonly groupLabel: string | null;
    readonly isRequired: boolean;
    readonly numericValue: string | null;
    readonly sortOrder: number | null;
    readonly unitSymbol: string | null;
    readonly valueText: string;
  }>;
  readonly description: string | null;
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly " $fragmentType": "CompareProductList_product";
};
export type CompareProductList_product$key = {
  readonly " $data"?: CompareProductList_product$data;
  readonly " $fragmentSpreads": FragmentRefs<"CompareProductList_product">;
};

const node: ReaderFragment = (function(){
var v0 = {
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
  "name": "CompareProductList_product",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "id",
      "storageKey": null
    },
    (v0/*:: as any*/),
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
      "kind": "ScalarField",
      "name": "description",
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
        (v0/*:: as any*/)
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
          "name": "attributeId",
          "storageKey": null
        },
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
          "name": "dataType",
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
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "groupLabel",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "isRequired",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "numericValue",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "booleanValue",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "enumOptionId",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "unitSymbol",
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

(node as any).hash = "5f41f714b14508156c6f2cda9befe7b9";

export default node;
