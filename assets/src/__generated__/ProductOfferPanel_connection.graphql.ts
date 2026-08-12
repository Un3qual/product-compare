/**
 * @generated SignedSource<<9a5603877dace6cd626fd83bb0fec6d8>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type CouponDiscountType = "AMOUNT" | "FREE_SHIPPING" | "OTHER" | "PERCENT" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type ProductOfferPanel_connection$data = {
  readonly edges: ReadonlyArray<{
    readonly node: {
      readonly activeCoupons: {
        readonly edges: ReadonlyArray<{
          readonly cursor: string;
          readonly node: {
            readonly code: string;
            readonly currency: string | null | undefined;
            readonly description: string | null | undefined;
            readonly discountType: CouponDiscountType;
            readonly discountValue: any | null | undefined;
            readonly terms: string | null | undefined;
            readonly validTo: any | null | undefined;
          };
        }>;
        readonly pageInfo: {
          readonly hasNextPage: boolean;
        };
      } | null | undefined;
      readonly currency: string;
      readonly id: string;
      readonly latestPrice: {
        readonly id: string;
        readonly observedAt: any;
        readonly price: any;
      } | null | undefined;
      readonly merchant: {
        readonly id: string;
        readonly name: string;
      } | null | undefined;
      readonly priceHistory: {
        readonly edges: ReadonlyArray<{
          readonly node: {
            readonly id: string;
            readonly observedAt: any;
            readonly price: any;
          };
        }>;
        readonly pageInfo: {
          readonly hasNextPage: boolean;
        };
      } | null | undefined;
      readonly url: string;
    };
  }>;
  readonly pageInfo: {
    readonly endCursor: string | null | undefined;
    readonly hasNextPage: boolean;
  };
  readonly " $fragmentType": "ProductOfferPanel_connection";
};
export type ProductOfferPanel_connection$key = {
  readonly " $data"?: ProductOfferPanel_connection$data;
  readonly " $fragmentSpreads": FragmentRefs<"ProductOfferPanel_connection">;
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
  "name": "currency",
  "storageKey": null
},
v2 = [
  (v0/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "price",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "observedAt",
    "storageKey": null
  }
],
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "hasNextPage",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "concreteType": "PageInfo",
  "kind": "LinkedField",
  "name": "pageInfo",
  "plural": false,
  "selections": [
    (v3/*: any*/)
  ],
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ProductOfferPanel_connection",
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
            (v1/*: any*/),
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
              "selections": (v2/*: any*/),
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
                    },
                    {
                      "alias": null,
                      "args": null,
                      "concreteType": "ActiveCoupon",
                      "kind": "LinkedField",
                      "name": "node",
                      "plural": false,
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
                          "name": "description",
                          "storageKey": null
                        },
                        {
                          "alias": null,
                          "args": null,
                          "kind": "ScalarField",
                          "name": "discountType",
                          "storageKey": null
                        },
                        {
                          "alias": null,
                          "args": null,
                          "kind": "ScalarField",
                          "name": "discountValue",
                          "storageKey": null
                        },
                        (v1/*: any*/),
                        {
                          "alias": null,
                          "args": null,
                          "kind": "ScalarField",
                          "name": "validTo",
                          "storageKey": null
                        },
                        {
                          "alias": null,
                          "args": null,
                          "kind": "ScalarField",
                          "name": "terms",
                          "storageKey": null
                        }
                      ],
                      "storageKey": null
                    }
                  ],
                  "storageKey": null
                },
                (v4/*: any*/)
              ],
              "storageKey": "activeCoupons(first:2)"
            },
            {
              "alias": null,
              "args": [
                {
                  "kind": "Literal",
                  "name": "first",
                  "value": 12
                }
              ],
              "concreteType": "PricePointConnection",
              "kind": "LinkedField",
              "name": "priceHistory",
              "plural": false,
              "selections": [
                {
                  "alias": null,
                  "args": null,
                  "concreteType": "PricePointEdge",
                  "kind": "LinkedField",
                  "name": "edges",
                  "plural": true,
                  "selections": [
                    {
                      "alias": null,
                      "args": null,
                      "concreteType": "PricePoint",
                      "kind": "LinkedField",
                      "name": "node",
                      "plural": false,
                      "selections": (v2/*: any*/),
                      "storageKey": null
                    }
                  ],
                  "storageKey": null
                },
                (v4/*: any*/)
              ],
              "storageKey": "priceHistory(first:12)"
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
        (v3/*: any*/)
      ],
      "storageKey": null
    }
  ],
  "type": "MerchantProductConnection",
  "abstractKey": null
};
})();

(node as any).hash = "4f0fe6ea03c2fdc2fd34ead0394f48f1";

export default node;
