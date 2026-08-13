/**
 * @generated SignedSource<<045a068970a917b52c2472b3a3d53fda>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type OfferDiscoveryList_connection$data = {
  readonly edges: ReadonlyArray<{
    readonly node: {
      readonly activeCoupons: {
        readonly edges: ReadonlyArray<{
          readonly cursor: string;
        }>;
        readonly pageInfo: {
          readonly hasNextPage: boolean;
        };
      } | null;
      readonly currency: string;
      readonly id: string;
      readonly latestPrice: {
        readonly price: string;
      } | null;
      readonly merchant: {
        readonly id: string;
        readonly name: string;
      } | null;
      readonly url: string;
      readonly " $fragmentSpreads": FragmentRefs<"OfferDiscoveryCard_offer">;
    };
  }>;
  readonly pageInfo: {
    readonly endCursor: string | null;
    readonly hasNextPage: boolean;
    readonly hasPreviousPage: boolean;
  };
  readonly " $fragmentType": "OfferDiscoveryList_connection";
};
export type OfferDiscoveryList_connection$key = {
  readonly " $data"?: OfferDiscoveryList_connection$data;
  readonly " $fragmentSpreads": FragmentRefs<"OfferDiscoveryList_connection">;
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
  "name": "hasNextPage",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "OfferDiscoveryList_connection",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "MerchantProductEdge",
      "kind": "LinkedField",
      "name": "edges",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "MerchantProduct",
          "kind": "LinkedField",
          "name": "node",
          "plural": false,
          "selections": [
            (v0/*: any*/),
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "url",
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
              "concreteType": "Merchant",
              "kind": "LinkedField",
              "name": "merchant",
              "plural": false,
              "selections": [
                (v0/*: any*/),
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "name",
                  "storageKey": null
                }
              ],
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "concreteType": "PricePoint",
              "kind": "LinkedField",
              "name": "latestPrice",
              "plural": false,
              "selections": [
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "price",
                  "storageKey": null
                }
              ],
              "storageKey": null
            },
            {
              "alias": null,
              "args": [
                {
                  "kind": "Literal",
                  "name": "first",
                  "value": 2
                }
              ],
              "concreteType": "ActiveCouponConnection",
              "kind": "LinkedField",
              "name": "activeCoupons",
              "plural": false,
              "selections": [
                {
                  "alias": null,
                  "args": null,
                  "concreteType": "ActiveCouponEdge",
                  "kind": "LinkedField",
                  "name": "edges",
                  "plural": true,
                  "selections": [
                    {
                      "alias": null,
                      "args": null,
                      "kind": "ScalarField",
                      "name": "cursor",
                      "storageKey": null
                    }
                  ],
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "concreteType": "PageInfo",
                  "kind": "LinkedField",
                  "name": "pageInfo",
                  "plural": false,
                  "selections": [
                    (v1/*: any*/)
                  ],
                  "storageKey": null
                }
              ],
              "storageKey": "activeCoupons(first:2)"
            },
            {
              "args": null,
              "kind": "FragmentSpread",
              "name": "OfferDiscoveryCard_offer"
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "PageInfo",
      "kind": "LinkedField",
      "name": "pageInfo",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "endCursor",
          "storageKey": null
        },
        (v1/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "hasPreviousPage",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "MerchantProductConnection",
  "abstractKey": null
};
})();

(node as any).hash = "41b2be7db386946cc27c6e63afff40e3";

export default node;
