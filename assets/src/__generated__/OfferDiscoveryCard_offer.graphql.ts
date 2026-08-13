/**
 * @generated SignedSource<<9b7a52bcf08824949ae0a47866a976f2>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type CouponDiscountType = "AMOUNT" | "FREE_SHIPPING" | "OTHER" | "PERCENT" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type OfferDiscoveryCard_offer$data = {
  readonly activeCoupons: {
    readonly edges: ReadonlyArray<{
      readonly cursor: string;
      readonly node: {
        readonly code: string;
        readonly currency: string | null | undefined;
        readonly description: string | null | undefined;
        readonly discountType: CouponDiscountType;
        readonly discountValue: string | null | undefined;
        readonly terms: string | null | undefined;
        readonly validTo: string | null | undefined;
      };
    }>;
    readonly pageInfo: {
      readonly hasNextPage: boolean;
    };
  } | null | undefined;
  readonly currency: string;
  readonly id: string;
  readonly isActive: boolean;
  readonly lastSeenAt: string | null | undefined;
  readonly latestPrice: {
    readonly id: string;
    readonly observedAt: string;
    readonly price: string;
  } | null | undefined;
  readonly merchant: {
    readonly domain: string;
    readonly id: string;
    readonly name: string;
  } | null | undefined;
  readonly priceHistory: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly observedAt: string;
        readonly price: string;
      };
    }>;
    readonly pageInfo: {
      readonly hasNextPage: boolean;
    };
  } | null | undefined;
  readonly product: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
  } | null | undefined;
  readonly url: string;
  readonly " $fragmentType": "OfferDiscoveryCard_offer";
};
export type OfferDiscoveryCard_offer$key = {
  readonly " $data"?: OfferDiscoveryCard_offer$data;
  readonly " $fragmentSpreads": FragmentRefs<"OfferDiscoveryCard_offer">;
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
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v3 = [
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
v4 = {
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
      "name": "hasNextPage",
      "storageKey": null
    }
  ],
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "OfferDiscoveryCard_offer",
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
      "kind": "ScalarField",
      "name": "lastSeenAt",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "isActive",
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
        (v2/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "domain",
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "Product",
      "kind": "LinkedField",
      "name": "product",
      "plural": false,
      "selections": [
        (v0/*: any*/),
        (v2/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "slug",
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
      "selections": (v3/*: any*/),
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
              "selections": (v3/*: any*/),
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
  "type": "MerchantProduct",
  "abstractKey": null
};
})();

(node as any).hash = "85e0048506c9beeb72ed9c2c7b7b442e";

export default node;
