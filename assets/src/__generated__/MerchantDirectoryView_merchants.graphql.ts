/**
 * @generated SignedSource<<8d5c421d143b000ab055c52bccbacd30>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type MerchantDirectoryView_merchants$data = {
  readonly edges: ReadonlyArray<{
    readonly node: {
      readonly id: string;
      readonly name: string;
      readonly " $fragmentSpreads": FragmentRefs<"MerchantDirectoryView_item">;
    };
  }>;
  readonly " $fragmentType": "MerchantDirectoryView_merchants";
};
export type MerchantDirectoryView_merchants$key = {
  readonly " $data"?: MerchantDirectoryView_merchants$data;
  readonly " $fragmentSpreads": FragmentRefs<"MerchantDirectoryView_merchants">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "MerchantDirectoryView_merchants",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "MerchantEdge",
      "kind": "LinkedField",
      "name": "edges",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "Merchant",
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
              "args": null,
              "kind": "FragmentSpread",
              "name": "MerchantDirectoryView_item"
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "MerchantConnection",
  "abstractKey": null
};

(node as any).hash = "e13919e0278825efe81eedfc119157b8";

export default node;
